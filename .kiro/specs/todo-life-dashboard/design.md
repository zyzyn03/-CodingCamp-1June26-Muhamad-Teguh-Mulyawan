# Design Document: Todo List Life Dashboard

## Overview

The Todo List Life Dashboard is a zero-dependency, single-page productivity application delivered as three files: one HTML entry point, one CSS stylesheet, and one Vanilla JavaScript module. It exposes four widgets — Greeting/Clock, Focus Timer, To-Do List, and Quick Links — that work entirely in the browser with no network requests after initial load.

### Key Design Constraints

- **No build step, no dependencies**: pure HTML5, CSS3, and ES2020+ Vanilla JavaScript.
- **file:// protocol compatible**: no module bundler, no dynamic `import()` of remote resources.
- **Browser extension ready**: the same three files can be copied into an extension's directory and referenced from `manifest.json`.
- **Single source of truth for persistence**: the browser `localStorage` API, using two fixed keys.
- **Universal browser support**: Chrome, Firefox, Edge, and Safari (latest stable) — no polyfills required.

---

## Architecture

The application follows a **widget-based MVC** pattern:

- **Model** — plain JavaScript objects (`TaskStore`, `LinkStore`) that read/write `localStorage`.
- **View** — DOM manipulation functions inside each widget module that re-render from model state.
- **Controller** — event handlers attached once on `DOMContentLoaded` that call model mutations and then trigger view re-renders.

Because there is no framework, re-renders are *targeted*: only the DOM node relevant to the changed data is updated, avoiding full-page repaints.

### File Structure

```
index.html          ← single entry point; all widget markup lives here
css/
  style.css         ← all styles (variables, reset, layout, widget themes)
js/
  app.js            ← all JavaScript (stores, widgets, event wiring)
```

### Module Organisation inside `app.js`

`app.js` is organised into clearly delimited sections using block comments:

```
// ─── CONSTANTS ───────────────────────────────────────────
// ─── STORAGE (TaskStore / LinkStore) ─────────────────────
// ─── GREETING WIDGET ─────────────────────────────────────
// ─── TIMER WIDGET ────────────────────────────────────────
// ─── TODO WIDGET ─────────────────────────────────────────
// ─── LINKS WIDGET ────────────────────────────────────────
// ─── BOOTSTRAP ───────────────────────────────────────────
```

All sections are contained in a single IIFE or `DOMContentLoaded` handler to avoid polluting the global scope.

### High-Level Flow

```mermaid
flowchart TD
    A[Browser loads index.html] --> B[CSS parsed, layout rendered]
    B --> C[app.js executes on DOMContentLoaded]
    C --> D[TaskStore.load()]
    C --> E[LinkStore.load()]
    C --> F[Greeting.init() — starts 1s interval]
    C --> G[Timer.init() — attaches Start/Stop/Reset handlers]
    C --> H[TodoWidget.init() — renders persisted tasks]
    C --> I[LinksWidget.init() — renders persisted links]
    D --> H
    E --> I
```

---

## Components and Interfaces

### 1. Greeting Widget

**Responsibilities**: display live clock (HH:MM:SS), full date, and a time-of-day greeting.

**DOM elements** (defined in `index.html`):
| ID | Content |
|---|---|
| `#clock` | current time string |
| `#date` | current date string |
| `#greeting` | greeting phrase |

**JavaScript interface** (`app.js`):
```js
// Greeting module
function initGreeting() { ... }         // starts setInterval(tick, 1000)
function tick() { ... }                 // updates #clock, #date, #greeting
function getGreeting(hour) { ... }      // pure function: number → string
function formatTime(date) { ... }       // pure function: Date → "HH:MM:SS"
function formatDate(date) { ... }       // pure function: Date → "Weekday, D Month YYYY"
```

`getGreeting(hour)` mapping:
| Hour range | Greeting |
|---|---|
| 0–11 | "Good Morning" |
| 12–17 | "Good Afternoon" |
| 18–20 | "Good Evening" |
| 21–23 | "Good Night" |

The interval is started with `setInterval(tick, 1000)`. On `visibilitychange` events and `pageshow` events the widget calls `tick()` immediately to re-sync within 1 second.

