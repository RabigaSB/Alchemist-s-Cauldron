import type { IIngredient } from '../data/ingredients';
import type { IRecipe } from '../data/recipes';

export interface IGameState {
  cauldronIngredients: IIngredient[];
  shelfStock: Record<string, number>;
  activeRecipe: IRecipe | null;
  score: number;
  timeLeft: number;
  lives: number;
  status: 'menu' | 'playing' | 'game-over';
}
