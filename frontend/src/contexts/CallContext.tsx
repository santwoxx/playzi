import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';
import { useAuth } from './AuthContext';
import { Call } from '../types';
import IncomingCallModal from '../components/IncomingCallModal';
import CallScreen from '../components/CallScreen';

import { soundService } from '../services/soundService';

interface CallContextType {
  startCall: (receiverId: string, type?: 'voice' | 'video') => Promise<void>;
  endCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  joinCall: (call: Call) => Promise<void>;
  isCalling: boolean;
  isIncomingCall: boolean;
  currentCall: Call | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const webRTC = useWebRTC(currentUser?.uid || '');

  useEffect(() => {
    if (webRTC.isIncomingCall || (webRTC.isCalling && webRTC.currentCall?.status === 'calling')) {
      soundService.startLoop('call-ring');
    } else {
      soundService.stopLoop('call-ring');
    }

    return () => {
      soundService.stopLoop('call-ring');
    };
  }, [webRTC.isIncomingCall, webRTC.isCalling, webRTC.currentCall?.status]);

  return (
    <CallContext.Provider value={webRTC}>
      {children}
      
      {/* Global Call Overlays */}
      {webRTC.isIncomingCall && webRTC.currentCall && (
        <IncomingCallModal 
          call={webRTC.currentCall} 
          onAccept={() => webRTC.joinCall(webRTC.currentCall!)}
          onReject={() => webRTC.rejectCall()}
        />
      )}
      
      {(webRTC.isCalling || (webRTC.currentCall && webRTC.currentCall.status === 'accepted')) && (
        <CallScreen 
          call={webRTC.currentCall!}
          localStream={webRTC.localStream}
          remoteStream={webRTC.remoteStream}
          remoteUsers={(webRTC as any).remoteUsers || []}
          onEnd={webRTC.endCall}
        />
      )}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}
