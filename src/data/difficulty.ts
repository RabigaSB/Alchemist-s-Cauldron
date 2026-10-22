import type { Difficulty } from './recipes';

export interface IDifficultySettings {
  label: string;
  ingredientsOnShelf: number;
  maxCauldronIngredients: number;
  startingTime: number;
  tolerance: number;
  lives: number;
  scorePerBrew: number;
  timeBonusPerBrew: number;
  reactions: number;
}

export const DIFFICULTY_SETTINGS: Record<Difficulty, IDifficultySettings> = {
  easy: {
    label: 'Easy',
    ingredientsOnShelf: 4,
    maxCauldronIngredients: 4,
    startingTime: 180,
    tolerance: 12,
    lives: 5,
    scorePerBrew: 100,
    timeBonusPerBrew: 15,
    reactions: 0,
  },
  medium: {
    label: 'Medium',
    ingredientsOnShelf: 6,
    maxCauldronIngredients: 4,
    startingTime: 150,
    tolerance: 8,
    lives: 3,
    scorePerBrew: 200,
    timeBonusPerBrew: 10,
    reactions: 0,
  },
  hard: {
    label: 'Hard',
    ingredientsOnShelf: 8,
    maxCauldronIngredients: 5,
    startingTime: 150,
    tolerance: 5,
    lives: 3,
    scorePerBrew: 300,
    timeBonusPerBrew: 5,
    reactions: 3,
  },
};
