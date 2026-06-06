# Implementation Plan: Todo List Life Dashboard

## Overview

Implement a zero-dependency, single-page productivity dashboard as three files (`index.html`, `css/style.css`, `js/app.js`). All four widgets — Greeting/Clock, Focus Timer, To-Do List, and Quick Links — are wired together in `app.js` with `localStorage` as the sole persistence layer. A separate `js/tests/` directory holds property-based and unit tests using fast-check loaded via `<script>` tag.

Implementation proceeds in layers: file scaffolding → storage layer → greeting widget → timer widget → todo widget → links widget → wiring & integration → tests & accessibility.

---

## Tasks

- [x] 1. Scaffold project structure and base HTML
  - [x] 1.1 Create `index.html` with the full page skeleton: `<head>` (meta charset, viewport, title, CSS link), four widget sections (`#greeting-widget`, `#timer-widget`, `#todo-widget`, `#links-widget`), all required element IDs (`#clock`, `#date`, `#greeting`, `#timer-display`, `#timer-start`, `#timer-stop`, `#timer-reset`, `#timer-alert`, `#todo-input`, `#todo-add-btn`, `#todo-error`, `#todo-list`, `#link-label-input`, `#link-url-input`, `#link-add-btn`, `#link-error`, `#link-bar`, `#storage-error`), and a `<script src="js/app.js">` tag at the bottom of `<body>`
    - Add `maxlength="50"` on `#link-label-input` and `maxlength="2048"` on `#link-url-input` as per design
    - Add `id`/`for` associations between all `<label>` elements and their inputs
    - _Requirements: 6.1, 6.3, 6.5, 4.1_
  - [x] 1.2 Create the empty `css/style.css` and `js/app.js` files; create `js/tests/` directory with a `test-runner.html` harness that loads the fast-check UMD bundle and imports the test files
    - The harness must load fast-check from a CDN or local `node_modules` path; no build step
    - _Requirements: 6.1, 6.3_

- [ ] 2. Implement CSS layout and design system
  - [x] 2.1 Define CSS custom properties (variables) for the colour palette, base font size, type scale, and spacing unit; apply a CSS reset; style the `body` and `.dashboard` grid/flex container so all four widgets are arranged in a responsive layout
    - Include `gap: 16px` (or border) between widget boundaries to meet the minimum separation requirement
    - Ensure no horizontal overflow between 320px–2560px using `min-width: 0`, `max-width: 100%`, `overflow-x: hidden`
    - Add a CSS media query so the layout collapses to a single column at viewport widths ≤ 600px; use `rem` units throughout `style.css` with `html { font-size: 16px }` as the base
    - _Requirements: 7.1, 7.2, 7.3_
  - [ ] 2.2 Style all interactive controls (buttons, inputs): apply shared font, spacing, and colour palette; add a minimum `2px solid` focus outline with ≥3:1 contrast against the adjacent background; ensure all non-decorative text meets ≥4.5:1 contrast against backgrounds
    - _Requirements: 7.2, 7.4, 7.5_
  - [ ] 2.3 Style each widget card (Greeting, Timer, Todo, Links): typography, borders/shadows, placeholder text visibility, `.completed` task style (strikethrough + reduced opacity), `.todo-item` layout, `.link-btn` layout, and `#timer-alert` / `#storage-error` banner styles
    - _Requirements: 3.5, 7.1, 7.2_

- [x] 3. Implement the Storage layer (`TaskStore` and `LinkStore`)
  - [x] 3.1 Implement `TASKS_KEY = 'tld_tasks'` and `LINKS_KEY = 'tld_links'` constants and the `TaskStore` object with `tasks: []`, `load()`, `save()`, `add(task)`, `update(id, patch)`, `remove(id)`, and `getAll()` methods
    - `load()` must wrap `JSON.parse` in `try/catch`; on `null` result or parse failure log a `console.warn` and fall back to `[]`
    - `save()` must wrap `localStorage.setItem` in `try/catch`; on `QuotaExceededError` or any storage exception show `#storage-error` without rolling back the in-memory `tasks` array
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.6, 5.8_
  - [x] 3.2 Implement `LinkStore` object with `links: []`, `load()`, `save()`, `add(link)`, `remove(id)`, and `getAll()` methods following the same error-handling pattern as `TaskStore`
    - _Requirements: 5.1, 5.3, 5.4, 5.5, 5.7, 5.8_
  - [ ]* 3.3 Write property tests for the Storage layer
    - **Property 17: Task serialisation round-trip preserves data** — generate arbitrary `Task[]` arrays, call `TaskStore.save()` then a fresh `TaskStore.load()`, assert equal length and field equality (`id`, `text`, `completed`) for each item
    - **Validates: Requirements 5.6, 5.2**
    - **Property 18: Quick_Link serialisation round-trip preserves data** — same pattern for `LinkStore`, asserting `id`, `label`, and `url` equality
    - **Validates: Requirements 5.7, 5.3**
    - **Property 19: Invalid or missing localStorage data is handled gracefully** — inject `null`, empty string, and non-array JSON into the storage key, call `load()`, assert result is `[]` and no exception is thrown
    - **Validates: Requirements 5.8**

