import type { IAgoraRTCClient } from 'agora-rtc-sdk-ng';

const APP_ID = import.meta.env.VITE_AGORA_APP_ID;

let clientInstance: IAgoraRTCClient | null = null;

export const getAgoraClient = async (): Promise<IAgoraRTCClient> => {
  if (!clientInstance) {
    const agoraPkg = await import('agora-rtc-sdk-ng');
    // Same fallback as before, typed so tsc accepts it (the module namespace has no createClient)
    const AgoraRTC = agoraPkg.default ?? (agoraPkg as unknown as typeof agoraPkg.default);
    clientInstance = AgoraRTC.createClient({ 
      mode: 'rtc', 
      codec: 'vp8' 
    });
  }
  return clientInstance;
};

export const getAppId = () => APP_ID;