---

### 2. Timer Widget

**Responsibilities**: 25-minute countdown, Start / Stop / Reset controls, session-end alert.

**DOM elements**:
| ID | Content |
|---|---|
| `#timer-display` | remaining time string "MM:SS" |
| `#timer-start` | Start button |
| `#timer-stop` | Stop button |
| `#timer-reset` | Reset button |
| `#timer-alert` | hidden session-end alert banner |

**JavaScript interface**:
```js
// Timer module
const Timer = {
  remaining: 1500,       // seconds
  intervalId: null,
  state: 'idle',         // 'idle' | 'running' | 'paused' | 'done'

  init()   { ... },      // attach handlers, render initial state
  start()  { ... },      // state: idle/paused → running
  stop()   { ... },      // state: running → paused
  reset()  { ... },      // state: any → idle, remaining = 1500
  tick()   { ... },      // decrement remaining, check 0
  render() { ... },      // update DOM from state
};
```

**Button enable/disable rules** (derived from requirements 2.8–2.10):

| Timer state | Start | Stop | Reset |
|---|---|---|---|
| `idle` | ✅ enabled | ❌ disabled | ✅ enabled |
| `running` | ❌ disabled | ✅ enabled | ✅ enabled |
| `paused` | ✅ enabled | ❌ disabled | ✅ enabled |
| `done` | ❌ disabled | ❌ disabled | ✅ enabled |

---

### 3. Todo Widget

**Responsibilities**: add / edit / complete / delete tasks; persist to `localStorage`; render list from store.

**DOM elements**:
| ID/Class | Content |
|---|---|
| `#todo-input` | new task text field |
| `#todo-add-btn` | Add button |
| `#todo-error` | inline validation message |
| `#todo-list` | `<ul>` containing task items |
| `.todo-item` | individual `<li>` per task |

**JavaScript interface**:
```js
const TodoWidget = {
  init()                       { ... }, // load tasks, render, attach handlers
  addTask(text)                { ... }, // validate → store → render → confirm flash
  deleteTask(id)               { ... }, // store → render
  toggleTask(id)               { ... }, // store → render
  startEdit(id)                { ... }, // replace text span with input
  confirmEdit(id, newText)     { ... }, // validate → store → render
  renderList()                 { ... }, // rebuild #todo-list from TaskStore
  showError(msg)               { ... }, // show #todo-error
  clearError()                 { ... }, // hide #todo-error
};
```

---

### 4. Links Widget

**Responsibilities**: add / delete quick-links; persist to `localStorage`; render link bar from store; enforce 20-link cap.

**DOM elements**:
| ID | Content |
|---|---|
| `#link-label-input` | display label text field (max 50 chars) |
| `#link-url-input` | URL text field (max 2048 chars) |
| `#link-add-btn` | Add button |
| `#link-error` | inline validation message |
| `#link-bar` | container for Quick_Link buttons |

**JavaScript interface**:
```js
const LinksWidget = {
  MAX_LINKS: 20,

  init()                       { ... }, // load links, render, attach handlers
  addLink(label, url)          { ... }, // validate → normalise URL → store → render
  deleteLink(id)               { ... }, // store → render
  normaliseUrl(url)            { ... }, // prepend https:// if needed
  validateUrl(url)             { ... }, // checks for at least one dot + char after dot
  renderBar()                  { ... }, // rebuild #link-bar from LinkStore
  showError(msg)               { ... },
  clearError()                 { ... },
};
```

---

### 5. Storage Layer

**Responsibilities**: serialise/deserialise data; handle `localStorage` errors gracefully.

```js
const TASKS_KEY  = 'tld_tasks';
const LINKS_KEY  = 'tld_links';

const TaskStore = {
  tasks: [],                    // in-memory array of Task objects
  load()  { ... },              // localStorage.getItem → JSON.parse → fallback []
  save()  { ... },              // JSON.stringify → localStorage.setItem; catch quota errors
  add(task)     { ... },
  update(id, patch) { ... },
  remove(id)    { ... },
  getAll()      { return [...this.tasks]; },
};

const LinkStore = {
  links: [],                    // in-memory array of QuickLink objects
  load()  { ... },
  save()  { ... },
  add(link)     { ... },
  remove(id)    { ... },
  getAll()      { return [...this.links]; },
};
```

