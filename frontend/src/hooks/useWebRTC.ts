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

/**
 * Mecanismo de 'Heartbeat' que compara periodicamente o tempo do player de vídeo
 * com o servidor e faz ajustes finos apenas se o desvio for maior que 1 segundo.
 * Isso evita que o vídeo fique reiniciando ou entrando em loops de sincronização instáveis.
 */
export function usePlayerSyncHeartbeat(
  playerRef: any,
  isVideoYoutube: boolean,
  room: any,
  roomId: string,
  isHost: boolean,
  isSyncingRef: React.MutableRefObject<boolean>,
  videoElementRef?: React.RefObject<HTMLVideoElement | null>
) {
  useEffect(() => {
    if (!roomId || !room || isHost) return;

    const interval = setInterval(() => {
      if (isSyncingRef.current) return;

      // Cálculo do tempo alvo com ajuste fino de latência
      const now = Date.now();
      const serverUpdatedAt = room.updatedAt || now;
      let latencyAdjustment = room.playing ? (now - serverUpdatedAt) / 1000 : 0;
      
      // Sanitização de latência irrealista para evitar saltos ou reinícios indesejados
      if (latencyAdjustment < 0 || latencyAdjustment > 15) {
        latencyAdjustment = 0;
      }
      
      const targetTime = Math.max(0, room.currentTime + latencyAdjustment);

      if (isVideoYoutube && playerRef.current) {
        try {
          const playerState = typeof playerRef.current.getPlayerState === 'function' ? playerRef.current.getPlayerState() : -1;
          const localTime = typeof playerRef.current.getCurrentTime === 'function' ? playerRef.current.getCurrentTime() : 0;

          // Ajustes finos APENAS se o desvio for superior a 1 segundo para maior estabilidade
          const desvio = Math.abs(localTime - targetTime);
          if (desvio > 1.0) {
            console.log(`[useWebRTC Heartbeat] Desvio detectado no YouTube de ${desvio.toFixed(2)}s. Ajustando de ${localTime.toFixed(2)}s para ${targetTime.toFixed(2)}s.`);
            
            isSyncingRef.current = true;
            
            if (typeof playerRef.current.seekTo === 'function') {
              playerRef.current.seekTo(targetTime, true);
            }

            // Garante o status de play/pause correto sem loops
            if (room.playing && playerState !== 1) { // 1 = YT.PlayerState.PLAYING
              if (typeof playerRef.current.playVideo === 'function') playerRef.current.playVideo();
            } else if (!room.playing && playerState === 1) {
              if (typeof playerRef.current.pauseVideo === 'function') playerRef.current.pauseVideo();
            }

            setTimeout(() => {
              isSyncingRef.current = false;
            }, 800);
          }
        } catch (e) {
          console.warn("[useWebRTC Heartbeat] Falha ao executar heartbeat no YouTube player:", e);
        }
      } else if (videoElementRef && videoElementRef.current) {
        try {
          const localTime = videoElementRef.current.currentTime;
          const desvio = Math.abs(localTime - targetTime);

          // Ajustes finos APENAS se o desvio for superior a 1 segundo
          if (desvio > 1.0) {
            console.log(`[useWebRTC Heartbeat] Desvio detectado no vídeo local de ${desvio.toFixed(2)}s. Ajustando de ${localTime.toFixed(2)}s para ${targetTime.toFixed(2)}s.`);
            
            isSyncingRef.current = true;
            videoElementRef.current.currentTime = targetTime;

            if (room.playing && videoElementRef.current.paused) {
              videoElementRef.current.play().catch(() => {});
            } else if (!room.playing && !videoElementRef.current.paused) {
              videoElementRef.current.pause();
            }

            setTimeout(() => {
              isSyncingRef.current = false;
            }, 800);
          }
        } catch (e) {
          console.warn("[useWebRTC Heartbeat] Falha ao executar heartbeat no HTML5 video player:", e);
        }
      }
    }, 2500); // Executa periodicamente a cada 2.5s

    return () => clearInterval(interval);
  }, [roomId, room, isHost, isVideoYoutube, playerRef, videoElementRef, isSyncingRef]);
}
