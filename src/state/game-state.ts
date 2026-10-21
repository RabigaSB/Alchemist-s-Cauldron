import type { IIngredient } from '../data/ingredients';
import type { IRecipe } from '../data/recipes';

export interface IGameState {
  cauldronIngredients: IIngredient[];
  shelfStock: Record<string, number>;
  activeRecipe: IRecipe | null;
  score: number;
  timeLeft: number;
  endTime: number | null;
  lives: number;
  status: 'menu' | 'playing' | 'game-over';
  gameOverReason: 'time' | 'lives' | 'ingredients' | null;
}
