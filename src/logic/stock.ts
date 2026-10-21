import { INGREDIENTS } from '../data/ingredients';

export function createStock(): Record<string, number> {
  return Object.fromEntries(INGREDIENTS.map((ingredient) => [ingredient.id, getRandomStock()]));
}

export function getRandomStock(): number {
  return Math.floor(Math.random() * 14) + 2;
}