- [ ] 4. Implement the Greeting Widget
  - [ ] 4.1 Implement the pure helper functions `getGreeting(hour)`, `formatTime(date)`, and `formatDate(date)` in `app.js`
    - `formatTime` → `"HH:MM:SS"` using zero-padded local time components
    - `formatDate` → `"Weekday, D Month YYYY"` using locale-independent string construction
    - `getGreeting` → `"Good Morning"` (0–11), `"Good Afternoon"` (12–17), `"Good Evening"` (18–20), `"Good Night"` (21–23)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  - [ ] 4.2 Implement `tick()` to read the current `Date`, update `#clock`, `#date`, and `#greeting`; implement `initGreeting()` to call `tick()` immediately and start `setInterval(tick, 1000)`; wire `visibilitychange` and `pageshow` events to call `tick()` immediately for re-sync
    - _Requirements: 1.7, 1.8, 1.9_
  - [ ]* 4.3 Write property tests for the Greeting Widget pure functions
    - **Property 1: Time formatting is always valid HH:MM:SS** — generate arbitrary `Date` objects via integer timestamps, call `formatTime(date)`, assert the result matches `/^\d{2}:\d{2}:\d{2}$/` and HH ∈ [00–23], MM ∈ [00–59], SS ∈ [00–59]
    - **Validates: Requirements 1.1**
    - **Property 2: Date formatting contains all required components** — generate arbitrary `Date` objects, call `formatDate(date)`, assert the string contains a valid weekday name, a day number 1–31, a valid month name, and a 4-digit year
    - **Validates: Requirements 1.2**
    - **Property 3: Greeting mapping covers all hours** — generate integers in [0, 23], assert `getGreeting(hour)` returns the exact expected string per boundary rules with no hour left unmatched
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**

- [ ] 5. Implement the Timer Widget
  - [ ] 5.1 Implement the `Timer` object with `remaining: 1500`, `intervalId: null`, `state: 'idle'` fields and `init()`, `start()`, `stop()`, `reset()`, `tick()`, and `render()` methods
    - `render()` must update `#timer-display` in MM:SS format, set `disabled` attributes on Start/Stop/Reset buttons per the state table (Start disabled when `running`/`done`; Stop disabled when `idle`/`paused`/`done`; Reset always enabled), and show `#timer-alert` when state is `done`, hide it otherwise
    - `tick()` must guard against `remaining <= 0` (race condition protection); when `remaining` reaches 0 set state to `done`, clear the interval, and call `render()` to show the alert
    - `start()` transitions `idle`/`paused` → `running`; `stop()` transitions `running` → `paused`; `reset()` transitions any state → `idle` with `remaining = 1500` and clears any active interval — `render()` must hide `#timer-alert` in the `idle` state
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_
  - [ ]* 5.2 Write property tests for the Timer Widget
    - **Property 4: Timer display always valid MM:SS** — generate integers in [0, 1500], assert the display formatter returns a string matching `/^\d{2}:\d{2}$/` and the total seconds value equals the input
    - **Validates: Requirements 2.5**
    - **Property 5: Each timer tick decrements remaining by exactly one** — for arbitrary `remaining` > 0 with state `running`, call `tick()`, assert `remaining` decreased by exactly 1 when `remaining` was > 1, or state is `done` and interval is cleared when `remaining` was exactly 1
    - **Validates: Requirements 2.2, 2.6**
    - **Property 6: Reset always returns timer to initial state** — for arbitrary state and remaining values, call `reset()`, assert `remaining === 1500`, `state === 'idle'`, and `intervalId === null`
    - **Validates: Requirements 2.4**
    - **Property 7: Timer button states are fully determined by timer state** — for each of the four states (`idle`, `running`, `paused`, `done`), call `render()` and assert `#timer-start.disabled` and `#timer-stop.disabled` match the specification table exactly
    - **Validates: Requirements 2.8, 2.9, 2.10**

