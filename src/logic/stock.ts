import { INGREDIENTS, type IIngredient } from '../data/ingredients';

export function createStock(
  ingredients: readonly IIngredient[] = INGREDIENTS,
): Record<string, number> {
  return Object.fromEntries(ingredients.map((ingredient) => [ingredient.id, getRandomStock()]));
}

export function getRandomStock(): number {
  return Math.floor(Math.random() * 14) + 2;
}
