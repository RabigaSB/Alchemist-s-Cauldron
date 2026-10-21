import type { IIngredient } from '../data/ingredients';

export interface ICauldronValues {
  temperature: number;
  density: number;
  magicPower: number;
}

export function calculateCauldron(ingredients: readonly IIngredient[]): ICauldronValues {
  return ingredients.reduce<ICauldronValues>(
    (total, ingredient) => ({
      temperature: total.temperature + ingredient.temperature,
      density: total.density + ingredient.density,
      magicPower: total.magicPower + ingredient.magicPower,
    }),
    { temperature: 0, density: 0, magicPower: 0 },
  );
}
