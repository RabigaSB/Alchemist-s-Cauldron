import type { IRecipe } from '../data/recipes';
import type { ICauldronValues } from './calculate-cauldron';

export const BREW_TOLERANCE = 8;

export function isBrewSuccessful(
  values: ICauldronValues,
  recipe: IRecipe,
  tolerance = BREW_TOLERANCE,
): boolean {
  return (
    isWithinExpandedRange(
      values.temperature,
      recipe.temperature.min,
      recipe.temperature.max,
      tolerance,
    ) &&
    isWithinExpandedRange(values.density, recipe.density.min, recipe.density.max, tolerance) &&
    isWithinExpandedRange(
      values.magicPower,
      recipe.magicPower.min,
      recipe.magicPower.max,
      tolerance,
    )
  );
}

function isWithinExpandedRange(
  value: number,
  minimum: number,
  maximum: number,
  tolerance: number,
): boolean {
  return value >= minimum - tolerance && value <= maximum + tolerance;
}
