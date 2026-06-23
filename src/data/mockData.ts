export interface Nominee {
  id: string;
  name: string;
  photoUrl: string;
  votes: number; // Simulated votes
  classOrHouse?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'singular' | 'split'; // split means male/female variations
  nominees: Nominee[];
  themeIcon?: string; // e.g., 'crown', 'football', etc.
}

// Helper to generate mock nominees
const generateNominees = (count: number): Nominee[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `nom_${Math.random().toString(36).substr(2, 9)}`,
    name: `Nominee ${i + 1}`,
    photoUrl: `/avatar.png`,
    votes: Math.floor(Math.random() * 500),
    classOrHouse: `Class ${Math.floor(Math.random() * 12) + 1}`,
  })).sort((a, b) => b.votes - a.votes);
};

export const categories: Category[] = [
  // Singular Awards
  { id: 'cat_beautiful', name: 'Most Beautiful', type: 'singular', nominees: generateNominees(6), themeIcon: 'sparkles' },
  { id: 'cat_handsome', name: 'Most Handsome', type: 'singular', nominees: generateNominees(6), themeIcon: 'sparkles' },
  { id: 'cat_player', name: 'Player of the Year', type: 'singular', nominees: generateNominees(4), themeIcon: 'trophy' },
  { id: 'cat_gk', name: 'Best Goalkeeper', type: 'singular', nominees: generateNominees(3), themeIcon: 'shield' },
  { id: 'cat_midfielder', name: 'Best Midfielder', type: 'singular', nominees: generateNominees(4), themeIcon: 'activity' },
  { id: 'cat_defender', name: 'Best Defender', type: 'singular', nominees: generateNominees(4), themeIcon: 'shield' },
  { id: 'cat_coach', name: 'Coach of the Year', type: 'singular', nominees: generateNominees(3), themeIcon: 'users' },
  { id: 'cat_duo', name: 'Best Duo', type: 'singular', nominees: generateNominees(5), themeIcon: 'users' },
  { id: 'cat_brand', name: 'Brand of the Year', type: 'singular', nominees: generateNominees(5), themeIcon: 'briefcase' },
  { id: 'cat_classrep', name: 'Best Class Rep', type: 'singular', nominees: generateNominees(4), themeIcon: 'star' },

  // Split Awards (Male & Female)
  { id: 'cat_fashionable_m', name: 'Most Fashionable (Male)', type: 'split', nominees: generateNominees(5), themeIcon: 'shirt' },
  { id: 'cat_fashionable_f', name: 'Most Fashionable (Female)', type: 'split', nominees: generateNominees(5), themeIcon: 'shirt' },
  { id: 'cat_popular_m', name: 'Most Popular (Male)', type: 'split', nominees: generateNominees(6), themeIcon: 'heart' },
  { id: 'cat_popular_f', name: 'Most Popular (Female)', type: 'split', nominees: generateNominees(6), themeIcon: 'heart' },
  { id: 'cat_social_m', name: 'Most Social (Male)', type: 'split', nominees: generateNominees(5), themeIcon: 'message-circle' },
  { id: 'cat_social_f', name: 'Most Social (Female)', type: 'split', nominees: generateNominees(5), themeIcon: 'message-circle' },
  { id: 'cat_creator_m', name: 'Content Creator (Male)', type: 'split', nominees: generateNominees(4), themeIcon: 'video' },
  { id: 'cat_creator_f', name: 'Content Creator (Female)', type: 'split', nominees: generateNominees(4), themeIcon: 'video' },
  { id: 'cat_dressed_m', name: 'Best Dressed (Male)', type: 'split', nominees: generateNominees(5), themeIcon: 'shirt' },
  { id: 'cat_dressed_f', name: 'Best Dressed (Female)', type: 'split', nominees: generateNominees(5), themeIcon: 'shirt' },
  { id: 'cat_unique_m', name: 'Most Unique (Male)', type: 'split', nominees: generateNominees(4), themeIcon: 'star' },
  { id: 'cat_unique_f', name: 'Most Unique (Female)', type: 'split', nominees: generateNominees(4), themeIcon: 'star' },
  { id: 'cat_dancer_m', name: 'Best Dancer (Male)', type: 'split', nominees: generateNominees(4), themeIcon: 'music' },
  { id: 'cat_dancer_f', name: 'Best Dancer (Female)', type: 'split', nominees: generateNominees(4), themeIcon: 'music' },
  { id: 'cat_personality_m', name: 'Best Personality (Male)', type: 'split', nominees: generateNominees(5), themeIcon: 'smile' },
  { id: 'cat_personality_f', name: 'Best Personality (Female)', type: 'split', nominees: generateNominees(5), themeIcon: 'smile' },
  { id: 'cat_talented_m', name: 'Most Talented (Male)', type: 'split', nominees: generateNominees(5), themeIcon: 'zap' },
  { id: 'cat_talented_f', name: 'Most Talented (Female)', type: 'split', nominees: generateNominees(5), themeIcon: 'zap' },
];

export const getCategoryById = (id: string) => categories.find(c => c.id === id);
