# Requirements Document

## Introduction

The **Todo List Life Dashboard** is a standalone client-side web application that serves as a personal productivity hub. It combines four core widgets — a contextual greeting with live clock, a Pomodoro-style focus timer, a persistent to-do list, and a personal quick-links bar — all within a single HTML page. All data is persisted using the browser's Local Storage API with no backend required. The app must work across modern browsers (Chrome, Firefox, Edge, Safari) as both a standalone web page and a browser extension.

## Glossary

- **Dashboard**: The single-page web application that hosts all four productivity widgets.
- **Greeting_Widget**: The UI component that displays the current time, date, and a time-based greeting message.
- **Timer**: The focus countdown timer component implementing a 25-minute session.
- **Todo_Manager**: The UI component responsible for managing the user's task list.
- **Task**: A single to-do item with a text description and a completion status.
- **Link_Manager**: The UI component responsible for managing the user's custom quick-link buttons.
- **Quick_Link**: A saved URL paired with a display label that opens in a new browser tab.
- **Local_Storage**: The browser's `localStorage` API used for all client-side data persistence.
- **Session**: A single 25-minute countdown cycle initiated by the user.

---

## Requirements

### Requirement 1: Live Greeting and Clock

**User Story:** As a user, I want to see the current time, date, and a greeting that reflects the time of day, so that the Dashboard feels personally relevant every time I open it.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current local time in HH:MM:SS format, updating every second.
2. THE Greeting_Widget SHALL display the current local date showing the full weekday name, day number, full month name, and 4-digit year (e.g., Monday, 2 June 2025).
3. IF the local time is between 00:00:00 and 11:59:59, THEN THE Greeting_Widget SHALL display the greeting "Good Morning".
4. IF the local time is between 12:00:00 and 17:59:59, THEN THE Greeting_Widget SHALL display the greeting "Good Afternoon".
5. IF the local time is between 18:00:00 and 20:59:59, THEN THE Greeting_Widget SHALL display the greeting "Good Evening".
6. IF the local time is between 21:00:00 and 23:59:59, THEN THE Greeting_Widget SHALL display the greeting "Good Night".
7. WHEN the local time crosses a boundary between greeting periods, THE Greeting_Widget SHALL update the greeting message within 1 second of crossing that boundary.
8. WHEN the Dashboard first loads, THE Greeting_Widget SHALL determine and display the correct greeting based on the current local time at the moment of render.
9. WHEN the browser tab becomes visible after being hidden or the device resumes from sleep, THE Greeting_Widget SHALL re-check the current time within 5 seconds and update the displayed time and greeting within 1 second of that check.

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with Start, Stop, and Reset controls, so that I can time focused work sessions without leaving the Dashboard.

#### Acceptance Criteria

1. THE Timer SHALL initialize with a countdown value of 25 minutes (25:00) on page load.
2. WHEN the user activates the Start control, THE Timer SHALL begin counting down in one-second intervals.
3. WHEN the Timer is counting down and the user activates the Stop control, THE Timer SHALL pause the countdown and retain the current remaining time.
4. WHEN the user activates the Reset control, THE Timer SHALL stop any active countdown and restore the countdown value to 25:00.
5. THE Timer SHALL display the remaining time in MM:SS format at all times.
6. WHEN the countdown reaches 00:00, THE Timer SHALL stop automatically.
7. WHEN the countdown reaches 00:00, THE Dashboard SHALL display a visible in-page alert indicating the Session has ended.
8. WHILE the Timer is counting down OR the countdown is at 00:00, THE Timer SHALL disable the Start control to prevent duplicate or post-expiry sessions.
9. WHILE the Timer is paused or stopped, THE Timer SHALL disable the Stop control.
10. WHILE the Timer is counting down, THE Timer SHALL keep the Stop control enabled.

---

### Requirement 3: To-Do List Management

**User Story:** As a user, I want to add, edit, complete, and delete tasks, with all changes persisted across browser sessions, so that my task list is always up to date when I return to the Dashboard.

#### Acceptance Criteria

1. THE Todo_Manager SHALL provide an input field and a submit control for adding new Tasks.
2. WHEN the user submits a new Task with a non-empty text value, THE Todo_Manager SHALL append the Task to the task list, persist it to Local_Storage, and display a brief visual confirmation to indicate the Task was successfully added.
3. IF the user attempts to submit a Task with an empty or whitespace-only text value, THEN THE Todo_Manager SHALL reject the submission and display an inline validation message.
4. WHEN the user activates the complete control on a Task, THE Todo_Manager SHALL toggle the Task's completion status and persist the updated state to Local_Storage.
5. THE Todo_Manager SHALL visually differentiate completed Tasks from incomplete Tasks (e.g., strikethrough text and reduced opacity).
6. WHEN the user activates the edit control on a Task, THE Todo_Manager SHALL replace the Task's display text with an editable input field pre-populated with the current text.
7. WHEN the user confirms an edit with a non-empty text value, THE Todo_Manager SHALL update the Task's text and persist the change to Local_Storage.
8. IF the user confirms an edit with an empty or whitespace-only text value, THEN THE Todo_Manager SHALL discard the edit and restore the original Task text.
9. WHEN the user activates the delete control on a Task, THE Todo_Manager SHALL remove the Task from the list and from Local_Storage.
10. WHEN the Dashboard loads, THE Todo_Manager SHALL read all persisted Tasks from Local_Storage and render them in the task list.
11. THE Todo_Manager SHALL display a placeholder message (e.g., "No tasks yet. Add one above!") WHEN the task list is empty.

