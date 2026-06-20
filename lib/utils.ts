export const scoreSteps: number[] = Array.from(
  { length: 20 },
  (_, i) => Math.round((i + 1) * 0.5 * 10) / 10
)

export function formatScore(score: number): string {
  return score % 1 === 0 ? String(score) : String(score)
}

export function isValidScore(score: number): boolean {
  return scoreSteps.includes(Math.round(score * 10) / 10)
}
