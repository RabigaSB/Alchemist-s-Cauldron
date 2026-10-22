import { INGREDIENTS } from '../data/ingredients';
import type { IIngredient } from '../data/ingredients';
import type { IGameState } from '../state/game-state';

export interface IShelfView {
  element: HTMLElement;
  render: () => void;
}

export function createShelf(
  state: IGameState,
  onIngredientAdded: (ingredient: IIngredient) => void,
  getShelfSize: () => number,
  getMaxIngredients: () => number,
): IShelfView {
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
      ...INGREDIENTS.slice(0, getShelfSize()).map((ingredient) =>
        createIngredientCard(ingredient, state, onIngredientAdded, getMaxIngredients()),
      ),
    );
  }

  render();

  return { element: shelf, render };
}

function createIngredientCard(
  ingredient: IIngredient,
  state: IGameState,
  onIngredientAdded: (ingredient: IIngredient) => void,
  maxIngredients: number,
): HTMLButtonElement {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'ingredient-card';

  const stockAmount = state.shelfStock[ingredient.id] ?? 0;
  const cauldronIsFull = state.cauldronIngredients.length >= maxIngredients;
  card.disabled = state.status !== 'playing' || stockAmount <= 0 || cauldronIsFull;
  card.draggable = !card.disabled;
  card.setAttribute('aria-label', `${ingredient.name}, ${stockAmount} in stock`);

  const icon = document.createElement('img');
  icon.className = 'ingredient-card__icon';
  icon.src = ingredient.icon;
  icon.alt = '';
  card.appendChild(icon);

  if (stockAmount <= 0) {
    card.classList.add('ingredient-card--empty');
  }

  const description = document.createElement('div');
  description.className = 'ingredient-card__description';
  card.appendChild(description);

  const name = document.createElement('span');
  name.className = 'ingredient-card__name';
  name.textContent = ingredient.name;
  description.appendChild(name);

  const tooltip = document.createElement('div');
  tooltip.className = 'ingredient-card__tooltip';
  tooltip.id = `ingredient-tooltip-${ingredient.id}`;
  tooltip.setAttribute('role', 'tooltip');
  tooltip.textContent = [
    `Temperature: ${formatIngredientValue(ingredient.temperature)}`,
    `Density: ${formatIngredientValue(ingredient.density)}`,
    `Magic Power: ${formatIngredientValue(ingredient.magicPower)}`,
  ].join(' · ');
  card.setAttribute('aria-describedby', tooltip.id);
  card.appendChild(tooltip);

  function showTooltip(): void {
    if (state.status !== 'playing') {
      return;
    }

    const cardBounds = card.getBoundingClientRect();
    const tooltipBounds = tooltip.getBoundingClientRect();
    const openLeft = cardBounds.right + tooltipBounds.width > window.innerWidth;
    const openUp = cardBounds.bottom + tooltipBounds.height > window.innerHeight;
    const preferredLeft = openLeft ? cardBounds.left - tooltipBounds.width : cardBounds.left;
    const preferredTop = openUp ? cardBounds.top - tooltipBounds.height - 6 : cardBounds.bottom + 6;
    const left = Math.max(
      12,
      Math.min(preferredLeft, window.innerWidth - tooltipBounds.width - 12),
    );
    const top = Math.max(
      12,
      Math.min(preferredTop, window.innerHeight - tooltipBounds.height - 12),
    );

    tooltip.classList.toggle('tooltip--left', openLeft);
    tooltip.classList.toggle('tooltip--up', openUp);
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.classList.add('ingredient-card__tooltip--visible');
  }

  function hideTooltip(): void {
    tooltip.classList.remove('ingredient-card__tooltip--visible');
  }

  card.addEventListener('pointerenter', showTooltip);
  card.addEventListener('pointerleave', () => {
    if (!card.matches(':focus')) {
      hideTooltip();
    }
  });
  card.addEventListener('focus', showTooltip);
  card.addEventListener('blur', hideTooltip);

  card.addEventListener('click', () => {
    onIngredientAdded(ingredient);
  });

  card.addEventListener('dragstart', (event: DragEvent) => {
    if (
      state.status !== 'playing' ||
      state.cauldronIngredients.length >= maxIngredients ||
      (state.shelfStock[ingredient.id] ?? 0) <= 0 ||
      event.dataTransfer === null
    ) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/x-alchemist-ingredient', ingredient.id);
  });

  return card;
}

function formatIngredientValue(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }
  if (value < 0) {
    return `−${Math.abs(value)}`;
  }
  return '0';
}