---

### Requirement 4: Quick Links Management

**User Story:** As a user, I want to save and display buttons that open my favourite websites, with the links persisted across browser sessions, so that I can reach frequently visited pages with a single click.

#### Acceptance Criteria

1. THE Link_Manager SHALL provide an input field for a display label (maximum 50 characters) and an input field for a URL (maximum 2048 characters), and a submit control for adding new Quick_Links.
2. WHEN the user submits a new Quick_Link with a non-empty label and a URL containing at least one dot and at least one character after the dot, THE Link_Manager SHALL add the Quick_Link button to the link bar and persist it to Local_Storage.
3. IF the user submits a Quick_Link with an empty label or an empty URL, THEN THE Link_Manager SHALL reject the submission and display an inline validation message.
4. IF the user submits a Quick_Link with a URL that does not begin with "http://" or "https://", THEN THE Link_Manager SHALL prepend "https://" to the URL before saving.
5. WHEN the user activates a Quick_Link button, THE Dashboard SHALL open the associated URL in a new browser tab.
6. WHEN the user activates the delete control on a Quick_Link, THE Link_Manager SHALL remove the Quick_Link from the link bar and from Local_Storage.
7. WHEN the Dashboard loads, THE Link_Manager SHALL read all persisted Quick_Links from Local_Storage and render them in the link bar.
8. WHEN the link bar contains no Quick_Links, THE Link_Manager SHALL display a placeholder message (e.g., "No links saved yet.").
9. WHEN the user attempts to add a new Quick_Link and the total number of saved Quick_Links is already 20, THE Link_Manager SHALL reject the submission and display an inline error message indicating the limit has been reached.
10. THE Link_Manager SHALL permit multiple Quick_Links with identical labels or identical URLs (no uniqueness constraint is enforced).

---

### Requirement 5: Data Persistence and Storage

**User Story:** As a user, I want all my tasks and quick links to be automatically saved to my browser, so that my data is never lost when I close or refresh the tab.

#### Acceptance Criteria

1. THE Dashboard SHALL use the browser Local_Storage API as the sole persistence mechanism for all user data.
2. WHEN any Task is created, updated, or deleted, THE Todo_Manager SHALL write the complete updated task list to Local_Storage under a fixed key.
3. WHEN any Quick_Link is created or deleted, THE Link_Manager SHALL write the complete updated link list to Local_Storage under a fixed key.
4. WHEN a Local_Storage write operation fails due to quota exceeded or any storage exception, THE Dashboard SHALL display a visible error message to the user and retain the current in-memory state without data loss.
5. THE Dashboard SHALL store Task data and Quick_Link data under separate, distinct fixed Local_Storage keys.
6. THE Dashboard SHALL store Task data as a JSON-serialised array in Local_Storage.
7. THE Dashboard SHALL store Quick_Link data as a JSON-serialised array in Local_Storage.
8. IF a Local_Storage read operation returns null or data that cannot be parsed as a valid JSON array, THEN THE Dashboard SHALL initialise the respective widget with an empty default state and not throw an unhandled error.

---

### Requirement 6: Technology and Compatibility Constraints

**User Story:** As a developer, I want the Dashboard to be built with plain HTML, CSS, and Vanilla JavaScript with no external dependencies, so that it loads instantly, requires no build step, and can be used as a standalone file or browser extension.

#### Acceptance Criteria

1. THE Dashboard SHALL be implemented as a single HTML file referencing exactly one external CSS file (located in `css/`) and exactly one external JavaScript file (located in `js/`).
2. THE Dashboard SHALL satisfy all acceptance criteria when tested in the latest stable version of Chrome, Firefox, Edge, and Safari available at the time of testing, without polyfills or transpilation.
3. THE Dashboard SHALL not require a backend server, build tool, or external network request at runtime.
4. THE Dashboard SHALL load and reach an interactive state — defined as all four widgets rendered and responsive to user input — within 2 seconds on a device with at least 4 GB RAM and at least 2 CPU cores, with no network throttling applied.
5. THE Dashboard SHALL satisfy all acceptance criteria when opened via the `file://` protocol or packaged as a browser extension.

---

### Requirement 7: Visual Design and Usability

**User Story:** As a user, I want a clean, readable, and visually consistent interface, so that using the Dashboard is pleasant and free of cognitive friction.

#### Acceptance Criteria

1. THE Dashboard SHALL separate each widget from adjacent widgets by a visible border or a minimum gap of 16px between widget boundaries.
2. THE Dashboard SHALL apply the same font family, a type scale derived from a single base font size, a consistent spacing unit, and a single shared colour palette across all widgets.
3. WHILE the viewport width is between 320px and 2560px inclusive, THE Dashboard SHALL display without horizontal overflow and all interactive controls SHALL be reachable and operable.
4. WHEN an interactive control (button or input) receives keyboard focus, THE Dashboard SHALL display a minimum 2px solid outline with a contrast ratio of at least 3:1 against the adjacent background colour.
5. THE Dashboard SHALL maintain a colour contrast ratio of at least 4.5:1 between all non-decorative text and its background, in compliance with WCAG 2.1 Level AA.
