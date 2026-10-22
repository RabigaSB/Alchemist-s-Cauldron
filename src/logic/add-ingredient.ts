import type { IIngredient } from '../data/ingredients';
import type { IGameState } from '../state/game-state';

export const MAX_CAULDRON_INGREDIENTS = 4;

export function addIngredient(
  state: IGameState,
  ingredient: IIngredient,
  maxIngredients = MAX_CAULDRON_INGREDIENTS,
): boolean {
  const stock = state.shelfStock[ingredient.id];

  if (state.status !== 'playing') {
    return false;
  }

  if (state.cauldronIngredients.length >= maxIngredients) {
    return false;
  }

  if (stock === undefined || stock <= 0) {
    return false;
  }

  state.shelfStock[ingredient.id] = stock - 1;
  state.cauldronIngredients.push(ingredient);

  return true;
}
