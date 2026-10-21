import { INGREDIENTS } from '../data/ingredients';
import type { IIngredient } from '../data/ingredients';
import { addIngredient, MAX_CAULDRON_INGREDIENTS } from '../logic/add-ingredient';
import type { IGameState } from '../state/game-state';

const SHELF_INGREDIENTS = INGREDIENTS.slice(0, 6);

export interface IShelfView {
  element: HTMLElement;
  render: () => void;
}

export function createShelf(state: IGameState, onIngredientAdded: () => void): IShelfView {
  const shelf = document.createElement('section');
  shelf.className = 'shelf';

  const title = document.createElement('h3');
  title.className = 'shelf__title';
  title.textContent = 'Ingredients Shelf';
  shelf.appendChild(title);

  const ingredientsContainer = document.createElement('div');
  ingredientsContainer.className = 'shelf__ingredients';
  shelf.appendChild(ingredientsContainer);

  function render(): void {
    ingredientsContainer.replaceChildren(
      ...SHELF_INGREDIENTS.map((ingredient) =>
        createIngredientCard(ingredient, state, onIngredientAdded),
      ),
    );
  }

  render();

  return { element: shelf, render };
}

function createIngredientCard(
  ingredient: IIngredient,
  state: IGameState,
  onIngredientAdded: () => void,
): HTMLButtonElement {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'ingredient-card';

  const stockAmount = state.shelfStock[ingredient.id] ?? 0;
  const cauldronIsFull = state.cauldronIngredients.length >= MAX_CAULDRON_INGREDIENTS;
  card.disabled = state.status !== 'playing' || stockAmount <= 0 || cauldronIsFull;

  if (stockAmount > 0) {
    const icon = document.createElement('img');
    icon.className = 'ingredient-card__icon';
    icon.src = ingredient.icon;
    icon.alt = '';
    card.appendChild(icon);
  } else {
    card.classList.add('ingredient-card--empty');
  }

  card.addEventListener('click', () => {
    if (addIngredient(state, ingredient)) {
      onIngredientAdded();
    }
  });

  const description = document.createElement('div');
  description.className = 'ingredient-card__description';
  card.appendChild(description);

  const name = document.createElement('span');
  name.className = 'ingredient-card__name';
  name.textContent = ingredient.name;
  description.appendChild(name);

  const properties = document.createElement('div');
  properties.className = 'ingredient-card__properties';
  description.appendChild(properties);

  const temperature = document.createElement('span');
  temperature.className = 'ingredient-card__temperature';
  temperature.textContent = `T${ingredient.temperature}`;
  properties.appendChild(temperature);

  const density = document.createElement('span');
  density.className = 'ingredient-card__density';
  density.textContent = `D${ingredient.density}`;
  properties.appendChild(density);

  const magic = document.createElement('span');
  magic.className = 'ingredient-card__magic';
  magic.textContent = `MP${ingredient.magicPower}`;
  properties.appendChild(magic);

  const stock = document.createElement('span');
  stock.className = 'ingredient-card__stock';
  stock.textContent = `${stockAmount}`;
  properties.appendChild(stock);

  return card;
}