Both `load()` methods wrap `JSON.parse` in a `try/catch`. On parse failure or `null` result they initialise with `[]` and log a warning to the console. Both `save()` methods wrap `localStorage.setItem` in a `try/catch`; on failure they surface a visible error banner (`#storage-error`) and leave the in-memory state unchanged.

---

## Data Models

### Task

```js
/**
 * @typedef {Object} Task
 * @property {string}  id        - Unique identifier (crypto.randomUUID() or Date.now().toString())
 * @property {string}  text      - Task description (trimmed, non-empty)
 * @property {boolean} completed - Completion status; false on creation
 */
```

Example stored JSON (under key `tld_tasks`):
```json
[
  { "id": "1717891200000", "text": "Review pull request", "completed": false },
  { "id": "1717891260000", "text": "Update README",       "completed": true  }
]
```

### QuickLink

```js
/**
 * @typedef {Object} QuickLink
 * @property {string} id    - Unique identifier
 * @property {string} label - Display label (1–50 chars)
 * @property {string} url   - Fully-qualified URL (starts with http:// or https://)
 */
```

Example stored JSON (under key `tld_links`):
```json
[
  { "id": "1717891300000", "label": "GitHub",  "url": "https://github.com" },
  { "id": "1717891360000", "label": "MDN",     "url": "https://developer.mozilla.org" }
]
```

### localStorage Keys Summary

| Key | Widget | Schema |
|---|---|---|
| `tld_tasks` | Todo_Manager | `Task[]` JSON array |
| `tld_links` | Link_Manager | `QuickLink[]` JSON array |


---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

---

### Property 1: Time formatting is always valid HH:MM:SS

*For any* `Date` object, `formatTime(date)` SHALL return a string matching the pattern `HH:MM:SS` where HH ∈ [00–23], MM ∈ [00–59], SS ∈ [00–59].

**Validates: Requirements 1.1**

---

### Property 2: Date formatting contains all required components

*For any* `Date` object, `formatDate(date)` SHALL return a string containing a valid full weekday name, a numeric day of month (1–31), a valid full month name, and a 4-digit year.

**Validates: Requirements 1.2**

---

### Property 3: Greeting mapping covers all hours

*For any* integer hour in [0, 23], `getGreeting(hour)` SHALL return exactly one of "Good Morning", "Good Afternoon", "Good Evening", or "Good Night" according to the specified boundary rules (0–11 → Morning, 12–17 → Afternoon, 18–20 → Evening, 21–23 → Night).

**Validates: Requirements 1.3, 1.4, 1.5, 1.6**

---

### Property 4: Timer display always valid MM:SS

*For any* non-negative integer `seconds` in [0, 1500], the timer display function SHALL return a string matching the pattern `MM:SS` where MM ∈ [00–24] and SS ∈ [00–59], and the total represented time equals `seconds`.

**Validates: Requirements 2.5**

---

### Property 5: Each timer tick decrements remaining by exactly one

*For any* timer with `remaining` > 0 and state `running`, calling `tick()` SHALL reduce `remaining` by exactly 1 and leave state as `running` (unless `remaining` reaches 0, in which case state becomes `done`).

**Validates: Requirements 2.2, 2.6**

---

### Property 6: Reset always returns timer to initial state

*For any* timer state (`idle`, `running`, `paused`, or `done`) and *any* value of `remaining`, calling `reset()` SHALL set `remaining` to 1500 and state to `idle`, and clear any active interval.

**Validates: Requirements 2.4**

---

### Property 7: Timer button states are fully determined by timer state

*For any* timer state in {`idle`, `running`, `paused`, `done`}, calling `render()` SHALL set the Start button's `disabled` attribute and the Stop button's `disabled` attribute exactly as specified in the button-enable table (Start disabled when `running` or `done`; Stop disabled when `idle`, `paused`, or `done`).

**Validates: Requirements 2.8, 2.9, 2.10**

---

### Property 8: Adding a valid task grows the task list and persists to storage

