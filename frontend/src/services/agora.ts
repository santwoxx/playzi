import type { IAgoraRTCClient } from 'agora-rtc-sdk-ng';

const APP_ID = import.meta.env.VITE_AGORA_APP_ID;

let clientInstance: IAgoraRTCClient | null = null;

export const getAgoraClient = async (): Promise<IAgoraRTCClient> => {
  if (!clientInstance) {
    const agoraPkg = await import('agora-rtc-sdk-ng');
    const AgoraRTC = agoraPkg.default || agoraPkg;
    clientInstance = AgoraRTC.createClient({ 
      mode: 'rtc', 
      codec: 'vp8' 
    });
  }
  return clientInstance;
};

export const getAppId = () => APP_ID;
