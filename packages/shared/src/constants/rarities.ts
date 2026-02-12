export interface Rarity {
  id: number;
  name: string;
  baseMultiplier: number;
  stackBonus: number;
  maxMultiplier: number;
  color: string;
}

export const RARITIES: Rarity[] = [
  { id: 1, name: 'Common', baseMultiplier: 1.2, stackBonus: 0.025, maxMultiplier: 2, color: '#9CA3AF' },
  { id: 2, name: 'Uncommon', baseMultiplier: 1.5, stackBonus: 0.05, maxMultiplier: 3, color: '#22C55E' },
  { id: 3, name: 'Rare', baseMultiplier: 2, stackBonus: 0.1, maxMultiplier: 5, color: '#3B82F6' },
  { id: 4, name: 'Epic', baseMultiplier: 4, stackBonus: 0.2, maxMultiplier: 10, color: '#A855F7' },
  { id: 5, name: 'Legendary', baseMultiplier: 10, stackBonus: 0.4, maxMultiplier: 20, color: '#F59E0B' },
  { id: 6, name: 'Mythic', baseMultiplier: 20, stackBonus: 0.5, maxMultiplier: 40, color: '#EF4444' },
  { id: 7, name: 'Divine', baseMultiplier: 44, stackBonus: 1, maxMultiplier: 60, color: '#EC4899' },
  { id: 8, name: 'Celestial', baseMultiplier: 56, stackBonus: 2, maxMultiplier: 80, color: '#8B5CF6' },
  { id: 9, name: 'Transcendent', baseMultiplier: 70, stackBonus: 4, maxMultiplier: 90, color: '#06B6D4' },
  { id: 10, name: 'Immortal', baseMultiplier: 80, stackBonus: 6, maxMultiplier: 110, color: '#14B8A6' },
  { id: 11, name: 'Eternal', baseMultiplier: 90, stackBonus: 10, maxMultiplier: 130, color: '#F97316' },
  { id: 12, name: 'Omega', baseMultiplier: 100, stackBonus: 20, maxMultiplier: 150, color: '#DC2626' },
  { id: 13, name: 'Supreme', baseMultiplier: 120, stackBonus: 40, maxMultiplier: 200, color: '#FBBF24' },
];

export const MAX_RARITY_ID = 13;
export const RARITY_COUNT = 13;
