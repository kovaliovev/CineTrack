import { describe, it, expect } from 'vitest'
import { formatScore, isValidScore, scoreSteps } from './utils'

describe('scoreSteps', () => {
  it('has 20 values from 0.5 to 10.0', () => {
    expect(scoreSteps).toHaveLength(20)
    expect(scoreSteps[0]).toBe(0.5)
    expect(scoreSteps[19]).toBe(10.0)
  })
})

describe('formatScore', () => {
  it('formats whole numbers without decimal', () => {
    expect(formatScore(8.0)).toBe('8')
  })
  it('formats half scores with .5', () => {
    expect(formatScore(7.5)).toBe('7.5')
  })
})

describe('isValidScore', () => {
  it('accepts values from 0.5 to 10.0 in 0.5 steps', () => {
    expect(isValidScore(0.5)).toBe(true)
    expect(isValidScore(10.0)).toBe(true)
    expect(isValidScore(7.5)).toBe(true)
  })
  it('rejects out-of-range values', () => {
    expect(isValidScore(0)).toBe(false)
    expect(isValidScore(10.5)).toBe(false)
    expect(isValidScore(3.3)).toBe(false)
  })
})
