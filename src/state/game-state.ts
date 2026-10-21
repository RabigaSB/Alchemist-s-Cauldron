import type { IIngredient } from '../data/ingredients';

export interface IGameState {
  cauldronIngredients: IIngredient[];
  shelfStock: Record<string, number>;
}
