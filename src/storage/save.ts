import { DIFFICULTY_SETTINGS } from '../data/difficulty';
import { INGREDIENTS, type IIngredient } from '../data/ingredients';
import { RECIPES, type Difficulty, type IRecipe } from '../data/recipes';
import type { IGameState } from '../state/game-state';

const SAVE_KEY = 'alchemists-cauldron-save';

export interface IGameSave {
  difficulty: Difficulty;
  score: number;
  timeLeft: number;
  lives: number;
  activeRecipe: IRecipe;
  cauldronIngredients: IIngredient[];
  shelfStock: Record<string, number>;
  status: 'playing' | 'paused';
}

export type SaveResult =
  { success: true; save: IGameSave | null } | { success: false; error: string };

export function saveGame(state: IGameState): SaveResult {
  if (state.status !== 'playing' && state.status !== 'paused') {
    return { success: false, error: 'Only an unfinished game can be saved.' };
  }

  if (state.activeRecipe === null) {
    return { success: false, error: 'Cannot save a game without an active recipe.' };
  }

  const save: IGameSave = {
    difficulty: state.difficulty,
    score: state.score,
    timeLeft: state.timeLeft,
    lives: state.lives,
    activeRecipe: state.activeRecipe,
    cauldronIngredients: state.cauldronIngredients,
    shelfStock: state.shelfStock,
    status: state.status,
  };

  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    return { success: true, save };
  } catch {
    return { success: false, error: 'Could not save the game in this browser.' };
  }
}

export function loadGame(): SaveResult {
  let serialized: string | null;

  try {
    serialized = window.localStorage.getItem(SAVE_KEY);
  } catch {
    return { success: false, error: 'Could not read the saved game in this browser.' };
  }

  if (serialized === null) {
    return { success: true, save: null };
  }

  try {
    const parsed: unknown = JSON.parse(serialized);
    const save = parseGameSave(parsed);
    if (save !== null) {
      return { success: true, save };
    }
  } catch {
    // Invalid JSON is handled the same way as any other invalid save.
  }

  const clearResult = clearSave();
  if (!clearResult.success) {
    return { success: false, error: 'The saved game is invalid and could not be removed.' };
  }

  return { success: true, save: null };
}

export function clearSave(): { success: true } | { success: false; error: string } {
  try {
    window.localStorage.removeItem(SAVE_KEY);
    return { success: true };
  } catch {
    return { success: false, error: 'Could not clear the saved game in this browser.' };
  }
}

function parseGameSave(value: unknown): IGameSave | null {
  if (!isRecord(value)) {
    return null;
  }

  const difficulty = value.difficulty;
  if (difficulty !== 'easy' && difficulty !== 'medium' && difficulty !== 'hard') {
    return null;
  }

  const settings = DIFFICULTY_SETTINGS[difficulty];
  if (
    !isNonNegativeInteger(value.score) ||
    !isIntegerInRange(value.timeLeft, 1, settings.startingTime) ||
    !isIntegerInRange(value.lives, 1, settings.lives) ||
    (value.status !== 'playing' && value.status !== 'paused')
  ) {
    return null;
  }

  const activeRecipe = findRecipe(value.activeRecipe, difficulty);
  if (activeRecipe === null) {
    return null;
  }

  const availableIngredients = INGREDIENTS.slice(0, settings.ingredientsOnShelf);
  const cauldronIngredients = parseIngredients(
    value.cauldronIngredients,
    availableIngredients,
    settings.maxCauldronIngredients,
  );
  const shelfStock = parseStock(value.shelfStock, availableIngredients);
  if (cauldronIngredients === null || shelfStock === null) {
    return null;
  }

  if (cauldronIngredients.length === 0 && !Object.values(shelfStock).some((amount) => amount > 0)) {
    return null;
  }

  return {
    difficulty,
    score: value.score,
    timeLeft: value.timeLeft,
    lives: value.lives,
    activeRecipe,
    cauldronIngredients,
    shelfStock,
    status: value.status,
  };
}

function findRecipe(value: unknown, difficulty: Difficulty): IRecipe | null {
  if (!isRecord(value) || typeof value.id !== 'string') {
    return null;
  }

  return (
    RECIPES.find((recipe) => recipe.id === value.id && recipe.difficulty === difficulty) ?? null
  );
}

function parseIngredients(
  value: unknown,
  availableIngredients: readonly IIngredient[],
  maxIngredients: number,
): IIngredient[] | null {
  if (!Array.isArray(value) || value.length > maxIngredients) {
    return null;
  }

  const parsed: IIngredient[] = [];
  for (const savedIngredient of value) {
    if (!isRecord(savedIngredient) || typeof savedIngredient.id !== 'string') {
      return null;
    }

    const ingredient = availableIngredients.find((item) => item.id === savedIngredient.id);
    if (ingredient === undefined) {
      return null;
    }

    parsed.push(ingredient);
  }

  return parsed;
}

function parseStock(
  value: unknown,
  availableIngredients: readonly IIngredient[],
): Record<string, number> | null {
  if (!isRecord(value)) {
    return null;
  }

  const keys = Object.keys(value);
  if (
    keys.length !== availableIngredients.length ||
    availableIngredients.some((ingredient) => !Object.hasOwn(value, ingredient.id))
  ) {
    return null;
  }

  const stock: Record<string, number> = {};
  for (const ingredient of availableIngredients) {
    const amount = value[ingredient.id];
    if (!isIntegerInRange(amount, 0, 15)) {
      return null;
    }
    stock[ingredient.id] = amount;
  }

  return stock;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isIntegerInRange(value: unknown, minimum: number, maximum: number): value is number {
  return (
    typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum && value <= maximum
  );
}
