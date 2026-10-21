import { createElement } from './create-element';
import { createShelf } from './shelf';

export function createCauldron(): HTMLElement {
  const cauldron = createElement('section', 'cauldron');

  const title = createElement('h2', 'cauldron__title', 'Cauldron');
  cauldron.appendChild(title);

  const shelf = createShelf();
  cauldron.appendChild(shelf);

  return cauldron;
}
