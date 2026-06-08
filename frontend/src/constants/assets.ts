const DICEBEAR_BASE = 'https://api.dicebear.com/7.x';

const MALE_SEEDS = [
  'Thor', 'Kratos', 'Max', 'Leo', 'Hunter', 'Blade',
  'Stone', 'Vortex', 'Rex', 'Ace', 'Jax', 'Cole',
  'Maverick', 'Duke', 'Odin', 'Kai', 'Zane', 'Ash'
];

const FEMALE_SEEDS = [
  'Lara', 'Zelda', 'Luna', 'Freya', 'Nova', 'Ara',
  'Lyra', 'Ivy', 'Maya', 'Rosa', 'Skye', 'Sage',
  'Misty', 'Raven', 'Willow', 'Jade', 'Violet', 'Alice'
];

const NEUTRAL_SEEDS = [
  'Neo', 'Shadow', 'Pixel', 'Echo', 'Cosmo', 'Zero',
  'Frost', 'Blaze', 'Storm', 'Ember', 'Ash', 'Grey'
];

export const MALE_AVATARS = MALE_SEEDS.map(
  seed => `${DICEBEAR_BASE}/adventurer/svg?seed=${seed}`
);

export const FEMALE_AVATARS = FEMALE_SEEDS.map(
  seed => `${DICEBEAR_BASE}/lorelei/svg?seed=${seed}`
);

export const NEUTRAL_AVATARS = NEUTRAL_SEEDS.map(
  seed => `${DICEBEAR_BASE}/pixel-art/svg?seed=${seed}`
);

export const AVATARS_GALLERY = [
  ...MALE_AVATARS,
  ...FEMALE_AVATARS,
  ...NEUTRAL_AVATARS
];

export const AVATAR_STYLES_EXTENDED = [
  { id: 'pixel-art', label: 'Retro', icon: '🕹️' },
  { id: 'adventurer', label: 'Aventureiro', icon: '⚔️' },
  { id: 'lorelei', label: 'Feminino', icon: '👩' },
  { id: 'micah', label: 'Masculino', icon: '👨' },
  { id: 'open-peeps', label: 'Diverso', icon: '🧑‍🤝‍🧑' },
  { id: 'bottts', label: 'Cyber', icon: '🤖' },
  { id: 'avataaars', label: 'Cartoon', icon: '😊' },
];

export const AVATAR_PRESETS_BY_STYLE: Record<string, string[]> = {
  'pixel-art': NEUTRAL_SEEDS,
  'adventurer': ['Link', 'Zelda', 'Mario', 'Samus', 'Cloud', 'Tifa', 'Sonic', 'Pikachu'],
  'lorelei': FEMALE_SEEDS,
  'micah': MALE_SEEDS,
  'open-peeps': ['Neo', 'Trinity', 'Morpheus', 'Nyx', 'Nova', 'Orion', 'Solar', 'Lunar'],
  'bottts': ['Cyber', 'Bot', 'Droid', 'Mech', 'Tron', 'Pixel', 'Byte', 'Chip'],
  'avataaars': ['Max', 'Luna', 'Sam', 'Alex', 'Jordan', 'Casey', 'Riley', 'Quinn'],
};

export const APP_LOGO = "https://i.ibb.co/svpJKdbx/playsi-logo.png";