*For any* non-empty, non-whitespace-only string `text`, calling `addTask(text)` SHALL increase the task list length by exactly 1, the new task SHALL have the given text, and `localStorage[TASKS_KEY]` SHALL be updated to contain the new task.

**Validates: Requirements 3.2, 5.2**

---

### Property 9: Whitespace-only task submissions are rejected

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines), calling `addTask(text)` SHALL leave the task list unchanged, not write to `localStorage`, and produce a visible validation error.

**Validates: Requirements 3.3**

---

### Property 10: Toggling completion twice returns task to original state

*For any* task with *any* completion state, calling `toggleTask(id)` twice SHALL result in the task's `completed` field being equal to its value before the first toggle (round-trip invariant). Each toggle SHALL also persist the updated state to `localStorage`.

**Validates: Requirements 3.4**

---

### Property 11: Confirming a valid edit updates and persists task text

*For any* task and *any* non-empty, non-whitespace-only string `newText`, calling `confirmEdit(id, newText)` SHALL update the task's `text` to the trimmed `newText` and persist the change to `localStorage`.

**Validates: Requirements 3.7**

---

### Property 12: Confirming an edit with whitespace-only text discards the change

*For any* task with existing text `T` and *any* whitespace-only string `input`, calling `confirmEdit(id, input)` SHALL leave the task's `text` equal to `T` and not write to `localStorage`.

**Validates: Requirements 3.8**

---

### Property 13: Deleting a task removes it from store and localStorage

*For any* non-empty task list, after calling `deleteTask(id)` for a task that exists, the task SHALL no longer appear in `TaskStore.tasks` and `localStorage[TASKS_KEY]` SHALL not contain that task id.

**Validates: Requirements 3.9**

---

### Property 14: URL normalisation always produces an absolute URL

*For any* string `url` that does not begin with `http://` or `https://`, `normaliseUrl(url)` SHALL return a string beginning with `https://` followed by the original `url`. For any `url` already beginning with `http://` or `https://`, the function SHALL return it unchanged.

**Validates: Requirements 4.4**

---

### Property 15: Deleting a Quick_Link removes it from store and localStorage

*For any* non-empty link list, after calling `deleteLink(id)` for a link that exists, the link SHALL no longer appear in `LinkStore.links` and `localStorage[LINKS_KEY]` SHALL not contain that link id.

**Validates: Requirements 4.6**

---

### Property 16: No uniqueness constraint on Quick_Link labels or URLs

*For any* pair of Quick_Links with identical `label` values or identical `url` values, both SHALL be accepted by `addLink()` (subject only to the 20-link cap) and both SHALL appear in `LinkStore.links`.

**Validates: Requirements 4.10**

---

### Property 17: Task serialisation round-trip preserves data

*For any* array of `Task` objects, calling `TaskStore.save()` followed by a fresh `TaskStore.load()` SHALL produce an array equal to the original (same length, same `id`, `text`, and `completed` values for each task).

**Validates: Requirements 5.6, 5.2**

---

### Property 18: Quick_Link serialisation round-trip preserves data

*For any* array of `QuickLink` objects, calling `LinkStore.save()` followed by a fresh `LinkStore.load()` SHALL produce an array equal to the original (same length, same `id`, `label`, and `url` values for each link).

**Validates: Requirements 5.7, 5.3**

---

### Property 19: Invalid or missing localStorage data is handled gracefully

*For any* value stored in `localStorage[TASKS_KEY]` or `localStorage[LINKS_KEY]` that is `null`, an empty string, or not parseable as a valid JSON array, calling the respective `load()` function SHALL return an empty array `[]` and SHALL NOT throw an unhandled exception.

**Validates: Requirements 5.8**

---

## Error Handling

### Storage Errors

- `TaskStore.save()` and `LinkStore.save()` wrap `localStorage.setItem` in `try/catch`.
- On `QuotaExceededError` or any other storage exception, a dismissible error banner (`#storage-error`) is shown.
- The in-memory state (`tasks` / `links` array) is NOT rolled back — the user can see and copy their data.
- The error message is clear and non-technical: e.g., *"Could not save your data. Browser storage may be full."*

