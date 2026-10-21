import { INGREDIENTS } from '../data/ingredients';
import type { IIngredient } from '../data/ingredients';
import { getRandomStock } from '../logic/stock';

export function createShelf(): HTMLElement {
  const shelf = document.createElement('div');
  shelf.className = 'shelf';

  INGREDIENTS.forEach((ingredient) => {
    const ingredientCard = createIngredientCard(ingredient);
    shelf.appendChild(ingredientCard);
  });

  return shelf;
}

function createIngredientCard(ingredient: IIngredient): HTMLElement {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'ingredient-card';

  const icon = document.createElement('span');
  icon.className = 'ingredient-card__icon';
  icon.textContent = '🧪';
  card.appendChild(icon);

  const name = document.createElement('span');
  name.className = 'ingredient-card__name';
  name.textContent = ingredient.name;
  card.appendChild(name);

  const temperature = document.createElement('span');
  temperature.className = 'ingredient-card__temperature';
  temperature.textContent = `Temp: ${ingredient.temperature}`;
  card.appendChild(temperature);

  const density = document.createElement('span');
  density.className = 'ingredient-card__density';
  density.textContent = `Density: ${ingredient.density}`;
  card.appendChild(density);

  const magic = document.createElement('span');
  magic.className = 'ingredient-card__magic';
  magic.textContent = `Magic: ${ingredient.magicPower}`;
  card.appendChild(magic);

  const stock = document.createElement('span');
  stock.className = 'ingredient-card__stock';
  stock.textContent = `${getRandomStock()}`;
  card.appendChild(stock);

  return card;
}
