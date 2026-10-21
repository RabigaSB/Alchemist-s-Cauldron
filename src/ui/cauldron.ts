import { INGREDIENTS } from '../data/ingredients';
import { ACTIVE_RECIPE_TARGET } from '../data/recipe-target';
import { MAX_CAULDRON_INGREDIENTS } from '../logic/add-ingredient';
import { calculateCauldron } from '../logic/calculate-cauldron';
import { createStock } from '../logic/stock';
import type { IGameState } from '../state/game-state';
import { createElement } from './create-element';
import { createParameterBar } from './parameter-bar';
import { createShelf } from './shelf';

export function createCauldron(): HTMLElement {
  const cauldron = createElement('section', 'cauldron');
  const shelfIngredients = INGREDIENTS.slice(0, 6);
  const state: IGameState = {
    cauldronIngredients: [],
    shelfStock: createStock(shelfIngredients),
  };

  const title = createElement('h2', 'cauldron__title', 'Cauldron');
  cauldron.appendChild(title);

  const recipeTitle = createElement(
    'h3',
    'cauldron__recipe',
    `Recipe target: ${ACTIVE_RECIPE_TARGET.name}`,
  );
  cauldron.appendChild(recipeTitle);

  const parameterBars = createElement('div', 'cauldron__parameters');
  const temperatureBar = createParameterBar(
    'Temperature',
    ACTIVE_RECIPE_TARGET.temperature,
    -80,
    100,
  );
  const densityBar = createParameterBar('Density', ACTIVE_RECIPE_TARGET.density, -40, 120);
  const magicPowerBar = createParameterBar('Magic Power', ACTIVE_RECIPE_TARGET.magicPower, 0, 160);
  const bars = [temperatureBar, densityBar, magicPowerBar];
  bars.forEach((bar) => parameterBars.appendChild(bar.element));
  cauldron.appendChild(parameterBars);

  const shelf = createShelf(state, renderCauldron);
  cauldron.appendChild(shelf.element);

  const ingredientsTitle = createElement('h3', 'cauldron__ingredients-title');
  cauldron.appendChild(ingredientsTitle);

  const ingredientsList = createElement('ol', 'cauldron__ingredients-list');
  cauldron.appendChild(ingredientsList);

  const clearButton = createElement('button', 'cauldron__clear', 'Clear cauldron');
  clearButton.type = 'button';
  clearButton.disabled = true;
  clearButton.addEventListener('click', () => {
    state.cauldronIngredients.length = 0;
    renderCauldron();
  });
  cauldron.appendChild(clearButton);

  function renderCauldron(): void {
    const values = calculateCauldron(state.cauldronIngredients);
    temperatureBar.update(values.temperature);
    densityBar.update(values.density);
    magicPowerBar.update(values.magicPower);
    ingredientsTitle.textContent = `Ingredients: ${state.cauldronIngredients.length} / ${MAX_CAULDRON_INGREDIENTS}`;
    ingredientsList.replaceChildren(
      ...state.cauldronIngredients.map((ingredient) =>
        createElement('li', 'cauldron__ingredient', ingredient.name),
      ),
    );
    clearButton.disabled = state.cauldronIngredients.length === 0;
    shelf.render();
  }

  renderCauldron();

  return cauldron;
}