- [ ] 6. Implement the Todo Widget
  - [ ] 6.1 Implement `TodoWidget` with `init()`, `addTask(text)`, `deleteTask(id)`, `toggleTask(id)`, `startEdit(id)`, `confirmEdit(id, newText)`, `renderList()`, `showError(msg)`, and `clearError()` methods
    - `addTask` must trim input, reject empty/whitespace-only text (show `#todo-error`), call `TaskStore.add`, call `renderList`, and show a brief visual confirmation flash on success; clear `#todo-error` on next successful submission
    - `renderList` must rebuild `#todo-list` from `TaskStore.getAll()`, add the `.completed` CSS class to completed items, and display the "No tasks yet. Add one above!" placeholder when the list is empty
    - `startEdit` replaces the task's text `<span>` with an inline `<input>` pre-populated with current text; if a re-render occurs while an edit is open the edit is cancelled and the stored text is shown
    - `confirmEdit` must trim `newText`; if empty/whitespace-only discard the edit and restore original text without writing to storage
    - Use `crypto.randomUUID()` for task IDs with a `Date.now().toString()` fallback for Safari < 15.4
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11_
  - [ ]* 6.2 Write property tests for the Todo Widget
    - **Property 8: Adding a valid task grows the task list and persists to storage** — generate non-empty, non-whitespace strings, call `addTask(text)`, assert list length increased by 1, new task has correct text, and `localStorage[TASKS_KEY]` contains the new task
    - **Validates: Requirements 3.2, 5.2**
    - **Property 9: Whitespace-only task submissions are rejected** — generate strings of only whitespace characters, call `addTask(text)`, assert list unchanged, no localStorage write occurred, and `#todo-error` is visible
    - **Validates: Requirements 3.3**
    - **Property 10: Toggling completion twice returns task to original state** — for arbitrary task initial state, call `toggleTask(id)` twice, assert `completed` equals original value and localStorage is updated after each toggle
    - **Validates: Requirements 3.4**
    - **Property 11: Confirming a valid edit updates and persists task text** — generate non-empty, non-whitespace strings as `newText`, call `confirmEdit(id, newText)`, assert task's `text` equals `newText.trim()` and localStorage is updated
    - **Validates: Requirements 3.7**
    - **Property 12: Confirming an edit with whitespace-only text discards the change** — generate whitespace-only strings, call `confirmEdit(id, input)`, assert task's `text` is unchanged and no localStorage write occurred
    - **Validates: Requirements 3.8**
    - **Property 13: Deleting a task removes it from store and localStorage** — for a non-empty task list, call `deleteTask(id)`, assert the task no longer appears in `TaskStore.tasks` and `localStorage[TASKS_KEY]` does not contain that id
    - **Validates: Requirements 3.9**

- [ ] 7. Checkpoint — Ensure all tests pass up to this point
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement the Links Widget
  - [ ] 8.1 Implement `LinksWidget` with `MAX_LINKS: 20`, `init()`, `addLink(label, url)`, `deleteLink(id)`, `normaliseUrl(url)`, `validateUrl(url)`, `renderBar()`, `showError(msg)`, and `clearError()` methods
    - `addLink` must trim both inputs; enforce the 50-char label and 2048-char URL maxlengths in validation (in addition to DOM `maxlength` attributes); reject empty label or empty URL; call `normaliseUrl` before saving; reject if `LinkStore.links.length >= 20` with a capacity error message; call `renderBar` on success; clear `#link-error` on next successful submission
    - `normaliseUrl` must prepend `"https://"` if the URL does not already begin with `"http://"` or `"https://"`
    - `validateUrl` must check the URL contains at least one dot with at least one character after it
    - `renderBar` must rebuild `#link-bar` from `LinkStore.getAll()`; each button calls `window.open(url, '_blank')` on click; display "No links saved yet." placeholder when empty
    - Use `crypto.randomUUID()` for link IDs with the same `Date.now()` fallback
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_
  - [ ]* 8.2 Write property tests for the Links Widget
    - **Property 14: URL normalisation always produces an absolute URL** — generate arbitrary strings that do not start with `http://` or `https://`, assert `normaliseUrl` prepends `"https://"`; for strings already starting with either prefix, assert they are returned unchanged
    - **Validates: Requirements 4.4**
    - **Property 15: Deleting a Quick_Link removes it from store and localStorage** — for a non-empty link list, call `deleteLink(id)`, assert the link no longer appears in `LinkStore.links` and `localStorage[LINKS_KEY]` does not contain that id
    - **Validates: Requirements 4.6**
    - **Property 16: No uniqueness constraint on Quick_Link labels or URLs** — generate two links with identical labels or identical URLs, call `addLink` for both (with total ≤ 20), assert both appear in `LinkStore.links`
    - **Validates: Requirements 4.10**

