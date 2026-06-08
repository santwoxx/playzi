import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, deleteUser } from 'firebase/auth';
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
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    if (auth.currentUser) {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        setCurrentUser(userDoc.data() as User);
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
    return onAuthStateChanged(auth, async (firebaseUser) => {
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

        onValue(ref(rtdb, '.info/connected'), (snapshot) => {
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
          const newUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || null,
            displayName: firebaseUser.displayName || (firebaseUser.isAnonymous ? 'Visitante' : firebaseUser.email?.split('@')[0] || 'User'),
            photoURL: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${firebaseUser.isAnonymous ? 'Guest' : firebaseUser.email || 'User'}&background=0D0E12&color=fff`,
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
        } else {
          await updateDoc(doc(db, 'users', firebaseUser.uid), lastLoginUpdate);
          setCurrentUser({ ...userDoc.data() as User, ...lastLoginUpdate });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
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

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, register, loginAnonymous, logout, refreshUser, deleteAccount }}>
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
