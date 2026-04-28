import AgoraRTC, { IAgoraRTCClient, IMicrophoneAudioTrack, ICameraVideoTrack, ILocalTrack } from 'agora-rtc-sdk-ng';

const APP_ID = import.meta.env.VITE_AGORA_APP_ID || ''; 

class AgoraService {
  private client: IAgoraRTCClient | null = null;
  private localAudioTrack: IMicrophoneAudioTrack | null = null;
  private localVideoTrack: ICameraVideoTrack | null = null;
  private isInitialized = false;

  async init() {
    if (this.isInitialized) return;
    this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    this.isInitialized = true;
  }

  async join(channel: string, uid: string | number, type: 'voice' | 'video' = 'voice', token: string | null = null) {
    await this.init();
    if (!APP_ID) {
        console.warn('[AgoraService] App ID not found. Calls might not work.');
        return;
    }
    
    try {
      await this.client!.join(APP_ID, channel, token, uid);
      
      const tracks: ILocalTrack[] = [];
      
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      tracks.push(this.localAudioTrack);

      if (type === 'video') {
        try {
          this.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
          tracks.push(this.localVideoTrack);
        } catch (vErr) {
          console.error('[AgoraService] Camera error:', vErr);
        }
      }

      await this.client!.publish(tracks);
      console.log(`[AgoraService] Joined channel ${channel} as ${type}`);
    } catch (error) {
      console.error('[AgoraService] Join error:', error);
      throw error;
    }
  }

  async leave() {
    try {
      if (this.localAudioTrack) {
        this.localAudioTrack.stop();
        this.localAudioTrack.close();
        this.localAudioTrack = null;
      }
      if (this.localVideoTrack) {
        this.localVideoTrack.stop();
        this.localVideoTrack.close();
        this.localVideoTrack = null;
      }
      if (this.client) {
        await this.client.leave();
      }
      console.log('[AgoraService] Left channel');
    } catch (error) {
      console.error('[AgoraService] Leave error:', error);
    }
  }

  onUserPublished(callback: (user: any, mediaType: 'audio' | 'video') => void) {
    this.client?.on('user-published', callback);
  }

  onUserUnpublished(callback: (user: any) => void) {
    this.client?.on('user-unpublished', callback);
  }

  async subscribe(user: any, mediaType: 'audio' | 'video') {
    if (!this.client) return;
    try {
      await this.client.subscribe(user, mediaType);
      if (mediaType === 'audio') {
        user.audioTrack?.play();
      }
    } catch (error) {
      console.error('[AgoraService] Subscribe error:', error);
    }
  }
}

export const agoraService = new AgoraService();
