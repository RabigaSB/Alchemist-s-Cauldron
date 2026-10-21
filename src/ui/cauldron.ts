import { INGREDIENTS } from '../data/ingredients';
import { MAX_CAULDRON_INGREDIENTS } from '../logic/add-ingredient';
import { createStock } from '../logic/stock';
import type { IGameState } from '../state/game-state';
import { createElement } from './create-element';
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
