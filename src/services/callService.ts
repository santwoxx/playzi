import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  serverTimestamp,
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Call, IceCandidate } from '../types';

export const callService = {
  async startCall(callerId: string, receiverId: string, type: 'voice' | 'video' = 'video'): Promise<string> {
    const callRef = doc(collection(db, 'calls'));
    const callData: Partial<Call> = {
      id: callRef.id,
      callerId,
      receiverId,
      participants: [callerId, receiverId],
      status: 'calling',
      type,
      createdAt: serverTimestamp()
    };
    
    await setDoc(callRef, callData);
    return callRef.id;
  },

  listenIncomingCalls(userId: string, callback: (call: Call) => void) {
    const q = query(
      collection(db, 'calls'),
      where('receiverId', '==', userId),
      where('status', '==', 'calling'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          callback({ id: change.doc.id, ...change.doc.data() } as Call);
        }
      });
    });
  },

  async acceptCall(callId: string, answer?: RTCSessionDescriptionInit) {
    const updateData: any = {
      status: 'accepted'
    };
    if (answer) {
      updateData.answer = {
        type: answer.type,
        sdp: answer.sdp
      };
    }
    await updateDoc(doc(db, 'calls', callId), updateData);
  },

  async rejectCall(callId: string) {
    await updateDoc(doc(db, 'calls', callId), {
      status: 'rejected'
    });
  },

  async endCall(callId: string) {
    await updateDoc(doc(db, 'calls', callId), {
      status: 'ended'
    });
    
    // Optional: Clean up candidates after some time or immediately
    // For now we just mark as ended.
  },

  async updateOffer(callId: string, offer: RTCSessionDescriptionInit) {
    await updateDoc(doc(db, 'calls', callId), {
      offer: {
        type: offer.type,
        sdp: offer.sdp
      }
    });
  },

  async sendIceCandidate(callId: string, senderId: string, candidate: RTCIceCandidate) {
    const candidacyRef = collection(db, 'calls', callId, 'candidates');
    await addDoc(candidacyRef, {
      candidate: candidate.toJSON(),
      senderId,
      createdAt: serverTimestamp()
    });
  },

  listenCall(callId: string, callback: (call: Call) => void) {
    return onSnapshot(doc(db, 'calls', callId), (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as Call);
      }
    });
  },

  listenIceCandidates(callId: string, userId: string, callback: (candidate: RTCIceCandidateInit) => void) {
    const q = query(
      collection(db, 'calls', callId, 'candidates'),
      where('senderId', '!=', userId)
    );

    return onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          callback(data.candidate);
        }
      });
    });
  },

  async cleanupCall(callId: string) {
    // Delete candidates
    const candidatesRef = collection(db, 'calls', callId, 'candidates');
    const snapshot = await getDocs(candidatesRef);
    const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletePromises);
    
    // Optionally delete the call doc or keep for history
    // await deleteDoc(doc(db, 'calls', callId));
  }
};
