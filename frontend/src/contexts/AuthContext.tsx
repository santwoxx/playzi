import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, deleteUser, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signInWithPopup } from 'firebase/auth';
import { auth, db, rtdb } from '../lib/firebase';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { ref, onValue, set, onDisconnect, serverTimestamp as rtdbTimestamp, remove } from 'firebase/database';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string) => Promise<void>;
  loginAnonymous: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const CACHED_USER_KEY = 'playzi_cached_user';

const getCachedUser = (): User | null => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(CACHED_USER_KEY) : null;
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const cachedUser = getCachedUser();
  const [currentUser, setCurrentUser] = useState<User | null>(cachedUser);
  const [loading, setLoading] = useState<boolean>(!cachedUser);

  const refreshUser = async () => {
    if (auth.currentUser) {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        setCurrentUser(userData);
        try {
          localStorage.setItem(CACHED_USER_KEY, JSON.stringify(userData));
        } catch {}
      }
    }
  };

  const deleteAccount = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // 1. Delete Firestore user data
      await deleteDoc(doc(db, 'users', user.uid));

      // 2. Delete user posts
      const postsQuery = query(collection(db, 'posts'), where('userId', '==', user.uid));
      const postsSnapshot = await getDocs(postsQuery);
      const batch = writeBatch(db);
      postsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      // 3. Clear presence
      await remove(ref(rtdb, `/presence/${user.uid}`));

      // 4. Delete the Auth account
      await deleteUser(user);
    } catch (error) {
      console.error('Error in account deletion:', error);
      throw error;
    }
  };

  useEffect(() => {
    getRedirectResult(auth).catch((error) => {
      console.error('Redirect sign-in error:', error.code, error.message);
    });

    // Presence listener of the signed-in account
    let stopPresence: (() => void) | null = null;

    const syncUser = async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Presence logic
        const userStatusDatabaseRef = ref(rtdb, `/presence/${firebaseUser.uid}`);
        const isOfflineForDatabase = {
          online: false,
          lastSeen: rtdbTimestamp(),
        };
        const isOnlineForDatabase = {
          online: true,
          lastSeen: rtdbTimestamp(),
        };

        stopPresence = onValue(ref(rtdb, '.info/connected'), (snapshot) => {
          if (snapshot.val() === false) return;
          onDisconnect(userStatusDatabaseRef).set(isOfflineForDatabase).then(() => {
            set(userStatusDatabaseRef, isOnlineForDatabase);
            // Also update firestore to online
            updateDoc(doc(db, 'users', firebaseUser.uid), { status: 'online' }).catch(console.error);
          });
          
          // When user disconnects, set status to offline in firestore
          // Note: This relies on someone else cleaning up or a cloud function usually,
          // but we can try to use a dummy write if needed or just accept the limitation.
          // In this environment, we'll stick to updating RTDB and we'll use RTDB for real-time lists if possible,
          // but for now let's just make sure we set online.
        });

        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        // Update lastLoginAt on session start
        const lastLoginUpdate = {
          lastLoginAt: new Date().toISOString()
        };

        if (!userDoc.exists()) {
          const nameFallback = firebaseUser.displayName || (firebaseUser.isAnonymous ? 'Visitante' : firebaseUser.email?.split('@')[0] || 'User');
          const newUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || null,
            displayName: nameFallback,
            nickname: nameFallback.slice(0, 32),
            // The fallback avatar uses the name, never the e-mail (photoURL is public and goes to a third-party service)
            photoURL: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(nameFallback)}&background=0D0E12&color=fff`,
            bio: '',
            onboarded: false,
            favoriteGames: [],
            friends: [],
            blocks: [],
            status: 'online',
            xp: 0,
            level: 1,
            rankTitle: 'Novato',
            coins: 500,
            gems: 10,
            statusMessage: 'Pronto para o jogo!',
            mood: 'gaming',
            totalOnlineTime: 0,
            medals: [],
            achievements: [],
            isAnonymous: firebaseUser.isAnonymous,
            privacySettings: {
              whoCanMessage: 'everyone',
              blockScreenshots: false
            },
            ...lastLoginUpdate
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          setCurrentUser(newUser);
          try {
            localStorage.setItem(CACHED_USER_KEY, JSON.stringify(newUser));
          } catch {}
        } else {
          // Atualiza em background sem travar o carregamento inicial da página
          updateDoc(doc(db, 'users', firebaseUser.uid), lastLoginUpdate).catch(console.error);
          const fullUser = { ...userDoc.data() as User, ...lastLoginUpdate };
          setCurrentUser(fullUser);
          try {
            localStorage.setItem(CACHED_USER_KEY, JSON.stringify(fullUser));
          } catch {}
        }
      } else {
        try {
          localStorage.removeItem(CACHED_USER_KEY);
        } catch {}
        setCurrentUser(null);
      }
    };

    const stopAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Drop the previous account's presence listener (it kept writing after logout or account switch)
      stopPresence?.();
      stopPresence = null;
      // Never leave the app stuck on the loader if loading the profile fails (offline, rules...)
      syncUser(firebaseUser)
        .catch((error) => console.error('Erro ao carregar a sessão:', error))
        .finally(() => setLoading(false));
    });

    return () => {
      stopAuth();
      stopPresence?.();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const register = async (email: string, pass: string) => {
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const loginAnonymous = async () => {
    await signInAnonymously(auth);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (popupError: any) {
      // Closing the popup is the user's choice, not a reason to redirect the whole page
      if (popupError?.code === 'auth/popup-closed-by-user' || popupError?.code === 'auth/cancelled-popup-request') return;
      console.warn("signInWithPopup falhou ou foi bloqueado, tentando signInWithRedirect...", popupError);
      await signInWithRedirect(auth, provider);
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem(CACHED_USER_KEY);
    } catch {}
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, register, loginAnonymous, loginWithGoogle, logout, refreshUser, deleteAccount }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
