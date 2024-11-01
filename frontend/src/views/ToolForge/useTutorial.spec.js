import { describe, it, expect, beforeEach } from 'vitest'
import { useTutorial } from './useTutorial'

describe('useTutorial', () => {
  let tutorial

  beforeEach(() => {
    tutorial = useTutorial()
  })

  it('initializes with correct default values', () => {
    expect(tutorial.startTutorial.value).toBe(false)
    expect(Array.isArray(tutorial.tutorialConfig.value)).toBe(true)
    expect(tutorial.tutorialConfig.value.length).toBeGreaterThan(0)
  })

  it('has the correct structure for tutorial steps', () => {
    const firstStep = tutorial.tutorialConfig.value[0]
    expect(firstStep).toHaveProperty('target')
    expect(firstStep).toHaveProperty('position')
    expect(firstStep).toHaveProperty('title')
    expect(firstStep).toHaveProperty('content')
  })

  it('closes the tutorial correctly', () => {
    tutorial.startTutorial.value = true
    tutorial.onTutorialClose()
    expect(tutorial.startTutorial.value).toBe(false)
  })

  it('has the correct number of tutorial steps', () => {
    // Adjust this number based on your actual implementation
    const expectedSteps = 10
    expect(tutorial.tutorialConfig.value.length).toBe(expectedSteps)
  })
})