### Parse Errors

- `load()` wraps `JSON.parse` in `try/catch`. On any exception, it logs a `console.warn` with the stored key and raw value, then returns `[]`.
- This prevents an unhandled rejection from crashing the whole app on first load.

### Validation Errors

- Task text: trimmed before validation; empty or whitespace-only → show `#todo-error`, do not call store.
- Link label: trimmed; empty → show `#link-error`.
- Link URL: trimmed; must contain at least one dot with at least one character after the dot → show `#link-error`.
- Link cap: if `LinkStore.links.length >= 20` → show `#link-error` with capacity message.
- All validation errors are cleared on the next successful submission.

### Timer Edge Cases

- `tick()` guards: if `Timer.remaining <= 0` when tick fires (race condition), clear interval and set state to `done` without decrementing below 0.
- Multiple Start clicks: Start button is disabled when `state === 'running'` or `state === 'done'`, so duplicate interval creation is prevented at the UI layer.

### Edit Conflicts

- If a user opens an edit and then the DOM is re-rendered (e.g., due to another action), the edit is cancelled and the task's current stored text is shown. This prevents stale edit state.

---

## Testing Strategy

### Overview

The dual testing approach uses:

1. **Unit / example-based tests** — for specific scenarios, edge cases, and UI state transitions.
2. **Property-based tests** — for universal properties that must hold across a wide range of inputs.

Both are implemented in plain JavaScript using a property-based testing library compatible with the no-build constraint.

### Property-Based Testing Library

**[fast-check](https://github.com/dubzzz/fast-check)** is the selected library. It:
- Ships as a single UMD bundle loadable via `<script>` tag (no bundler required).
- Works in both browser and Node.js environments.
- Provides a rich set of arbitraries (generators) for strings, integers, arrays, objects.
- Runs a configurable number of iterations (default 100, set to minimum 100 for all tests here).

Test files are kept in `js/tests/` and run with Node.js for CI, or loaded in a test HTML harness for browser verification.

### Property Test Configuration

Each property-based test is tagged with a comment referencing the design property:

```js
// Feature: todo-life-dashboard, Property 3: Greeting mapping covers all hours
fc.assert(
  fc.property(fc.integer({ min: 0, max: 23 }), (hour) => {
    const result = getGreeting(hour);
    if (hour <= 11) return result === 'Good Morning';
    if (hour <= 17) return result === 'Good Afternoon';
    if (hour <= 20) return result === 'Good Evening';
    return result === 'Good Night';
  }),
  { numRuns: 100 }
);
```

Minimum **100 iterations** per property test.

### Unit Test Coverage

| Area | What to test | Type |
|---|---|---|
| Greeting init | Correct greeting shown on load | Example |
| Timer init | Starts at 25:00 | Example |
| Timer stop | State becomes paused, remaining unchanged | Example |
| Timer done alert | Alert visible when remaining hits 0 | Example |
| Todo: completed styling | Completed item has `.completed` CSS class | Example |
| Todo: edit → inline input | startEdit replaces span with input | Example |
| Todo: empty list placeholder | Placeholder visible when tasks=[] | Example |
| Links: open new tab | window.open called with correct args | Example |
| Links: empty placeholder | Placeholder visible when links=[] | Example |
| Links: cap at 20 | 21st link rejected with error | Edge case |
| Storage: quota error | Error banner shown, memory unchanged | Example |

### Cross-Browser Compatibility

- No polyfills are used; only ES2020+ APIs available in all target browsers are used: `Array.prototype.find`, `crypto.randomUUID` (with `Date.now().toString()` fallback for Safari < 15.4), `localStorage`, `JSON`, `setInterval`, `document.querySelector`.
- Manual smoke testing in Chrome, Firefox, Edge, and Safari (latest stable) using both `file://` protocol and a local HTTP server.

### Accessibility Verification

- Run [axe-core](https://github.com/dequelabs/axe-core) in the browser console against the rendered page.
- Manually verify keyboard navigation (Tab, Enter, Space) reaches all interactive controls.
- Note: Full WCAG 2.1 AA compliance requires human-led testing with screen readers.
