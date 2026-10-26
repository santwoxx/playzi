import { auth } from '../lib/firebase';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const apiService = {
  async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const token = await user.getIdToken();
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Error bodies are not always JSON (e.g. a host or proxy "Not Found" page)
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `Serviço indisponível no momento (erro ${response.status}).`);
    }

    return response.json();
  },

  async createChat(targetUserId: string) {
    return this.fetchWithAuth('/createChat', {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    });
  },

  async sendMessage(chatId: string, content: string, metadata: any = {}) {
    return this.fetchWithAuth('/sendMessage', {
      method: 'POST',
      body: JSON.stringify({ chatId, content, ...metadata }),
    });
  },

  async incrementUsage(actionType: string) {
    return this.fetchWithAuth('/incrementUsage', {
      method: 'POST',
      body: JSON.stringify({ actionType }),
    });
  },

  async followUser(targetId: string, action: 'follow' | 'unfollow') {
    return this.fetchWithAuth('/follow', {
      method: 'POST',
      body: JSON.stringify({ targetId, action }),
    });
  },

  async checkVip() {
    return this.fetchWithAuth('/checkVip');
  },

  async getAIInsight(kind: 'icebreaker' | 'compatibility' | 'recommendation', targetUserId: string, intent?: string) {
    return this.fetchWithAuth('/ai/insight', {
      method: 'POST',
      body: JSON.stringify({ kind, targetUserId, intent }),
    });
  },

  async moderateText(text: string) {
    return this.fetchWithAuth('/moderation/text', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  async moderateImage(image: string, mimeType: string) {
    return this.fetchWithAuth('/moderation/image', {
      method: 'POST',
      body: JSON.stringify({ image, mimeType }),
    });
  }
};
