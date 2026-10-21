import { INGREDIENTS } from '../data/ingredients';
import type { IRecipeRange } from '../data/recipes';
import { pickRandomRecipe } from '../data/recipes';
import { isBrewSuccessful } from '../logic/brew-check';
import { MAX_CAULDRON_INGREDIENTS } from '../logic/add-ingredient';
import { calculateCauldron } from '../logic/calculate-cauldron';
import { createStock } from '../logic/stock';
import type { IGameState } from '../state/game-state';
import { createElement } from './create-element';
import { createParameterBar } from './parameter-bar';
import { createShelf } from './shelf';

const GAME_DIFFICULTY = 'medium';
const STARTING_TIME = 150;
const STARTING_LIVES = 3;
const SCORE_PER_BREW = 200;
const TIME_BONUS_PER_BREW = 10;
const MAX_TIME = 150;

export function createCauldron(): HTMLElement {
  const cauldron = createElement('section', 'cauldron');
  const shelfIngredients = INGREDIENTS.slice(0, 6);
  const state: IGameState = {
    cauldronIngredients: [],
    shelfStock: {},
    activeRecipe: null,
    score: 0,
    timeLeft: 0,
    lives: 0,
    status: 'menu',
  };

  const title = createElement('h2', 'cauldron__title', "Alchemist's Cauldron");
  cauldron.appendChild(title);

  const startScreen = createElement('div', 'cauldron__start-screen');
  const startMessage = createElement('p', 'cauldron__start-message', 'Ready to brew a potion?');
  startScreen.appendChild(startMessage);
  const startButton = createElement('button', 'cauldron__start', 'Start Game');
  startButton.type = 'button';
  startButton.addEventListener('click', startGame);
  startScreen.appendChild(startButton);
  cauldron.appendChild(startScreen);

  const game = createElement('div', 'cauldron__game');
  game.hidden = true;

  const scoreboard = createElement('div', 'cauldron__scoreboard');
  const scoreDisplay = createElement('span', 'cauldron__score');
  const timeDisplay = createElement('span', 'cauldron__time');
  const livesDisplay = createElement('span', 'cauldron__lives');
  scoreboard.append(scoreDisplay, timeDisplay, livesDisplay);
  game.appendChild(scoreboard);

  const recipePanel = createElement('section', 'cauldron__recipe-panel');
  const recipeTitle = createElement('h3', 'cauldron__recipe');
  recipePanel.appendChild(recipeTitle);
  const recipeRanges = createElement('div', 'cauldron__recipe-ranges');
  recipePanel.appendChild(recipeRanges);
  const ingredientsTitle = createElement('h3', 'cauldron__ingredients-title');
  recipePanel.appendChild(ingredientsTitle);
  game.appendChild(recipePanel);

  const parameterBars = createElement('div', 'cauldron__parameters');
  const temperatureBar = createParameterBar('Temperature', { min: 0, max: 0 }, -80, 100);
  const densityBar = createParameterBar('Density', { min: 0, max: 0 }, -40, 120);
  const magicPowerBar = createParameterBar('Magic Power', { min: 0, max: 0 }, 0, 160);
  parameterBars.append(temperatureBar.element, densityBar.element, magicPowerBar.element);
  game.appendChild(parameterBars);

  const shelf = createShelf(state, renderCauldron);
  game.appendChild(shelf.element);

  const ingredientsList = createElement('ol', 'cauldron__ingredients-list');
  game.appendChild(ingredientsList);

  const actions = createElement('div', 'cauldron__actions');
  const brewButton = createElement('button', 'cauldron__brew', 'Brew');
  brewButton.type = 'button';
  brewButton.disabled = true;
  brewButton.addEventListener('click', brew);
  actions.appendChild(brewButton);

  const clearButton = createElement('button', 'cauldron__clear', 'Clear cauldron');
  clearButton.type = 'button';
  clearButton.disabled = true;
  clearButton.addEventListener('click', () => {
    state.cauldronIngredients.length = 0;
    renderCauldron();
  });
  actions.appendChild(clearButton);
  game.appendChild(actions);

  const resultMessage = createElement('p', 'cauldron__result');
  resultMessage.setAttribute('aria-live', 'polite');
  game.appendChild(resultMessage);

  cauldron.appendChild(game);

  function startGame(): void {
    state.cauldronIngredients = [];
    state.shelfStock = createStock(shelfIngredients);
    state.activeRecipe = pickRandomRecipe(GAME_DIFFICULTY);
    state.score = 0;
    state.timeLeft = STARTING_TIME;
    state.lives = STARTING_LIVES;
    state.status = 'playing';
    resultMessage.textContent = '';
    startScreen.hidden = true;
    game.hidden = false;
    renderCauldron();
  }

  function brew(): void {
    if (
      state.status !== 'playing' ||
      state.activeRecipe === null ||
      state.cauldronIngredients.length === 0
    ) {
      return;
    }

    const values = calculateCauldron(state.cauldronIngredients);
    const successful = isBrewSuccessful(values, state.activeRecipe);
    state.cauldronIngredients = [];

    if (successful) {
      state.score += SCORE_PER_BREW;
      state.timeLeft = Math.min(MAX_TIME, state.timeLeft + TIME_BONUS_PER_BREW);
      state.activeRecipe = pickRandomRecipe(GAME_DIFFICULTY);
      resultMessage.textContent = 'Success! The potion is brewed.';
    } else {
      state.lives -= 1;
      resultMessage.textContent = 'The mixture failed. You lost a life.';
    }

    renderCauldron();

    if (state.lives === 0) {
      state.status = 'game-over';
      startMessage.textContent = `Game over! Final score: ${state.score}`;
      startButton.textContent = 'Play Again';
      startScreen.hidden = false;
      game.hidden = true;
    }
  }

  function renderCauldron(): void {
    const recipe = state.activeRecipe;
    const values = calculateCauldron(state.cauldronIngredients);

    if (recipe) {
      recipeTitle.textContent = recipe.name;
      recipeRanges.replaceChildren(
        createRangeLabel('Temperature', recipe.temperature),
        createRangeLabel('Density', recipe.density),
        createRangeLabel('Magic Power', recipe.magicPower),
      );
      temperatureBar.update(values.temperature, recipe.temperature);
      densityBar.update(values.density, recipe.density);
      magicPowerBar.update(values.magicPower, recipe.magicPower);
    }

    scoreDisplay.textContent = `Score: ${state.score}`;
    timeDisplay.textContent = `Time: ${state.timeLeft}s`;
    livesDisplay.textContent = `Lives: ${state.lives}`;
    ingredientsTitle.textContent = `Ingredients: ${state.cauldronIngredients.length} / ${MAX_CAULDRON_INGREDIENTS}`;
    ingredientsTitle.classList.toggle(
      'cauldron__ingredients-title--full',
      state.cauldronIngredients.length >= MAX_CAULDRON_INGREDIENTS,
    );
    ingredientsList.replaceChildren(
      ...state.cauldronIngredients.map((ingredient) =>
        createElement('li', 'cauldron__ingredient', ingredient.name),
      ),
    );
    brewButton.disabled = state.status !== 'playing' || state.cauldronIngredients.length === 0;
    clearButton.disabled = state.cauldronIngredients.length === 0;
    shelf.render();
  }

  return cauldron;
}

function createRangeLabel(label: string, range: IRecipeRange): HTMLElement {
  return createElement('p', 'cauldron__recipe-range', `${label}: ${range.min}..${range.max}`);
}
