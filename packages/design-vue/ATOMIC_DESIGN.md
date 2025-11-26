# Taskin Mascot - Atomic Design Structure

This document describes the refactored structure of the Taskin mascot component following Atomic Design principles.

## Structure

```
components/
├── atoms/              # Basic building blocks
│   ├── taskin-body/
│   ├── taskin-eyes/
│   ├── taskin-mouth/
│   ├── taskin-tentacles/
│   └── taskin-arms/
├── molecules/          # Combinations of atoms (effects)
│   ├── taskin-effect-tears/
│   ├── taskin-effect-hearts/
│   ├── taskin-effect-zzz/
│   ├── taskin-effect-thought-bubble/
│   ├── taskin-effect-vomit/
│   ├── taskin-effect-phone/
│   └── taskin-effect-fart-cloud/
└── organisms/          # Complete components
    └── taskin/         # Main Taskin mascot (composition)
```

## Atoms

### TaskinBody

- Renders the octopus body (main circle)
- Handles body color changes
- Provides animations: shiver, dance, angry shake

### TaskinEyes

- Renders eyes with pupils
- Handles blinking
- Controls look direction (left, right, center, up, down)
- Eye states: open, closed, half-closed

### TaskinMouth

- Renders mouth expressions
- States: neutral, smile, frown, open
- Animations: panting

### TaskinTentacles

- Renders all 6 tentacles
- Individual tentacle control
- Wiggle animations

### TaskinArms

- Renders both arms with hands
- Arm raising/lowering
- Sarcastic shrug animation

## Molecules (Effects)

### TaskinEffectTears

- Animated falling tears
- Used in 'crying' mood

### TaskinEffectHearts

- Floating hearts animation
- Used in 'in-love' mood

### TaskinEffectZzz

- Floating Z's for sleeping
- Used in 'sleeping' mood

### TaskinEffectThoughtBubble

- Thought bubble with customizable text
- Used in 'thoughtful' mood

### TaskinEffectVomit

- Vomit drops animation
- Used in 'vomiting' mood

### TaskinEffectPhone

- Phone/selfie effect
- Positioned relative to raised arm
- Used in 'taking-selfie' mood

### TaskinEffectFartCloud

- Fart cloud animation
- Used in 'farting' mood

## Organism

### Taskin (Main Component)

- Composes all atoms and molecules
- Manages mood states
- Coordinates animations between components
- Provides unified controller API
- Handles idle animations

## File Patterns

Each component follows this structure:

```
component-name/
├── index.ts                    # Exports
├── component-name.types.ts     # TypeScript types & interfaces
├── component-name.ts           # Vue component implementation
├── component-name.mock.ts      # Mock data for testing
└── component-name.stories.ts   # Storybook stories
```

## Benefits of This Structure

1. **Separation of Concerns**: Each component has a single responsibility
2. **Reusability**: Atoms and molecules can be used independently
3. **Testability**: Smaller components are easier to test
4. **Maintainability**: Changes are isolated to specific components
5. **Scalability**: Easy to add new effects or modify existing ones
6. **Type Safety**: Each component has its own typed interface

## Usage Example

```typescript
import { TaskinMascot } from '@opentask/taskin-design-vue';

// Use the main organism (recommended)
<TaskinMascot mood="happy" size={340} />

// Or compose your own using atoms (advanced)
import { TaskinBody, TaskinEyes, TaskinMouth } from '@opentask/taskin-design-vue/atoms';
```

## Next Steps

1. Implement Vue components for each atom
2. Implement Vue components for each molecule
3. Refactor organism to use atomic components
4. Create individual stories for each component
5. Add unit tests for each component
6. Update documentation
