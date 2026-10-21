import type { IIngredient } from '../data/ingredients';
import type { IGameState } from '../state/game-state';

export const MAX_CAULDRON_INGREDIENTS = 4;

export function addIngredient(state: IGameState, ingredient: IIngredient): boolean {
  const stock = state.shelfStock[ingredient.id];

  if (state.cauldronIngredients.length >= MAX_CAULDRON_INGREDIENTS) {
    return false;
  }

  if (stock === undefined || stock <= 0) {
    return false;
  }

  state.shelfStock[ingredient.id] = stock - 1;
  state.cauldronIngredients.push(ingredient);

  return true;
}
