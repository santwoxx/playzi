export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  photos?: string[];
  bio?: string;
  nickname?: string;
  username?: string;
  gender?: 'male' | 'female' | 'other';
  interestedIn?: ('male' | 'female' | 'other')[];
  location?: {
    city?: string;
    state?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  age?: number;
  region?: string;
  interests?: string[];
  streak?: number;
  victories?: number;
  tickets?: number;
  lastRewardDate?: string;
  playStyle?: 'casual' | 'competitive' | 'duo' | 'squad';
  frequency?: 'daily' | 'weekends' | 'casual';
  behavior?: 'chill' | 'tryhard' | 'leader' | 'funny';
  relationshipStatus?: 'single' | 'dating' | 'married' | 'searching' | 'open';
  birthday?: string;
  favoriteGames?: string[];
  country?: string;
  onboarded?: boolean;
  friends?: string[];
  followers?: string[];
  following?: string[];
  blocks?: string[];
  chatSlots?: number;
  contactedUids?: string[];
  privacyAgeHidden?: boolean;
  status?: 'online' | 'offline' | 'away' | 'playing' | 'searching';
  // Gamer Social Ranking
  xp: number;
  level: number;
  rankTitle: 'Novato' | 'Pro Player' | 'Elite' | 'Legend' | 'Mythic';
  // Virtual Currency
  coins: number;
  gems: number;
  // Customization
  profileFrame?: string;
  profileTheme?: string;
  // Interactive Stats
  statusMessage?: string;
  favoriteMusic?: string;
  mood?: string;
  currentGame?: string;
  currentIntent?: 'playing' | 'chatting' | 'competitive' | 'friendship';
  reputation?: {
    average: number;
    count: number;
    communication: number;
    respect: number;
    gameplay: number;
  };
  badges?: string[];
  totalOnlineTime?: number; // in minutes
  lastLoginAt?: any;
  medals?: string[];
  achievements?: string[];
  isAnonymous?: boolean;
  // Referral System
  referralCode?: string;
  referredBy?: string;
  referralCount?: number;
  referralRewardsClaimed?: string[]; // IDs of rewards already claimed
  // Social Links
  links?: {
    id: string;
    label: string;
    url: string;
    type: 'steam' | 'epic' | 'twitch' | 'discord' | 'youtube' | 'instagram' | 'twitter' | 'other';
  }[];
  rewards?: {
    installedApp?: boolean;
    notificationsEnabled?: boolean;
  };
  privacySettings?: {
    whoCanMessage: 'everyone' | 'friends' | 'friendsOfFriends' | 'nobody';
    blockScreenshots: boolean;
    hiddenChatsPin?: string;
  };
  matches?: string[];
  swipesCount?: number;
}

export interface Swipe {
  id: string;
  fromUserId: string;
  toUserId: string;
  type: 'like' | 'dislike';
  createdAt: any;
}

export interface Match {
  id: string;
  userIds: string[];
  createdAt: any;
  chatCreated: boolean;
  chatId?: string;
}

export interface Call {
  id: string;
  callerId: string;
  receiverId: string;
  participants: string[];
  status: 'calling' | 'accepted' | 'rejected' | 'ended';
  type: 'voice' | 'video';
  offer?: any;
  answer?: any;
  createdAt: any;
}

export interface IceCandidate {
  id: string;
  candidate: any;
  senderId: string;
  createdAt: any;
}

export interface Community {
  id: string;
  name: string;
  category: string;
  description: string;
  members: string[]; // uids
  icon: string;
}

export interface VoiceRoom {
  id: string;
  communityId: string;
  name: string;
  participants: string[]; // uids of people currently in call
}

export interface Story {
  id: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL: string | null;
  mediaUrl: string;
  type: 'image' | 'video';
  createdAt: any;
  expiresAt: any;
  viewers: string[];
}

export interface Post {
  id: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL: string | null;
  type: 'image' | 'video' | 'text';
  mediaUrl?: string;
  mediaUrls?: string[];
  caption: string;
  backgroundColor?: string;
  likes: string[]; // Array of user IDs
  commentCount: number;
  createdAt: any; // Firestore Timestamp
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL: string | null;
  text: string;
  createdAt: any;
  parentId?: string;
  replyToNickname?: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  isEncrypted: boolean;
  isAnonymous?: boolean;
  senderName?: string;
  senderPhoto?: string;
  expiresAt?: any;
  viewed?: boolean;
  createdAt: any;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: string;
  updatedAt: any;
  security?: {
    isEncrypted: boolean;
    isTemporary: boolean;
    autoDelete24h: boolean;
    isHidden: boolean;
    isAnonymous?: boolean;
    encryptionKey?: string; // Encrypted for each participant or shared
  };
  mutedBy?: string[];
}

export interface MinigameSession {
  id: string;
  type: 'quiz' | 'reflex' | 'rps' | 'guess' | 'duel';
  players: string[];
  state: 'waiting' | 'playing' | 'finished';
  data: any;
  winner?: string;
  updatedAt: any;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  coinReward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface InstantMatchRequest {
  id: string;
  userId: string;
  game: string;
  region: string;
  age: number;
  language: string;
  status: 'searching' | 'matched' | 'expired';
  matchedWith?: string;
  createdAt: any;
}
