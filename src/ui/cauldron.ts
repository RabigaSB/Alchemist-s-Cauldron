import { INGREDIENTS } from '../data/ingredients';
import type { IRecipeRange } from '../data/recipes';
import { pickRandomRecipe } from '../data/recipes';
import { isBrewSuccessful } from '../logic/brew-check';
import { MAX_CAULDRON_INGREDIENTS } from '../logic/add-ingredient';
import { calculateCauldron } from '../logic/calculate-cauldron';
import { createStock } from '../logic/stock';
import { formatTime, getRemainingSeconds, hasIngredientsRemaining } from '../logic/timer';
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
    endTime: null,
    lives: 0,
    status: 'menu',
    gameOverReason: null,
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

  const gameOverScreen = createElement('section', 'cauldron__game-over');
  gameOverScreen.hidden = true;
  gameOverScreen.setAttribute('aria-live', 'polite');
  gameOverScreen.appendChild(createElement('h2', 'cauldron__game-over-title', 'Game Over'));
  const gameOverReason = createElement('p', 'cauldron__game-over-reason');
  gameOverScreen.appendChild(gameOverReason);
  const finalScore = createElement('p', 'cauldron__final-score');
  gameOverScreen.appendChild(finalScore);
  const playAgainButton = createElement('button', 'cauldron__start', 'Play again');
  playAgainButton.type = 'button';
  playAgainButton.addEventListener('click', startGame);
  gameOverScreen.appendChild(playAgainButton);
  cauldron.appendChild(gameOverScreen);

  const game = createElement('div', 'cauldron__game');
  game.hidden = true;

  const scoreboard = createElement('div', 'cauldron__scoreboard');
  const scoreDisplay = createElement('span', 'cauldron__score');
  const timeDisplay = createElement('output', 'cauldron__time');
  timeDisplay.setAttribute('aria-live', 'off');
  const livesDisplay = createElement('span', 'cauldron__lives');
  const timer = createElement('div', 'cauldron__timer');
  timer.setAttribute('role', 'progressbar');
  timer.setAttribute('aria-label', 'Time remaining');
  timer.setAttribute('aria-valuemin', '0');
  timer.setAttribute('aria-valuemax', `${STARTING_TIME}`);
  const timerFill = createElement('span', 'cauldron__timer-fill');
  timer.appendChild(timerFill);
  scoreboard.append(scoreDisplay, timeDisplay, livesDisplay, timer);
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
    finishIfIngredientsExhausted();
  });
  actions.appendChild(clearButton);
  game.appendChild(actions);

  const resultMessage = createElement('p', 'cauldron__result');
  resultMessage.setAttribute('aria-live', 'polite');
  game.appendChild(resultMessage);

  cauldron.appendChild(game);

  let timerInterval: ReturnType<typeof setInterval> | undefined;

  function startGame(): void {
    if (timerInterval !== undefined) {
      clearInterval(timerInterval);
    }

    state.cauldronIngredients = [];
    state.shelfStock = createStock(shelfIngredients);
    state.activeRecipe = pickRandomRecipe(GAME_DIFFICULTY);
    state.score = 0;
    state.timeLeft = STARTING_TIME;
    state.endTime = Date.now() + STARTING_TIME * 1000;
    state.lives = STARTING_LIVES;
    state.status = 'playing';
    state.gameOverReason = null;
    resultMessage.textContent = '';
    startScreen.hidden = true;
    gameOverScreen.hidden = true;
    game.hidden = false;
    renderCauldron();
    updateTimer();
    timerInterval = setInterval(updateTimer, 250);
  }

  function brew(): void {
    if (!updateTimer()) {
      return;
    }

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
      const now = Date.now();
      state.endTime = Math.min(
        (state.endTime ?? now) + TIME_BONUS_PER_BREW * 1000,
        now + MAX_TIME * 1000,
      );
      state.timeLeft = getRemainingSeconds(state.endTime, now);
      state.activeRecipe = pickRandomRecipe(GAME_DIFFICULTY);
      resultMessage.textContent = 'Success! The potion is brewed.';
    } else {
      state.lives -= 1;
      resultMessage.textContent = 'The mixture failed. You lost a life.';
    }

    renderCauldron();

    if (state.lives === 0) {
      endGame('lives');
      return;
    }

    finishIfIngredientsExhausted();
  }

  function updateTimer(): boolean {
    if (state.status !== 'playing' || state.endTime === null) {
      return false;
    }

    state.timeLeft = getRemainingSeconds(state.endTime);
    updateTimerDisplay();

    if (state.timeLeft === 0) {
      endGame('time');
      return false;
    }

    return true;
  }

  function updateTimerDisplay(): void {
    timeDisplay.value = formatTime(state.timeLeft);
    timerFill.style.width = `${(state.timeLeft / STARTING_TIME) * 100}%`;
    timer.setAttribute('aria-valuenow', `${state.timeLeft}`);
    timer.classList.toggle('cauldron__timer--urgent', state.timeLeft < 15);
    timeDisplay.classList.toggle('cauldron__time--urgent', state.timeLeft < 15);
  }

  function finishIfIngredientsExhausted(): void {
    if (
      state.status === 'playing' &&
      state.cauldronIngredients.length === 0 &&
      !hasIngredientsRemaining(state.shelfStock)
    ) {
      endGame('ingredients');
    }
  }

  function endGame(reason: NonNullable<IGameState['gameOverReason']>): void {
    if (state.status !== 'playing') {
      return;
    }

    state.status = 'game-over';
    state.gameOverReason = reason;
    if (timerInterval !== undefined) {
      clearInterval(timerInterval);
      timerInterval = undefined;
    }
    gameOverReason.textContent = getGameOverMessage(reason);
    finalScore.textContent = `Final score: ${state.score}`;
    game.hidden = true;
    startScreen.hidden = true;
    gameOverScreen.hidden = false;
  }

  function renderCauldron(): void {
    const recipe = state.activeRecipe;
    const values = calculateCauldron(state.cauldronIngredients);
    updateTimerDisplay();

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

function getGameOverMessage(reason: NonNullable<IGameState['gameOverReason']>): string {
  switch (reason) {
    case 'time': {
      return 'Time is up.';
    }
    case 'lives': {
      return 'You ran out of lives.';
    }
    case 'ingredients': {
      return 'Out of ingredients.';
    }
  }
}

function createRangeLabel(label: string, range: IRecipeRange): HTMLElement {
  return createElement('p', 'cauldron__recipe-range', `${label}: ${range.min}..${range.max}`);
}
