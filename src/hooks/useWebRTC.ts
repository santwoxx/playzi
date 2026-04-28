import { useState, useEffect, useRef, useCallback } from 'react';
import { callService } from '../services/callService';
import { agoraService } from '../services/agoraService';
import { Call } from '../types';

/**
 * Hook universal de chamadas otimizado com Agora.io para zero lag.
 */
export function useWebRTC(userId: string) {
  const [currentCall, setCurrentCall] = useState<Call | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  
  // Streams for backward compatibility with existing UI if needed
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const callUnsubscribe = useRef<(() => void) | null>(null);

  const cleanup = useCallback(async () => {
    console.log('[useWebRTC] Cleaning up call...');
    await agoraService.leave();
    
    if (callUnsubscribe.current) {
      callUnsubscribe.current();
      callUnsubscribe.current = null;
    }

    setCurrentCall(null);
    setIsCalling(false);
    setIsIncomingCall(false);
    setRemoteUsers([]);
    setLocalStream(null);
    setRemoteStream(null);
  }, []);

  const handleAgoraEvents = useCallback(() => {
    agoraService.onUserPublished(async (user, mediaType) => {
      console.log('[useWebRTC] User published:', user.uid, mediaType);
      await agoraService.subscribe(user, mediaType);
      
      if (mediaType === 'audio') {
        setRemoteUsers(prev => [...prev.filter(u => u.uid !== user.uid), user]);
      }
    });

    agoraService.onUserUnpublished((user) => {
      console.log('[useWebRTC] User unpublished:', user.uid);
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
    });
  }, []);

  const startCall = async (receiverId: string, type: 'voice' | 'video' = 'voice') => {
    try {
      console.log('[useWebRTC] Starting Agora call...');
      const callId = await callService.startCall(userId, receiverId, type);
      
      // Usamos o callId como o nome do canal no Agora
      await agoraService.join(callId, userId, type);
      handleAgoraEvents();
      
      setIsCalling(true);
      
      callUnsubscribe.current = callService.listenCall(callId, async (call) => {
        setCurrentCall(call);
        if (call.status === 'rejected' || call.status === 'ended') {
          cleanup();
        }
      });
    } catch (err) {
      console.error('[useWebRTC] Failed to start call:', err);
      cleanup();
    }
  };

  const joinCall = async (call: Call) => {
    try {
      console.log('[useWebRTC] Joining Agora call:', call.id);
      await agoraService.join(call.id, userId, call.type);
      handleAgoraEvents();
      
      setCurrentCall(call);
      // Notificamos que aceitamos a chamada no Firestore
      await callService.acceptCall(call.id, { type: 'answer', sdp: 'agora' } as any);
      setIsIncomingCall(false);

      callUnsubscribe.current = callService.listenCall(call.id, (updatedCall) => {
        setCurrentCall(updatedCall);
        if (updatedCall.status === 'ended' || updatedCall.status === 'rejected') {
          cleanup();
        }
      });
    } catch (err) {
      console.error('[useWebRTC] Failed to join call:', err);
      cleanup();
    }
  };

  const endCall = async () => {
    if (currentCall) {
      await callService.endCall(currentCall.id);
    }
    cleanup();
  };

  const rejectCall = async () => {
    if (currentCall) {
      await callService.rejectCall(currentCall.id);
    }
    cleanup();
  };

  // Listener global para chamadas recebidas via Firestore
  useEffect(() => {
    if (!userId) return;

    const unsub = callService.listenIncomingCalls(userId, (call) => {
      if (!currentCall) {
        console.log('[useWebRTC] Incoming call detected:', call.id);
        setCurrentCall(call);
        setIsIncomingCall(true);
      }
    });

    return () => unsub();
  }, [userId, currentCall]);

  return {
    localStream,
    remoteStream,
    remoteUsers,
    currentCall,
    isCalling,
    isIncomingCall,
    startCall,
    joinCall,
    endCall,
    rejectCall,
  };
}
