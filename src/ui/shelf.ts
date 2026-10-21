import { INGREDIENTS } from '../data/ingredients';
import type { IIngredient } from '../data/ingredients';
import { getRandomStock } from '../logic/stock';

export function createShelf(): HTMLElement {
  const shelf = document.createElement('section');
  shelf.className = 'shelf';

  const title = document.createElement('h3');
  title.className = 'shelf__title';
  title.textContent = 'Ingredients Shelf';
  shelf.appendChild(title);

  const ingredientsContainer = document.createElement('div');
  ingredientsContainer.className = 'shelf__ingredients';
  shelf.appendChild(ingredientsContainer);

  INGREDIENTS.forEach((ingredient) => {
    const ingredientCard = createIngredientCard(ingredient);
    ingredientsContainer.appendChild(ingredientCard);
  });

  return shelf;
}

function createIngredientCard(ingredient: IIngredient): HTMLElement {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'ingredient-card';

  const icon = document.createElement('img');
  icon.className = 'ingredient-card__icon';
  icon.src = `${ingredient.icon}`;
  icon.alt = ingredient.name;
  card.appendChild(icon);

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
  stock.textContent = `${getRandomStock()}`;
  properties.appendChild(stock);

  return card;
}