- [ ] 9. Bootstrap and integration wiring
  - [~] 9.1 Write the `DOMContentLoaded` bootstrap block in `app.js` wrapped in a single IIFE that calls `TaskStore.load()`, `LinkStore.load()`, `initGreeting()`, `Timer.init()`, `TodoWidget.init()`, and `LinksWidget.init()` in order
    - Confirm all event handlers are attached exactly once; verify no global scope pollution
    - Keep all initialisation synchronous and lightweight so all four widgets reach a rendered, interactive state within 2 seconds on a device with ≥4 GB RAM and ≥2 CPU cores with no network throttling (no deferred loading, no heavy computation on startup)
    - _Requirements: 1.8, 2.1, 3.10, 4.7, 6.3, 6.4_
  - [ ]* 9.2 Write unit tests for integration and edge cases
    - Test that `#timer-alert` is visible when `Timer.remaining` reaches 0
    - Test that `#storage-error` is shown and in-memory state is unchanged when `localStorage.setItem` throws `QuotaExceededError`
    - Test that `window.open` is called with the correct URL and `'_blank'` when a Quick_Link button is clicked
    - Test that the 21st link is rejected with an inline error message
    - Test that `#todo-list` renders the empty-state placeholder when `TaskStore.tasks` is empty
    - Test that `#link-bar` renders the empty-state placeholder when `LinkStore.links` is empty
    - Test that a brief visual confirmation flash appears after successfully adding a task
    - _Requirements: 2.7, 3.2, 4.5, 4.8, 4.9, 5.4_

- [ ] 10. Accessibility and ARIA attributes
  - [~] 10.1 Add ARIA attributes to all interactive controls that need them: `aria-label` on icon-only buttons (delete, edit); `role="alert"` and `aria-live="polite"` on `#todo-error`, `#link-error`, `#timer-alert`, and `#storage-error` banners
    - Verify all `<label>` / `<input>` `id`/`for` pairs are correct (set in task 1.1)
    - _Requirements: 7.4_
  - [~] 10.2 Verify and fix keyboard accessibility: ensure Tab order reaches every interactive control; ensure Enter/Space activate all buttons; verify the focus outline (2px solid, ≥3:1 contrast) is visible on all focusable elements across Chrome, Firefox, Edge, and Safari; verify the app functions correctly when opened via the `file://` protocol
    - _Requirements: 6.2, 6.5, 7.3, 7.4_

- [~] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; all unmarked tasks must be completed in order
- Each property-based test requires a minimum of **100 iterations** (`{ numRuns: 100 }`) as specified in the design
- fast-check is loaded as a UMD bundle via `<script>` tag — no bundler required; tests run in Node.js (`node js/tests/run.js`) or in the `test-runner.html` browser harness
- `crypto.randomUUID()` is used for ID generation with a `Date.now().toString()` fallback for Safari < 15.4 (inline ternary in `app.js`)
- All sections of `app.js` are delimited with block comments as shown in the design; the entire file is wrapped in a single `DOMContentLoaded` IIFE to avoid global scope pollution
- Property tests are tagged with a comment referencing the design property number (e.g., `// Property 3: Greeting mapping covers all hours`) for traceability
- The `file://` protocol compatibility means no `import`/`export` module syntax — `app.js` is a plain script; tests may use CommonJS `require` when run in Node.js

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "3.1", "3.2"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.3", "4.1"] },
    { "id": 3, "tasks": ["4.2", "5.1"] },
    { "id": 4, "tasks": ["4.3", "5.2", "6.1"] },
    { "id": 5, "tasks": ["6.2", "8.1"] },
    { "id": 6, "tasks": ["8.2", "9.1"] },
    { "id": 7, "tasks": ["9.2", "10.1", "10.2"] }
  ]
}
```
