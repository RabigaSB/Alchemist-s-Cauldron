import type { IDifficultySettings } from './difficulty';
import { DIFFICULTY_SETTINGS } from './difficulty';
import { INGREDIENTS, type IIngredient } from './ingredients';
import type { Difficulty } from './recipes';
import { calculateCauldron } from '../logic/calculate-cauldron';
import type { ICauldronValues } from '../logic/calculate-cauldron';

export interface IReaction {
  id: string;
  name: string;
  requiredIngredients: readonly string[];
  isActive: (ingredients: readonly IIngredient[], values: ICauldronValues) => boolean;
  apply: (values: ICauldronValues) => void;
  timePenaltySeconds?: number;
  livesLost?: number;
  clearsCauldron?: boolean;
}

const hasIngredients = (ingredients: readonly IIngredient[], ...ingredientIds: string[]): boolean =>
  ingredientIds.every((id) => ingredients.some((item) => item.id === id));

export const REACTIONS: IReaction[] = [
  {
    id: 'bubbling',
    name: 'Bubbling',
    requiredIngredients: ['fairy-dust', 'caustic-acid'],
    isActive: (ingredients) => hasIngredients(ingredients, 'fairy-dust', 'caustic-acid'),
    apply: (values) => {
      values.magicPower *= 1.5;
    },
    timePenaltySeconds: 10,
  },
  {
    id: 'volatile-mix',
    name: 'Volatile Mix',
    requiredIngredients: ['phoenix-feather', 'essence-of-the-void'],
    isActive: (ingredients) =>
      hasIngredients(ingredients, 'phoenix-feather', 'essence-of-the-void'),
    apply: () => {},
    livesLost: 1,
    clearsCauldron: true,
  },
  {
    id: 'solar-frost',
    name: 'Solar Frost',
    requiredIngredients: ['dragon-tears', 'frost-lotus'],
    isActive: (ingredients) => hasIngredients(ingredients, 'dragon-tears', 'frost-lotus'),
    apply: (values) => {
      values.temperature = 0;
      values.density *= 1.2;
    },
  },
  {
    id: 'rooted-steam',
    name: 'Rooted Steam',
    requiredIngredients: ['mandrake-root', 'toad-slime'],
    isActive: (ingredients) => hasIngredients(ingredients, 'mandrake-root', 'toad-slime'),
    apply: (values) => {
      values.density *= 1.25;
      values.magicPower *= 0.9;
    },
  },
  {
    id: 'ashen-bloom',
    name: 'Ashen Bloom',
    requiredIngredients: ['phoenix-feather', 'fairy-dust'],
    isActive: (ingredients) => hasIngredients(ingredients, 'phoenix-feather', 'fairy-dust'),
    apply: (values) => {
      values.temperature += 10;
      values.magicPower *= 1.25;
    },
  },
  {
    id: 'annihilation',
    name: 'Annihilation',
    requiredIngredients: [],
    isActive: (ingredients) =>
      ingredients.some((item) => item.temperature > 15) &&
      ingredients.some((item) => item.temperature < -15),
    apply: (values) => {
      values.temperature = 0;
      values.density *= 2;
    },
  },
  {
    id: 'pressure-spike',
    name: 'Pressure Spike',
    requiredIngredients: [],
    isActive: (_ingredients, values) => values.density >= 70,
    apply: (values) => {
      values.density = 70;
      values.magicPower *= 1.1;
    },
  },
  {
    id: 'magma-flux',
    name: 'Magma Flux',
    requiredIngredients: [],
    isActive: (_ingredients, values) => values.temperature >= 60,
    apply: (values) => {
      values.magicPower *= 1.2;
      values.density *= 0.9;
    },
  },
  {
    id: 'deep-freeze',
    name: 'Deep Freeze',
    requiredIngredients: [],
    isActive: (_ingredients, values) => values.temperature <= -20,
    apply: (values) => {
      values.density *= 1.15;
      values.magicPower *= 0.85;
    },
  },
  {
    id: 'arcane-saturation',
    name: 'Arcane Saturation',
    requiredIngredients: [],
    isActive: (_ingredients, values) => values.magicPower >= 80,
    apply: (values) => {
      values.magicPower = 80;
      values.temperature += 5;
    },
  },
  {
    id: 'steam-burst',
    name: 'Steam Burst',
    requiredIngredients: ['dragon-tears', 'caustic-acid'],
    isActive: (ingredients, values) =>
      hasIngredients(ingredients, 'dragon-tears', 'caustic-acid') && values.temperature >= 35,
    apply: (values) => {
      values.temperature += 10;
    },
    timePenaltySeconds: 5,
  },
  {
    id: 'black-ice',
    name: 'Black Ice',
    requiredIngredients: ['frost-lotus', 'essence-of-the-void'],
    isActive: (ingredients, values) =>
      hasIngredients(ingredients, 'frost-lotus', 'essence-of-the-void') && values.density <= 0,
    apply: (values) => {
      values.temperature -= 10;
      values.magicPower *= 1.2;
    },
  },
  {
    id: 'heavy-spark',
    name: 'Heavy Spark',
    requiredIngredients: ['fairy-dust', 'toad-slime'],
    isActive: (ingredients, values) =>
      hasIngredients(ingredients, 'fairy-dust', 'toad-slime') && values.density >= 40,
    apply: (values) => {
      values.density *= 1.2;
      values.magicPower *= 1.1;
    },
  },
  {
    id: 'burning-root',
    name: 'Burning Root',
    requiredIngredients: ['mandrake-root', 'phoenix-feather'],
    isActive: (ingredients, values) =>
      hasIngredients(ingredients, 'mandrake-root', 'phoenix-feather') && values.temperature >= 40,
    apply: (values) => {
      values.temperature += 15;
      values.density *= 0.9;
    },
  },
  {
    id: 'void-resonance',
    name: 'Void Resonance',
    requiredIngredients: ['essence-of-the-void', 'dragon-tears'],
    isActive: (ingredients, values) =>
      hasIngredients(ingredients, 'essence-of-the-void', 'dragon-tears') && values.magicPower >= 50,
    apply: (values) => {
      values.magicPower *= 1.3;
      values.temperature -= 5;
    },
  },
];

export function getReactionsForDifficulty(difficulty: Difficulty): IReaction[] {
  const settings: IDifficultySettings = DIFFICULTY_SETTINGS[difficulty];
  const availableIngredientIds = new Set(
    INGREDIENTS.slice(0, settings.ingredientsOnShelf).map((ingredient) => ingredient.id),
  );

  return REACTIONS.filter((reaction) =>
    reaction.requiredIngredients.every((id) => availableIngredientIds.has(id)),
  ).slice(0, settings.reactions);
}

export function calculateReactionValues(
  ingredients: readonly IIngredient[],
  reactions: readonly IReaction[],
): ICauldronValues {
  const values = calculateCauldron(ingredients);
  const baseValues = { ...values };
  for (const reaction of reactions) {
    if (reaction.isActive(ingredients, baseValues)) {
      reaction.apply(values);
    }
  }
  return {
    temperature: normalizeValue(values.temperature),
    density: normalizeValue(values.density),
    magicPower: normalizeValue(values.magicPower),
  };
}

function normalizeValue(value: number): number {
  return Number(value.toFixed(2));
}
