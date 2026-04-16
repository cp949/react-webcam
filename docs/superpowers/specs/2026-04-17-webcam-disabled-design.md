# Webcam `disabled` Design

## Goal

Add a `disabled` prop to `Webcam` so consumers can mount the component without immediately triggering camera permission prompts. This is especially useful when multiple webcam components are present on one screen and the app wants to enable them only after a deliberate user action.

## User Problem

Today, mounting `Webcam` can request camera access as soon as the video element and computed constraints are ready. In product flows where the user has not explicitly chosen to start the camera yet, this can feel abrupt. The problem becomes more obvious when two `Webcam` components are mounted at the same time and only one should become active first.

## Approved Direction

- Add `disabled?: boolean` to `WebcamProps`.
- When `disabled` is `true`, the component must not call `getUserMedia`.
- When `disabled` is `true`, the component must render a disabled-state UI instead of live video.
- The default disabled-state UI should be language-neutral and suitable for commercial products.
- Consumers can fully override the default disabled UI with a dedicated prop.

## Public API

### `WebcamProps`

Add:

```ts
disabled?: boolean;
disabledFallback?: React.ReactNode;
```

Behavior:

- `disabled` defaults to `false`.
- `disabledFallback` is rendered only when `disabled === true`.
- If `disabledFallback` is not provided, `Webcam` renders the library default disabled placeholder.
- `children` keeps its current meaning as an overlay/content slot and is not repurposed as the disabled fallback API.

## Component Behavior

### Enabled mode

When `disabled !== true`, the component behaves exactly as it does today:

- computes constraints
- requests the stream
- binds the stream to the video element
- emits the usual lifecycle updates

### Disabled mode

When `disabled === true`:

- no media stream request should start
- any currently active stream should be cleaned up by the existing lifecycle cleanup path
- the published detail should settle to the existing `idle` phase rather than introducing a new public phase
- the live video surface should be visually replaced by a disabled placeholder

Using `idle` avoids expanding the public state model for a presentation concern while still keeping the observable behavior predictable for consumers.

## Disabled Placeholder UI

The default disabled UI should be neutral and text-free:

- no built-in copy, to avoid localization burden
- not a flat black rectangle
- visually calm enough to fit product UIs by default
- clear enough that the area reads as an inactive camera surface

Recommended visual treatment:

- soft dark neutral gradient or layered dark surface
- centered camera icon
- subtle framing treatment so it feels intentional rather than empty

Chosen default direction:

- use the `Soft Gradient` background direction
- use the standard camera icon rather than a quieter outline variant
- keep the composition text-free and centered

The placeholder should preserve the component box and continue to work with the current layout behavior, aspect-ratio handling, and overlays.

## Implementation Plan

### 1. Gate stream acquisition

Thread `disabled` into the controller/lifecycle path so the stream lifecycle hook only requests media when:

- a video element exists
- constraints exist
- `disabled !== true`

This keeps the request-prevention logic close to the current side-effect boundary.

### 2. Render disabled presentation

Update `Webcam.tsx` so disabled mode shows:

- `disabledFallback` when provided
- otherwise the built-in disabled placeholder

The disabled placeholder should live inside the main webcam surface so root styling and sizing continue to work.

### 3. Preserve current consumer mental model

- keep `children` rendering behavior unchanged
- do not add default text labels
- do not add a new `WebcamPhase`

## Testing

Add or update tests to cover:

- mounting with `disabled={true}` does not call `getUserMedia`
- toggling from `disabled={true}` to `false` starts the request
- toggling from `false` to `true` stops the active stream
- `disabledFallback` renders only in disabled mode
- default disabled placeholder renders when no override is provided
- existing enabled behavior remains unchanged

## Risks and Decisions

### Why not use `children` as the fallback API?

Because `children` already reads like general overlay content. Reusing it as a disabled-only replacement would blur the contract and make usage less obvious.

### Why not add text to the default disabled UI?

Because library-level copy creates localization, product-tone, and customization burdens. A text-free placeholder is safer and more reusable.

### Why not add a new public `disabled` phase?

Current requirements are about request suppression and presentation. Reusing `idle` keeps the public state surface smaller and avoids a broader compatibility conversation unless a real need appears later.
