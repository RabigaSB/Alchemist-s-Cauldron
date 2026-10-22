import type { Difficulty } from '../data/recipes';

const LEADERBOARD_KEY = 'alchemists-cauldron-leaderboard';
const LEADERBOARD_LIMIT = 10;
const PLAYER_NAME_PATTERN = /^[A-Za-z0-9 _-]{2,15}$/;

export interface ILeaderboardEntry {
  name: string;
  score: number;
  timestamp: number;
  difficulty: Difficulty;
}

export type LeaderboardResult =
  { success: true; entries: ILeaderboardEntry[] } | { success: false; error: string };

export function isValidPlayerName(name: string): boolean {
  return PLAYER_NAME_PATTERN.test(name);
}

export function qualifiesForLeaderboard(
  score: number,
  entries: readonly ILeaderboardEntry[],
): boolean {
  if (entries.length < LEADERBOARD_LIMIT) {
    return true;
  }

  const lowestRankedEntry = entries.at(-1);
  return lowestRankedEntry !== undefined && score > lowestRankedEntry.score;
}

export function readLeaderboard(difficulty: Difficulty): LeaderboardResult {
  try {
    const storedEntries = window.localStorage.getItem(getLeaderboardKey(difficulty));
    if (storedEntries === null) {
      return { success: true, entries: [] };
    }

    const parsed: unknown = JSON.parse(storedEntries);
    if (!isLeaderboardEntryArray(parsed)) {
      return { success: false, error: 'Saved leaderboard data is invalid.' };
    }

    const entries = parsed.map((entry) => ({ ...entry, difficulty }));
    return { success: true, entries: sortLeaderboard(entries).slice(0, LEADERBOARD_LIMIT) };
  } catch {
    return { success: false, error: 'Leaderboard storage is unavailable.' };
  }
}

export function addLeaderboardEntry(
  name: string,
  score: number,
  difficulty: Difficulty,
  timestamp = Date.now(),
): LeaderboardResult {
  if (!isValidPlayerName(name)) {
    return { success: false, error: 'Use 2–15 letters, digits, spaces, underscores, or hyphens.' };
  }

  const current = readLeaderboard(difficulty);
  if (!current.success) {
    return current;
  }

  if (!qualifiesForLeaderboard(score, current.entries)) {
    return { success: true, entries: current.entries };
  }

  const entries = sortLeaderboard([
    ...current.entries,
    { name, score, timestamp, difficulty },
  ]).slice(0, LEADERBOARD_LIMIT);

  try {
    window.localStorage.setItem(getLeaderboardKey(difficulty), JSON.stringify(entries));
    return { success: true, entries };
  } catch {
    return { success: false, error: 'Could not save the leaderboard in this browser.' };
  }
}

export function clearLeaderboard(difficulty: Difficulty): LeaderboardResult {
  try {
    window.localStorage.removeItem(getLeaderboardKey(difficulty));
    return { success: true, entries: [] };
  } catch {
    return { success: false, error: 'Could not clear the leaderboard in this browser.' };
  }
}

export function formatLeaderboardDate(timestamp: number): string {
  const date = new Date(timestamp);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().padStart(4, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

function sortLeaderboard(entries: ILeaderboardEntry[]): ILeaderboardEntry[] {
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort(
      (left, right) =>
        right.entry.score - left.entry.score ||
        left.entry.timestamp - right.entry.timestamp ||
        left.index - right.index,
    )
    .map(({ entry }) => entry);
}

function isLeaderboardEntryArray(value: unknown): value is ILeaderboardEntry[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry: unknown) =>
        typeof entry === 'object' &&
        entry !== null &&
        'name' in entry &&
        typeof entry.name === 'string' &&
        isValidPlayerName(entry.name) &&
        'score' in entry &&
        typeof entry.score === 'number' &&
        Number.isFinite(entry.score) &&
        'timestamp' in entry &&
        typeof entry.timestamp === 'number' &&
        Number.isFinite(entry.timestamp) &&
        (!('difficulty' in entry) ||
          entry.difficulty === 'easy' ||
          entry.difficulty === 'medium' ||
          entry.difficulty === 'hard'),
    )
  );
}

function getLeaderboardKey(difficulty: Difficulty): string {
  return difficulty === 'medium' ? LEADERBOARD_KEY : `${LEADERBOARD_KEY}-${difficulty}`;
}
