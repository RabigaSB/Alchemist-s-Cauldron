import { INGREDIENTS } from '../data/ingredients';
import type { IIngredient } from '../data/ingredients';
import { DIFFICULTY_SETTINGS } from '../data/difficulty';
import type { IDifficultySettings } from '../data/difficulty';
import type { IRecipeRange } from '../data/recipes';
import type { Difficulty } from '../data/recipes';
import { pickRandomRecipe } from '../data/recipes';
import { calculateReactionValues, getReactionsForDifficulty } from '../data/reactions';
import { addIngredient } from '../logic/add-ingredient';
import { isBrewSuccessful } from '../logic/brew-check';
import { calculateCauldron } from '../logic/calculate-cauldron';
import { createStock } from '../logic/stock';
import { formatTime, getRemainingSeconds, hasIngredientsRemaining } from '../logic/timer';
import { clearSave, loadGame, saveGame } from '../storage/save';
import type { IGameSave } from '../storage/save';
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

export function createCauldron(): HTMLElement {
  const cauldron = createElement('section', 'cauldron');
  const state: IGameState = {
    difficulty: 'medium',
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
  const menuPreview = createElement('div', 'cauldron__menu-preview');
  menuPreview.append(
    createElement('p', 'cauldron__menu-empty-shelf', 'Ingredients Shelf: Empty'),
    createElement('p', 'cauldron__menu-empty-cauldron', 'Cauldron: Empty'),
  );
  startScreen.appendChild(menuPreview);
  const menuSummary = createElement('p', 'cauldron__menu-summary');
  startScreen.appendChild(menuSummary);
  const selectedDifficulty = createElement('p', 'cauldron__selected-difficulty');
  startScreen.appendChild(selectedDifficulty);
  const saveStatus = createElement('p', 'cauldron__save-status');
  saveStatus.setAttribute('aria-live', 'polite');
  startScreen.appendChild(saveStatus);
  const menuActions = createElement('div', 'cauldron__menu-actions');
  const startButton = createElement('button', 'cauldron__start', 'Start Game');
  startButton.type = 'button';
  startButton.addEventListener('click', startGame);
  menuActions.appendChild(startButton);
  const continueButton = createElement('button', 'cauldron__menu-button', 'Continue Game');
  continueButton.type = 'button';
  continueButton.hidden = true;
  continueButton.addEventListener('click', continueGame);
  menuActions.appendChild(continueButton);
  const settingsButton = createElement('button', 'cauldron__menu-button', 'Settings');
  settingsButton.type = 'button';
  menuActions.appendChild(settingsButton);
  const helpButton = createElement('button', 'cauldron__menu-button', 'Help');
  helpButton.type = 'button';
  menuActions.appendChild(helpButton);
  const startLeaderboardButton = createElement('button', 'cauldron__menu-button', 'Leaderboard');
  startLeaderboardButton.type = 'button';
  startLeaderboardButton.addEventListener('click', openLeaderboard);
  menuActions.appendChild(startLeaderboardButton);
  startScreen.appendChild(menuActions);

  const settingsPanel = createElement('section', 'cauldron__menu-dialog');
  settingsPanel.hidden = true;
  settingsPanel.setAttribute('role', 'dialog');
  settingsPanel.setAttribute('aria-modal', 'true');
  settingsPanel.setAttribute('aria-labelledby', 'settings-title');
  const settingsTitle = createElement('h2', 'cauldron__menu-dialog-title', 'Difficulty Settings');
  settingsTitle.id = 'settings-title';
  settingsPanel.appendChild(settingsTitle);
  const difficultyButtons = createElement('div', 'cauldron__difficulty-options');
  (Object.keys(DIFFICULTY_SETTINGS) as Difficulty[]).forEach((difficulty) => {
    const settings = DIFFICULTY_SETTINGS[difficulty];
    const button = createElement('button', 'cauldron__difficulty-option');
    button.type = 'button';
    button.dataset.difficulty = difficulty;
    button.addEventListener('click', () => {
      state.difficulty = difficulty;
      updateMenuSummary();
      settingsPanel.hidden = true;
    });
    button.append(
      createElement('strong', 'cauldron__difficulty-name', settings.label),
      createElement('span', 'cauldron__difficulty-summary', createDifficultySummary(settings)),
    );
    difficultyButtons.appendChild(button);
  });
  settingsPanel.appendChild(difficultyButtons);
  const closeSettingsButton = createElement('button', 'cauldron__menu-button', 'Close');
  closeSettingsButton.type = 'button';
  closeSettingsButton.addEventListener('click', () => {
    settingsPanel.hidden = true;
    settingsButton.focus();
  });
  settingsPanel.appendChild(closeSettingsButton);
  settingsButton.addEventListener('click', () => {
    settingsPanel.hidden = false;
    closeSettingsButton.focus();
  });
  cauldron.appendChild(settingsPanel);

  const helpPanel = createElement('section', 'cauldron__menu-dialog');
  helpPanel.hidden = true;
  helpPanel.setAttribute('role', 'dialog');
  helpPanel.setAttribute('aria-modal', 'true');
  helpPanel.setAttribute('aria-labelledby', 'help-title');
  const helpTitle = createElement('h2', 'cauldron__menu-dialog-title', 'How to Play');
  helpTitle.id = 'help-title';
  helpPanel.appendChild(helpTitle);
  const helpRules = createElement('ul', 'cauldron__help-rules');
  [
    'Choose a difficulty in Settings, then start a game.',
    'Add ingredients to the cauldron. Each portion uses one stock.',
    'Move Temperature, Density, and Magic Power into the recipe ranges.',
    'Brew checks all three values using the selected difficulty tolerance.',
    'A successful brew earns points and time. A failed brew costs a life.',
    'Pause to stop the timer. The game ends when time, lives, or ingredients run out.',
  ].forEach((rule) => helpRules.appendChild(createElement('li', undefined, rule)));
  helpPanel.appendChild(helpRules);
  const closeHelpButton = createElement('button', 'cauldron__menu-button', 'Close');
  closeHelpButton.type = 'button';
  closeHelpButton.addEventListener('click', () => {
    helpPanel.hidden = true;
    helpButton.focus();
  });
  helpPanel.appendChild(closeHelpButton);
  helpButton.addEventListener('click', () => {
    helpPanel.hidden = false;
    closeHelpButton.focus();
  });
  cauldron.appendChild(helpPanel);
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
  const leaderboardTitle = createElement('h2', 'cauldron__leaderboard-title');
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
  const difficultyDisplay = createElement('span', 'cauldron__difficulty');
  const timeDisplay = createElement('output', 'cauldron__time');
  timeDisplay.setAttribute('aria-live', 'off');
  const livesDisplay = createElement('span', 'cauldron__lives');
  const timer = createElement('div', 'cauldron__timer');
  timer.setAttribute('role', 'progressbar');
  timer.setAttribute('aria-label', 'Time remaining');
  timer.setAttribute('aria-valuemin', '0');
  timer.setAttribute('aria-valuemax', `${DIFFICULTY_SETTINGS[state.difficulty].startingTime}`);
  const timerFill = createElement('span', 'cauldron__timer-fill');
  timer.appendChild(timerFill);
  scoreboard.append(scoreDisplay, difficultyDisplay, timeDisplay, livesDisplay, timer);
  game.appendChild(scoreboard);

  //middle
  const middlePanel = createElement('div', 'cauldron__middle-panel');
  game.appendChild(middlePanel);

  const shelf = createShelf(
    state,
    handleIngredientAdded,
    () => DIFFICULTY_SETTINGS[state.difficulty].ingredientsOnShelf,
    () => DIFFICULTY_SETTINGS[state.difficulty].maxCauldronIngredients,
  );
  middlePanel.appendChild(shelf.element);

  const cauldronSvg = createSvgBubble();
  cauldronSvg.classList.add('cauldron__drop-target');
  const floatingIngredients = createElement('div', 'cauldron__ingredient-layer');
  floatingIngredients.setAttribute('aria-hidden', 'true');
  cauldronSvg.appendChild(floatingIngredients);
  cauldronSvg.addEventListener('animationend', handleCauldronAnimationEnd);
  game.addEventListener('animationend', handleGameAnimationEnd);
  cauldronSvg.addEventListener('dragover', handleIngredientDragOver);
  cauldronSvg.addEventListener('dragleave', handleIngredientDragLeave);
  cauldronSvg.addEventListener('drop', handleIngredientDrop);
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

  const pourOutButton = createElement('button', 'cauldron__pour-out', 'Pour Out');
  pourOutButton.type = 'button';
  pourOutButton.disabled = true;
  pourOutButton.addEventListener('click', pourOut);
  actions.appendChild(pourOutButton);
  bottomPanel.appendChild(actions);

  const resultMessage = createElement('p', 'cauldron__result');
  resultMessage.setAttribute('aria-live', 'polite');
  game.appendChild(resultMessage);

  cauldron.appendChild(game);

  let timerInterval: ReturnType<typeof setInterval> | undefined;
  let pausedTimeMs = 0;
  let leaderboardReturnFocus: HTMLElement | null = null;

  updateMenuSummary();
  updateContinueButton();
  document.addEventListener('visibilitychange', handleVisibilityChange);

  function startGame(): void {
    stopTimer();

    state.cauldronIngredients = [];
    const settings = DIFFICULTY_SETTINGS[state.difficulty];
    state.shelfStock = createStock(INGREDIENTS.slice(0, settings.ingredientsOnShelf));
    state.activeRecipe = pickRandomRecipe(state.difficulty);
    state.score = 0;
    state.timeLeft = settings.startingTime;
    state.endTime = Date.now() + settings.startingTime * 1000;
    pausedTimeMs = 0;
    state.lives = settings.lives;
    state.status = 'playing';
    state.gameOverReason = null;
    timer.setAttribute('aria-valuemax', `${settings.startingTime}`);
    resultMessage.textContent = '';
    settingsPanel.hidden = true;
    helpPanel.hidden = true;
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
    saveStatus.textContent = '';
  }

  function continueGame(): void {
    const result = loadGame();
    if (!result.success) {
      continueButton.hidden = true;
      saveStatus.textContent = result.error;
      return;
    }

    if (result.save === null) {
      continueButton.hidden = true;
      saveStatus.textContent = 'No unfinished game is available to continue.';
      return;
    }

    restoreGame(result.save);
  }

  function restoreGame(save: IGameSave): void {
    state.difficulty = save.difficulty;
    state.score = save.score;
    state.timeLeft = save.timeLeft;
    state.lives = save.lives;
    state.activeRecipe = save.activeRecipe;
    state.cauldronIngredients = save.cauldronIngredients;
    state.shelfStock = save.shelfStock;
    state.status = 'paused';
    state.endTime = null;
    state.gameOverReason = null;
    pausedTimeMs = save.timeLeft * 1000;
    timer.setAttribute('aria-valuemax', `${DIFFICULTY_SETTINGS[state.difficulty].startingTime}`);
    startScreen.hidden = true;
    gameOverScreen.hidden = true;
    settingsPanel.hidden = true;
    helpPanel.hidden = true;
    game.hidden = false;
    pauseDialog.hidden = false;
    resultMessage.textContent = 'Game restored. Resume when you are ready.';
    updateMenuSummary();
    renderCauldron();
    saveCurrentGame();
    resumeButton.focus();
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
    saveCurrentGame();
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
    saveCurrentGame();
    pauseButton.focus();
  }

  function exitToMenu(): void {
    stopTimer();
    const clearResult = clearSave();
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
    saveStatus.textContent = clearResult.success ? '' : clearResult.error;
    pauseDialog.hidden = true;
    gameOverScreen.hidden = true;
    game.hidden = true;
    startScreen.hidden = false;
    renderCauldron();
    updateContinueButton();
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

    const values = calculateReactionValues(
      state.cauldronIngredients,
      getReactionsForDifficulty(state.difficulty),
    );
    const successful = isBrewSuccessful(
      values,
      state.activeRecipe,
      DIFFICULTY_SETTINGS[state.difficulty].tolerance,
    );
    triggerBrewFeedback(successful);
    clearCauldron();

    if (successful) {
      const settings = DIFFICULTY_SETTINGS[state.difficulty];
      state.score += settings.scorePerBrew;
      const now = Date.now();
      state.endTime = Math.min(
        (state.endTime ?? now) + settings.timeBonusPerBrew * 1000,
        now + settings.startingTime * 1000,
      );
      state.timeLeft = getRemainingSeconds(state.endTime, now);
      state.activeRecipe = pickRandomRecipe(state.difficulty);
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

  function pourOut(): void {
    if (!updateTimer() || state.cauldronIngredients.length === 0 || state.endTime === null) {
      return;
    }

    state.endTime -= 10_000;
    state.timeLeft = getRemainingSeconds(state.endTime);
    clearCauldron();
    resultMessage.textContent = 'You poured out the mixture. 10 seconds lost.';
    renderCauldron();

    if (state.timeLeft === 0) {
      endGame('time');
      return;
    }

    finishIfIngredientsExhausted();
  }

  function clearCauldron(): void {
    state.cauldronIngredients.length = 0;
  }

  function triggerBrewFeedback(successful: boolean): void {
    const cauldronClass = successful
      ? 'cauldron__drop-target--success'
      : 'cauldron__drop-target--failure';

    cauldronSvg.classList.remove(
      'cauldron__drop-target--success',
      'cauldron__drop-target--failure',
    );
    game.classList.remove('cauldron__game--failure');
    void cauldronSvg.offsetWidth;
    cauldronSvg.classList.add(cauldronClass);

    if (!successful) {
      game.classList.add('cauldron__game--failure');
    }
  }

  function handleCauldronAnimationEnd(event: AnimationEvent): void {
    if (event.animationName === 'cauldron-brew-success') {
      cauldronSvg.classList.remove('cauldron__drop-target--success');
    }
    if (event.animationName === 'cauldron-explosion') {
      cauldronSvg.classList.remove('cauldron__drop-target--failure');
    }
  }

  function handleGameAnimationEnd(event: AnimationEvent): void {
    if (event.animationName === 'cauldron-screen-shake') {
      game.classList.remove('cauldron__game--failure');
    }
  }

  function handleIngredientDragOver(event: DragEvent): void {
    const maxIngredients = DIFFICULTY_SETTINGS[state.difficulty].maxCauldronIngredients;
    const hasIngredientPayload =
      event.dataTransfer?.types.includes('application/x-alchemist-ingredient') ?? false;

    if (
      state.status !== 'playing' ||
      state.cauldronIngredients.length >= maxIngredients ||
      !hasIngredientPayload
    ) {
      cauldronSvg.classList.remove('cauldron__drop-target--active');
      return;
    }

    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    cauldronSvg.classList.add('cauldron__drop-target--active');
  }

  function handleIngredientDragLeave(event: DragEvent): void {
    if (event.relatedTarget instanceof Node && cauldronSvg.contains(event.relatedTarget)) {
      return;
    }

    cauldronSvg.classList.remove('cauldron__drop-target--active');
  }

  function handleIngredientDrop(event: DragEvent): void {
    event.preventDefault();
    cauldronSvg.classList.remove('cauldron__drop-target--active');

    if (state.status !== 'playing' || event.dataTransfer === null) {
      return;
    }

    const ingredientId = event.dataTransfer.getData('application/x-alchemist-ingredient');
    const ingredient = INGREDIENTS.find((item) => item.id === ingredientId);
    if (ingredient === undefined) {
      return;
    }

    handleIngredientAdded(ingredient);
  }

  function handleIngredientAdded(ingredient: IIngredient): void {
    if (!updateTimer()) {
      return;
    }

    const beforeIngredients = [...state.cauldronIngredients];
    const maxIngredients = DIFFICULTY_SETTINGS[state.difficulty].maxCauldronIngredients;
    if (!addIngredient(state, ingredient, maxIngredients)) {
      return;
    }

    const reactions = getReactionsForDifficulty(state.difficulty);
    const beforeValues = calculateCauldron(beforeIngredients);
    const afterValues = calculateCauldron(state.cauldronIngredients);
    const firedReactions = reactions.filter(
      (reaction) =>
        !reaction.isActive(beforeIngredients, beforeValues) &&
        reaction.isActive(state.cauldronIngredients, afterValues),
    );

    for (const reaction of firedReactions) {
      if (reaction.timePenaltySeconds && state.endTime !== null) {
        state.endTime -= reaction.timePenaltySeconds * 1000;
        state.timeLeft = getRemainingSeconds(state.endTime);
      }
      if (reaction.livesLost) {
        state.lives = Math.max(0, state.lives - reaction.livesLost);
      }
      if (reaction.clearsCauldron) {
        clearCauldron();
      }
    }

    if (firedReactions.length > 0) {
      resultMessage.textContent = `Reaction: ${firedReactions.map((reaction) => reaction.name).join(', ')}!`;
    }

    renderCauldron();

    if (state.timeLeft === 0) {
      endGame('time');
      return;
    }
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

    const previousTimeLeft = state.timeLeft;
    state.timeLeft = getRemainingSeconds(state.endTime);
    updateTimerDisplay();
    if (state.timeLeft !== previousTimeLeft) {
      saveCurrentGame();
    }

    if (state.timeLeft === 0) {
      endGame('time');
      return false;
    }

    return true;
  }

  function updateTimerDisplay(): void {
    timeDisplay.value = formatTime(state.timeLeft);
    const startingTime = DIFFICULTY_SETTINGS[state.difficulty].startingTime;
    timerFill.style.width = `${(state.timeLeft / startingTime) * 100}%`;
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
    const clearResult = clearSave();
    if (timerInterval !== undefined) {
      clearInterval(timerInterval);
      timerInterval = undefined;
    }
    gameOverReason.textContent = getGameOverMessage(reason);
    finalScore.textContent = `Final score: ${state.score}`;
    nameError.textContent = '';
    nameInput.value = '';
    const storageErrors: string[] = clearResult.success ? [] : [clearResult.error];
    const leaderboard = readLeaderboard(state.difficulty);
    if (leaderboard.success && qualifiesForLeaderboard(state.score, leaderboard.entries)) {
      nameForm.hidden = false;
    } else {
      nameForm.hidden = true;
      if (!leaderboard.success) {
        storageErrors.push(leaderboard.error);
      }
    }
    scoreSaveStatus.textContent = storageErrors.join(' ');
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

    const result = addLeaderboardEntry(name, state.score, state.difficulty);
    if (!result.success) {
      nameError.textContent = result.error;
      return;
    }

    nameForm.hidden = true;
    scoreSaveStatus.textContent = 'Your score has been saved.';
  }

  function saveCurrentGame(): void {
    if (state.status !== 'playing' && state.status !== 'paused') {
      return;
    }

    const result = saveGame(state);
    if (!result.success) {
      resultMessage.textContent = result.error;
    }
    updateContinueButton();
  }

  function updateContinueButton(): void {
    const result = loadGame();
    continueButton.hidden = !result.success || result.save === null;
    if (!result.success) {
      saveStatus.textContent = result.error;
    }
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
    leaderboardTitle.textContent = `Top 10 Players — ${DIFFICULTY_SETTINGS[state.difficulty].label}`;
    const result = readLeaderboard(state.difficulty);
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
      emptyCell.colSpan = 5;
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
    const result = clearLeaderboard(state.difficulty);
    if (result.success) {
      hideClearConfirmation();
      renderLeaderboard();
      leaderboardStatus.textContent = 'Leaderboard cleared.';
    } else {
      clearConfirmationStatus.textContent = result.error;
    }
  }

  function updateMenuSummary(): void {
    const settings = DIFFICULTY_SETTINGS[state.difficulty];
    menuSummary.textContent = 'Score: 0 · Time: 00:00 · Lives: none';
    selectedDifficulty.textContent = `Difficulty: ${settings.label}`;
    difficultyButtons.querySelectorAll<HTMLButtonElement>('[data-difficulty]').forEach((button) => {
      const isSelected = button.dataset.difficulty === state.difficulty;
      button.setAttribute('aria-pressed', `${isSelected}`);
    });
  }

  function renderCauldron(): void {
    const recipe = state.activeRecipe;
    const values = calculateReactionValues(
      state.cauldronIngredients,
      getReactionsForDifficulty(state.difficulty),
    );
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
    difficultyDisplay.textContent = `Difficulty: ${DIFFICULTY_SETTINGS[state.difficulty].label}`;
    livesDisplay.textContent = `Lives: ${state.lives}`;
    const maxIngredients = DIFFICULTY_SETTINGS[state.difficulty].maxCauldronIngredients;
    ingredientsTitle.textContent = `Ingredients: ${state.cauldronIngredients.length} / ${maxIngredients}`;
    ingredientsTitle.classList.toggle(
      'cauldron__ingredients-title--full',
      state.cauldronIngredients.length >= maxIngredients,
    );
    ingredientsList.replaceChildren(
      ...state.cauldronIngredients.map((ingredient) =>
        createElement('li', 'cauldron__ingredient', ingredient.name),
      ),
    );
    floatingIngredients.replaceChildren(
      ...state.cauldronIngredients.map((ingredient, index) => {
        const icon = createElement('img', 'cauldron__ingredient-icon');
        icon.src = ingredient.icon;
        icon.alt = '';
        icon.style.setProperty('--ingredient-index', `${index}`);
        return icon;
      }),
    );
    brewButton.disabled = state.status !== 'playing' || state.cauldronIngredients.length === 0;
    pourOutButton.disabled = state.status !== 'playing' || state.cauldronIngredients.length === 0;
    pauseButton.disabled = state.status !== 'playing';
    shelf.render();
    saveCurrentGame();
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

  ['Rank', 'Name', 'Score', 'Difficulty', 'Date'].forEach((label) => {
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
  const values = [
    `${rank}`,
    entry.name,
    `${entry.score}`,
    DIFFICULTY_SETTINGS[entry.difficulty].label,
    formatLeaderboardDate(entry.timestamp),
  ];

  values.forEach((value) => {
    const cell = createElement('td');
    cell.textContent = value;
    row.appendChild(cell);
  });

  return row;
}

function createDifficultySummary(settings: IDifficultySettings): string {
  return [
    `${settings.ingredientsOnShelf} ingredients`,
    `cauldron ${settings.maxCauldronIngredients}`,
    `${settings.startingTime}s`,
    `±${settings.tolerance}`,
    `${settings.lives} lives`,
    `${settings.scorePerBrew} pts`,
    `+${settings.timeBonusPerBrew}s`,
    `${settings.reactions} reactions`,
  ].join(' · ');
}
