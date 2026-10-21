export interface IRecipeRange {
  min: number;
  max: number;
}

export interface IRecipeTarget {
  name: string;
  temperature: IRecipeRange;
  density: IRecipeRange;
  magicPower: IRecipeRange;
}

export const ACTIVE_RECIPE_TARGET: IRecipeTarget = {
  name: 'Moon Mist',
  temperature: { min: 32, max: 42 },
  density: { min: 12, max: 22 },
  magicPower: { min: 17, max: 27 },
};
