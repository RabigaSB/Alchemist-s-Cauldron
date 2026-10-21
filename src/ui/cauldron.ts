import { INGREDIENTS } from '../data/ingredients';
import type { IRecipeRange } from '../data/recipes';
import { pickRandomRecipe } from '../data/recipes';
import { isBrewSuccessful } from '../logic/brew-check';
import { MAX_CAULDRON_INGREDIENTS } from '../logic/add-ingredient';
import { calculateCauldron } from '../logic/calculate-cauldron';
import { createStock } from '../logic/stock';
import { formatTime, getRemainingSeconds, hasIngredientsRemaining } from '../logic/timer';
import {
  addLeaderboardEntry,
  clearLeaderboard,
  formatLeaderboardDate,
  isValidPlayerName,
  qualifiesForLeaderboard,
  readLeaderboard,
} from '../storage/leaderboard';
import type { ILeaderboardEntry } from '../storage/leaderboard';
import type { IGameState } from '../state/game-state';
import { createElement } from './create-element';
import { createParameterBar } from './parameter-bar';
import { createShelf } from './shelf';
import { createSvgBubble } from './svg-bubble';

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
  const startLeaderboardButton = createElement('button', 'cauldron__menu-button', 'Leaderboard');
  startLeaderboardButton.type = 'button';
  startLeaderboardButton.addEventListener('click', openLeaderboard);
  startScreen.appendChild(startLeaderboardButton);
  cauldron.appendChild(startScreen);

  const gameOverScreen = createElement('section', 'cauldron__game-over');
  gameOverScreen.hidden = true;
  gameOverScreen.setAttribute('aria-live', 'polite');
  gameOverScreen.appendChild(createElement('h2', 'cauldron__game-over-title', 'Game Over'));
  const gameOverReason = createElement('p', 'cauldron__game-over-reason');
  gameOverScreen.appendChild(gameOverReason);
  const finalScore = createElement('p', 'cauldron__final-score');
  gameOverScreen.appendChild(finalScore);
  const nameForm = createElement('form', 'cauldron__name-form');
  nameForm.hidden = true;
  const nameLabel = createElement(
    'label',
    'cauldron__name-label',
    'Enter your name for the Top 10:',
  );
  const nameInput = createElement('input', 'cauldron__name-input');
  nameInput.name = 'playerName';
  nameInput.required = true;
  nameInput.minLength = 2;
  nameInput.maxLength = 15;
  nameInput.pattern = '(?:[A-Za-z0-9 _]|-){2,15}';
  nameLabel.appendChild(nameInput);
  nameForm.appendChild(nameLabel);
  const nameError = createElement('p', 'cauldron__name-error');
  nameError.setAttribute('aria-live', 'polite');
  nameForm.appendChild(nameError);
  const saveScoreButton = createElement('button', 'cauldron__menu-button', 'Save Score');
  saveScoreButton.type = 'submit';
  nameForm.appendChild(saveScoreButton);
  nameForm.addEventListener('submit', saveScore);
  gameOverScreen.appendChild(nameForm);
  const scoreSaveStatus = createElement('p', 'cauldron__score-save-status');
  scoreSaveStatus.setAttribute('aria-live', 'polite');
  gameOverScreen.appendChild(scoreSaveStatus);
  const gameOverLeaderboardButton = createElement('button', 'cauldron__menu-button', 'Leaderboard');
  gameOverLeaderboardButton.type = 'button';
  gameOverLeaderboardButton.addEventListener('click', openLeaderboard);
  gameOverScreen.appendChild(gameOverLeaderboardButton);
  const playAgainButton = createElement('button', 'cauldron__start', 'Play again');
  playAgainButton.type = 'button';
  playAgainButton.addEventListener('click', startGame);
  gameOverScreen.appendChild(playAgainButton);
  cauldron.appendChild(gameOverScreen);

  const leaderboardDialog = createElement('section', 'cauldron__leaderboard-dialog');
  leaderboardDialog.hidden = true;
  leaderboardDialog.setAttribute('role', 'dialog');
  leaderboardDialog.setAttribute('aria-modal', 'true');
  leaderboardDialog.setAttribute('aria-labelledby', 'leaderboard-title');
  const leaderboardContent = createElement('div', 'cauldron__leaderboard-content');
  const leaderboardTitle = createElement('h2', 'cauldron__leaderboard-title', 'Top 10 Players');
  leaderboardTitle.id = 'leaderboard-title';
  leaderboardContent.appendChild(leaderboardTitle);
  const leaderboardStatus = createElement('p', 'cauldron__leaderboard-status');
  leaderboardStatus.setAttribute('aria-live', 'polite');
  leaderboardContent.appendChild(leaderboardStatus);
  const leaderboardTable = createElement('table', 'cauldron__leaderboard-table');
  leaderboardContent.appendChild(leaderboardTable);
  const leaderboardActions = createElement('div', 'cauldron__leaderboard-actions');
  const clearLeaderboardButton = createElement(
    'button',
    'cauldron__menu-button',
    'Clear Leaderboard',
  );
  clearLeaderboardButton.type = 'button';
  clearLeaderboardButton.addEventListener('click', showClearConfirmation);
  leaderboardActions.appendChild(clearLeaderboardButton);
  const closeLeaderboardButton = createElement('button', 'cauldron__menu-button', 'Close');
  closeLeaderboardButton.type = 'button';
  closeLeaderboardButton.addEventListener('click', closeLeaderboard);
  leaderboardActions.appendChild(closeLeaderboardButton);
  leaderboardContent.appendChild(leaderboardActions);
  leaderboardDialog.appendChild(leaderboardContent);

  const clearConfirmation = createElement('section', 'cauldron__clear-confirmation');
  clearConfirmation.hidden = true;
  clearConfirmation.setAttribute('aria-labelledby', 'clear-confirmation-title');
  clearConfirmation.appendChild(
    createElement('h2', 'cauldron__leaderboard-title', 'Clear Leaderboard?'),
  ).id = 'clear-confirmation-title';
  const clearConfirmationStatus = createElement(
    'p',
    'cauldron__leaderboard-status',
    'This will permanently remove all saved scores.',
  );
  clearConfirmation.appendChild(clearConfirmationStatus);
  const confirmationActions = createElement('div', 'cauldron__leaderboard-actions');
  const confirmClearButton = createElement('button', 'cauldron__menu-button', 'Confirm Clear');
  confirmClearButton.type = 'button';
  confirmClearButton.addEventListener('click', confirmClearLeaderboard);
  confirmationActions.appendChild(confirmClearButton);
  const cancelClearButton = createElement('button', 'cauldron__menu-button', 'Cancel');
  cancelClearButton.type = 'button';
  cancelClearButton.addEventListener('click', hideClearConfirmation);
  confirmationActions.appendChild(cancelClearButton);
  clearConfirmation.appendChild(confirmationActions);
  leaderboardDialog.appendChild(clearConfirmation);
  cauldron.appendChild(leaderboardDialog);

  const pauseDialog = createElement('section', 'cauldron__pause-dialog');
  pauseDialog.hidden = true;
  pauseDialog.setAttribute('role', 'dialog');
  pauseDialog.setAttribute('aria-modal', 'true');
  pauseDialog.setAttribute('aria-labelledby', 'pause-title');
  const pauseTitle = createElement('h2', 'cauldron__pause-title', 'Game paused');
  pauseTitle.id = 'pause-title';
  pauseDialog.appendChild(pauseTitle);
  const resumeButton = createElement('button', 'cauldron__pause-action', 'Resume');
  resumeButton.type = 'button';
  resumeButton.addEventListener('click', resumeGame);
  pauseDialog.appendChild(resumeButton);
  const exitButton = createElement('button', 'cauldron__pause-action', 'Exit to Menu');
  exitButton.type = 'button';
  exitButton.addEventListener('click', exitToMenu);
  pauseDialog.appendChild(exitButton);
  cauldron.appendChild(pauseDialog);

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

  //middle
  const middlePanel = createElement('div', 'cauldron__middle-panel');
  game.appendChild(middlePanel);

  const shelf = createShelf(state, renderCauldron);
  middlePanel.appendChild(shelf.element);

  const cauldronSvg = createSvgBubble();
  middlePanel.appendChild(cauldronSvg);

  const recipePanel = createElement('section', 'cauldron__recipe-panel');
  const recipeText = createElement('div', 'cauldron__recipe-text', 'Current Recipe');
  const recipeTitle = createElement('h3', 'cauldron__recipe');
  recipePanel.append(recipeText, recipeTitle);
  const recipeIcon = createElement('img', 'cauldron__recipe-icon');
  recipeIcon.src = '/assets/icons/hand-sparkles-solid-full.svg';
  recipeIcon.alt = 'icon';
  recipePanel.appendChild(recipeIcon);
  const recipeRanges = createElement('div', 'cauldron__recipe-ranges');
  recipePanel.appendChild(recipeRanges);
  const ingredientsTitle = createElement('h3', 'cauldron__ingredients-title');
  recipePanel.appendChild(ingredientsTitle);
  middlePanel.appendChild(recipePanel);

  const ingredientsList = createElement('ol', 'cauldron__ingredients-list');
  middlePanel.appendChild(ingredientsList);

  //bottom
  const bottomPanel = createElement('div', 'cauldron__bottom-panel');
  game.appendChild(bottomPanel);

  const parameterBars = createElement('div', 'cauldron__parameters');
  const temperatureBar = createParameterBar('Temperature', { min: 0, max: 0 }, -80, 100);
  const densityBar = createParameterBar('Density', { min: 0, max: 0 }, -40, 120);
  const magicPowerBar = createParameterBar('Magic Power', { min: 0, max: 0 }, 0, 160);
  parameterBars.append(temperatureBar.element, densityBar.element, magicPowerBar.element);
  bottomPanel.appendChild(parameterBars);

  const actions = createElement('div', 'cauldron__actions');
  const pauseButton = createElement('button', 'cauldron__pause', 'Pause');
  pauseButton.type = 'button';
  pauseButton.addEventListener('click', pauseGame);
  actions.appendChild(pauseButton);

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
  bottomPanel.appendChild(actions);

  const resultMessage = createElement('p', 'cauldron__result');
  resultMessage.setAttribute('aria-live', 'polite');
  game.appendChild(resultMessage);

  cauldron.appendChild(game);

  let timerInterval: ReturnType<typeof setInterval> | undefined;
  let pausedTimeMs = 0;
  let leaderboardReturnFocus: HTMLElement | null = null;

  document.addEventListener('visibilitychange', handleVisibilityChange);

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
    pausedTimeMs = 0;
    state.lives = STARTING_LIVES;
    state.status = 'playing';
    state.gameOverReason = null;
    resultMessage.textContent = '';
    nameForm.hidden = true;
    nameInput.value = '';
    nameError.textContent = '';
    scoreSaveStatus.textContent = '';
    startScreen.hidden = true;
    gameOverScreen.hidden = true;
    pauseDialog.hidden = true;
    game.hidden = false;
    renderCauldron();
    updateTimer();
    timerInterval = setInterval(updateTimer, 250);
  }

  function pauseGame(): void {
    if (!updateTimer() || state.status !== 'playing' || state.endTime === null) {
      return;
    }

    pausedTimeMs = Math.max(0, state.endTime - Date.now());
    state.timeLeft = getRemainingSeconds(state.endTime);
    state.endTime = null;
    state.status = 'paused';
    stopTimer();
    pauseDialog.hidden = false;
    renderCauldron();
    resumeButton.focus();
  }

  function resumeGame(): void {
    if (state.status !== 'paused') {
      return;
    }

    if (pausedTimeMs <= 0) {
      endGame('time');
      return;
    }

    state.endTime = Date.now() + pausedTimeMs;
    state.timeLeft = getRemainingSeconds(state.endTime);
    pausedTimeMs = 0;
    state.status = 'playing';
    pauseDialog.hidden = true;
    renderCauldron();
    updateTimer();
    timerInterval = setInterval(updateTimer, 250);
    pauseButton.focus();
  }

  function exitToMenu(): void {
    stopTimer();
    state.status = 'menu';
    state.activeRecipe = null;
    state.cauldronIngredients = [];
    state.shelfStock = {};
    state.score = 0;
    state.timeLeft = 0;
    state.endTime = null;
    state.lives = 0;
    state.gameOverReason = null;
    pausedTimeMs = 0;
    startMessage.textContent = 'Ready to brew a potion?';
    startButton.textContent = 'Start Game';
    pauseDialog.hidden = true;
    gameOverScreen.hidden = true;
    game.hidden = true;
    startScreen.hidden = false;
    renderCauldron();
    startButton.focus();
  }

  function handleVisibilityChange(): void {
    if (document.hidden && state.status === 'playing') {
      pauseGame();
    }
  }

  function stopTimer(): void {
    if (timerInterval !== undefined) {
      clearInterval(timerInterval);
      timerInterval = undefined;
    }
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
    nameError.textContent = '';
    nameInput.value = '';
    scoreSaveStatus.textContent = '';
    const leaderboard = readLeaderboard();
    if (leaderboard.success && qualifiesForLeaderboard(state.score, leaderboard.entries)) {
      nameForm.hidden = false;
    } else {
      nameForm.hidden = true;
      if (!leaderboard.success) {
        scoreSaveStatus.textContent = leaderboard.error;
      }
    }
    game.hidden = true;
    startScreen.hidden = true;
    gameOverScreen.hidden = false;
    if (!nameForm.hidden) {
      nameInput.focus();
    }
  }

  function saveScore(event: SubmitEvent): void {
    event.preventDefault();
    const name = nameInput.value;

    if (!isValidPlayerName(name)) {
      nameError.textContent = 'Use 2–15 letters, digits, spaces, underscores, or hyphens.';
      nameInput.focus();
      return;
    }

    const result = addLeaderboardEntry(name, state.score);
    if (!result.success) {
      nameError.textContent = result.error;
      return;
    }

    nameForm.hidden = true;
    scoreSaveStatus.textContent = 'Your score has been saved.';
  }

  function openLeaderboard(event?: Event): void {
    leaderboardReturnFocus =
      event?.currentTarget instanceof HTMLElement ? event.currentTarget : startLeaderboardButton;
    renderLeaderboard();
    leaderboardContent.hidden = false;
    clearConfirmation.hidden = true;
    leaderboardDialog.hidden = false;
    closeLeaderboardButton.focus();
  }

  function closeLeaderboard(): void {
    leaderboardDialog.hidden = true;
    leaderboardReturnFocus?.focus();
  }

  function renderLeaderboard(): void {
    const result = readLeaderboard();
    leaderboardStatus.textContent = result.success ? '' : result.error;
    leaderboardTable.replaceChildren();

    if (!result.success) {
      return;
    }

    leaderboardTable.appendChild(createLeaderboardHeader());
    const body = createElement('tbody');
    result.entries.forEach((entry, index) =>
      body.appendChild(createLeaderboardRow(entry, index + 1)),
    );
    if (result.entries.length === 0) {
      const emptyRow = createElement('tr');
      const emptyCell = createElement('td');
      emptyCell.textContent = 'No scores yet.';
      emptyCell.colSpan = 4;
      emptyRow.appendChild(emptyCell);
      body.appendChild(emptyRow);
    }
    leaderboardTable.appendChild(body);
  }

  function showClearConfirmation(): void {
    clearConfirmationStatus.textContent = 'This will permanently remove all saved scores.';
    leaderboardContent.hidden = true;
    clearConfirmation.hidden = false;
    cancelClearButton.focus();
  }

  function hideClearConfirmation(): void {
    clearConfirmation.hidden = true;
    leaderboardContent.hidden = false;
    clearLeaderboardButton.focus();
  }

  function confirmClearLeaderboard(): void {
    const result = clearLeaderboard();
    if (result.success) {
      hideClearConfirmation();
      renderLeaderboard();
      leaderboardStatus.textContent = 'Leaderboard cleared.';
    } else {
      clearConfirmationStatus.textContent = result.error;
    }
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
    clearButton.disabled = state.status !== 'playing' || state.cauldronIngredients.length === 0;
    pauseButton.disabled = state.status !== 'playing';
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
  const spanRange = createElement('span', '', `(${range.min};  ${range.max})`);
  const container = createElement('p', 'cauldron__recipe-range', `${label}: `);
  container.appendChild(spanRange);
  return container;
}

function createLeaderboardHeader(): HTMLTableSectionElement {
  const header = createElement('thead');
  const row = createElement('tr');

  ['Rank', 'Name', 'Score', 'Date'].forEach((label) => {
    const cell = createElement('th');
    cell.scope = 'col';
    cell.textContent = label;
    row.appendChild(cell);
  });

  header.appendChild(row);
  return header;
}

function createLeaderboardRow(entry: ILeaderboardEntry, rank: number): HTMLTableRowElement {
  const row = createElement('tr');
  const values = [`${rank}`, entry.name, `${entry.score}`, formatLeaderboardDate(entry.timestamp)];

  values.forEach((value) => {
    const cell = createElement('td');
    cell.textContent = value;
    row.appendChild(cell);
  });

  return row;
}
