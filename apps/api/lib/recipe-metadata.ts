// lib/recipe-metadata.ts
// Computed recipe metadata: difficulty and formatted time

export type Difficulty = "Easy" | "Medium" | "Hard";

export function getDifficulty(prepTime: number | null, cookTime: number | null): Difficulty {
  const totalTime = (prepTime || 0) + (cookTime || 0);
  if (totalTime <= 30) return "Easy";
  if (totalTime <= 60) return "Medium";
  return "Hard";
}

export function formatTotalTime(prepTime: number | null, cookTime: number | null): string {
  const totalTime = (prepTime || 0) + (cookTime || 0);
  if (totalTime === 0) return "";
  if (totalTime < 60) return `${totalTime} min`;
  const hours = Math.floor(totalTime / 60);
  const mins = totalTime % 60;
  return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
}
