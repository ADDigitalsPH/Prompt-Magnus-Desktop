# Prompt Magnus Desktop - DESIGN.md

## 1. Design Goal

Prompt Magnus Desktop should feel like a small, premium, lightweight desktop utility.

The app is not a full SaaS dashboard. It should feel closer to a keyboard-first desktop launcher like Spotlight, Raycast, or Alfred, but focused on saved prompts.

Primary design goal:

```text
Save prompts in a clean library.
Open a small launcher from anywhere.
Search.
Press Enter.
Paste prompt into the active input field.
```

The UI should be simple enough for non-technical users but polished enough for developers and AI power users.

---

## 2. Visual Direction

Use a modern dark-mode desktop utility style.

### Style Keywords

```text
Lightweight
Keyboard-first
Fast
Private
Local
Minimal
Premium
Compact
Uncluttered
Focused
Desktop-native
```

### Visual Mood

```text
Dark background
Soft blue accent
Subtle borders
Rounded corners
Clean card grid
Minimal icons
Readable typography
No heavy dashboard feeling
No browser-like landing page layout
```

---

## 3. Color System

### Recommended Colors

```text
App Background: #0B111A
Panel Background: #111827
Card Background: #151D2A
Card Hover: #1B2636
Border: #263244
Muted Border: #1E293B

Primary Blue: #2F80FF
Primary Blue Hover: #4D94FF
Accent Blue Soft: #60A5FA

Text Primary: #F8FAFC
Text Secondary: #CBD5E1
Text Muted: #94A3B8

Danger: #EF4444
Danger Background: rgba(239, 68, 68, 0.12)

Favorite Star: #FBBF24
Success/Marketing Green: #34D399
Writing Purple: #A78BFA
Business Yellow: #F59E0B
```

### Design Rule

Use blue as the main action color. Use other colors only for small category labels, icons, and status indicators.

---

## 4. Typography

Use a clean sans-serif font.

Recommended:

```text
Inter
SF Pro
Segoe UI
Geist
```

### Type Scale

```text
Window Title: 14-16px, semibold
Sidebar Item: 14px, medium
Card Title: 14-15px, semibold
Card Preview: 12-13px, regular
Modal Title: 18-20px, semibold
Input Text: 14px, regular
Button Text: 14px, medium
Keyboard Hints: 11-12px
```

Keep text compact but readable.

---

## 5. App Architecture

The UI has three main surfaces:

```text
1. Main Prompt Library Window
2. Prompt Editor Modal
3. Floating Launcher
```

There should be no permanent right-side editor panel in the main library.

The prompt editor must appear as a modal popup.

---

## 6. Main Prompt Library Window

### Purpose

The main window is for browsing, organizing, creating, and editing prompts.

It is not the primary prompt insertion experience. The launcher is the primary usage experience.

### Layout

The main prompt library window has two main sections:

```text
Left Sidebar
Main Prompt Grid Area
```

### Window Size

Recommended default size:

```text
Width: 980px
Height: 680px
Minimum Width: 820px
Minimum Height: 560px
```

### Wireframe

```text
┌─────────────────────────────────────────────────────────────┐
│ Prompt Magnus Desktop                              _ □ X     │
├───────────────┬─────────────────────────────────────────────┤
│ All Prompts   │ Search prompts...              + New Prompt │
│ Favorites     │                                             │
│ Coding        │ ┌──────────────┐ ┌──────────────┐ ┌───────┐ │
│ Writing       │ │ Refactor     │ │ Fix UI Bug   │ │ PRD   │ │
│ Marketing     │ │ Coding       │ │ Coding       │ │ Biz   │ │
│ Business      │ │ Preview...   │ │ Preview...   │ │ ...   │ │
│ Personal      │ └──────────────┘ └──────────────┘ └───────┘ │
│               │ ┌──────────────┐ ┌──────────────┐ ┌───────┐ │
│ Settings      │ │ Explain Err. │ │ Improve      │ │ + New │ │
└───────────────┴─────────────────────────────────────────────┘
```

---

## 7. Sidebar Design

### Purpose

The sidebar filters prompts by view/category.

### Width

```text
Sidebar Width: 220px
```

### Sidebar Items

```text
All Prompts
Favorites
Coding
Writing
Marketing
Business
Personal
Settings
```

### Sidebar Behavior

- Clicking All Prompts shows every prompt.
- Clicking Favorites shows only favorited prompts.
- Clicking a category shows prompts from that category.
- Active item uses blue background.
- Inactive items use transparent background.
- Hover state uses subtle background highlight.

### Sidebar Style

```text
Background: #0F172A or #111827
Active Background: rgba(47, 128, 255, 0.22)
Active Border: subtle blue left edge or glow
Item Radius: 8-10px
Item Height: 40-44px
Icon Size: 18px
```

---

## 8. Main Grid Area

### Purpose

The main area displays prompts as cards.

### Top Bar

The top bar includes:

```text
Search input
+ New Prompt button
```

### Top Bar Dimensions

```text
Height: 72px
Search Width: flexible
Search Height: 42px
Button Height: 42px
Button Width: 130-150px
```

### Search Input

Placeholder:

```text
Search prompts...
```

Search should filter prompt cards by:

```text
Title
Prompt body
Category
```

### New Prompt Button

Text:

```text
+ New Prompt
```

Clicking opens the Prompt Editor Modal in New Prompt mode.

---

## 9. Prompt Grid

### Grid Behavior

The prompt cards should be displayed in a responsive grid.

Recommended grid:

```text
Desktop: 3 cards per row
Smaller window: 2 cards per row
Minimum: 1 card per row
```

### Grid Gap

```text
Gap: 12-16px
```

### Grid Padding

```text
Main Area Padding: 20px
```

---

## 10. Prompt Card Design

### Purpose

Prompt cards make the saved prompt library visual and easy to scan.

### Card Size

Recommended:

```text
Width: flexible
Minimum Width: 180px
Height: 150-170px
```

### Card Contents

Each card should show:

```text
Prompt title
Category label
Short preview
Favorite star icon
```

### Card Wireframe

```text
┌──────────────────────────────┐
│ Refactor Code Safely       ★ │
│ Coding                       │
│                              │
│ Refactor the following code  │
│ to improve readability...    │
└──────────────────────────────┘
```

### Card States

Default:

```text
Background: #151D2A
Border: #263244
```

Hover:

```text
Background: #1B2636
Border: #334155
Slight lift or stronger shadow
```

Active/Selected:

```text
Border: #2F80FF
Subtle blue glow
```

Favorite:

```text
Star icon filled with #FBBF24
```

### Card Click Behavior

Clicking a card opens the Prompt Editor Modal.

Do not open an inline editor.

---

## 11. New Prompt Card

The grid may include a dashed "New Prompt" card at the end.

### Design

```text
Dashed border
Centered plus icon
Text: New Prompt
```

### Behavior

Clicking it opens the Prompt Editor Modal in New Prompt mode.

---

## 12. Prompt Editor Modal

### Purpose

The modal is used for both creating and editing prompts.

### Modal Modes

```text
New Prompt
Edit Prompt
```

### Modal Size

Recommended:

```text
Width: 460-520px
Height: auto
Max Height: 80vh
```

### Modal Overlay

```text
Overlay: rgba(0, 0, 0, 0.45)
Backdrop blur: optional, subtle
```

### Modal Wireframe

```text
┌───────────────────────────────────────────────┐
│ Edit Prompt                              X    │
├───────────────────────────────────────────────┤
│ Title                                         │
│ [Refactor Code Safely]                        │
│                                               │
│ Category                                      │
│ [Coding ▼]                                    │
│                                               │
│ Prompt                                        │
│ ┌───────────────────────────────────────────┐ │
│ │ Refactor this code without changing...    │ │
│ │                                           │ │
│ └───────────────────────────────────────────┘ │
│                                               │
│ [✓] Mark as favorite                          │
│                                               │
│ Delete                       Cancel   Save    │
└───────────────────────────────────────────────┘
```

### Modal Fields

```text
Title input
Category dropdown
Prompt textarea
Favorite checkbox/toggle
```

### Modal Buttons

Edit mode:

```text
Delete
Cancel
Save
```

New mode:

```text
Cancel
Save
```

### Modal Behavior

- Esc closes modal.
- Save validates required fields.
- Title and prompt body are required.
- Delete should ask for confirmation or use a clear destructive state.
- Clicking outside the modal can close it only if there are no unsaved changes.
- If unsaved changes exist, ask user before closing.

---

## 13. Floating Launcher

### Purpose

The launcher is the fastest way to insert prompts anywhere.

It appears when the user presses:

```text
Ctrl + Space
```

### Launcher Size

Recommended:

```text
Width: 480-560px
Height: auto
Max Height: 520px
```

### Position

Default:

```text
Centered horizontally
Top 20-25% of screen
```

Alternative:

```text
Centered on screen
```

### Launcher Wireframe

```text
┌───────────────────────────────────────────────┐
│ Search prompts...              Ctrl + Space   │
├───────────────────────────────────────────────┤
│ Refactor Code Safely              Coding      │
│ Fix UI Bug                        Coding      │
│ Explain Error                     Coding      │
│ Improve Prompt                    Writing     │
│ Create PRD                        Business    │
├───────────────────────────────────────────────┤
│ Enter = Paste                         Esc = Close │
└───────────────────────────────────────────────┘
```

### Launcher Behavior

- Opens with Ctrl + Space.
- Search input is focused automatically.
- Shows top matching prompts.
- Arrow Up/Down moves selection.
- Enter pastes selected prompt.
- Ctrl + Enter copies selected prompt only.
- Esc closes launcher.
- Launcher closes after paste.

### Launcher Search Result

Each result should show:

```text
Icon
Prompt title
Category label
Optional short preview
```

Keep it compact.

### Launcher Empty State

If no prompts match:

```text
No prompts found
Create new prompt
```

Optional: pressing Enter on "Create new prompt" opens the New Prompt modal.

---

## 14. System Tray / Taskbar Behavior

### Purpose

The app must stay available even when the main window is closed.

### Required Behavior

When the user clicks the close button:

```text
The main window hides.
The app continues running.
The tray icon remains active.
Global shortcuts continue working.
```

### Tray Menu

Right-clicking the tray icon should show:

```text
Prompt Magnus Desktop
Open Prompt Library
Open Launcher
New Prompt
Quit
```

### Important UX Rule

The close button should not quit the app by default.

To fully quit, the user must choose Quit from the tray menu.

Optional first-time message:

```text
Prompt Magnus Desktop is still running in the system tray.
Use the tray icon to reopen or quit the app.
```

Do not show this message every time.

---

## 15. Settings Page

Settings should stay minimal.

### Settings Items

```text
Launcher shortcut
Save prompt from clipboard shortcut
Start on startup
Close to tray
Theme
Import prompts
Export prompts
```

### Default Settings

```text
Launcher shortcut: Ctrl + Space
Save prompt from clipboard shortcut: Ctrl + Shift + S
Start on startup: Off
Close to tray: On
Theme: Dark
```

---

## 16. Empty States

### No Prompts Yet

Message:

```text
No prompts yet.
Create your first prompt to start building your reusable prompt library.
```

Button:

```text
+ New Prompt
```

### No Search Results

Message:

```text
No matching prompts found.
```

Optional button:

```text
Create New Prompt
```

---

## 17. Interaction Rules

### General

- Keep interactions fast.
- Avoid unnecessary confirmation modals.
- Use confirmation only for destructive actions like delete.
- Avoid toasts for successful paste unless necessary.
- Do not show complex onboarding.

### Prompt Pasting

Expected sequence:

```text
Enter -> paste prompt -> close launcher
```

The action should feel instant.

### Clipboard Restoration

After paste, restore the previous clipboard content.

If the user had copied something before using Prompt Magnus Desktop, that content should still be available after prompt insertion.

---

## 18. Accessibility

Minimum accessibility requirements:

- Keyboard navigation for launcher
- Visible focus states
- Sufficient contrast
- Esc closes modal/launcher
- Buttons have clear labels
- Icons should not be the only indicator of meaning
- Prompt cards should be reachable by keyboard in the library

---

## 19. Responsive Behavior

This is a desktop app, but the window should support resizing.

### Large Window

```text
3 prompt cards per row
Sidebar visible
```

### Medium Window

```text
2 prompt cards per row
Sidebar visible
```

### Small Minimum Window

```text
1 prompt card per row
Sidebar remains visible if possible
```

Do not design as a mobile-first app.

---

## 20. Do Not Build

Avoid these UI patterns in the MVP:

```text
Three-column prompt library
Permanent right-side prompt editor
Analytics dashboard
Complex onboarding wizard
AI chat interface
Marketplace layout
Team workspace sidebar
Social feed layout
Browser extension UI
Heavy settings screen
```

---

## 21. Design Reference Summary

The app should visually communicate:

```text
This is a fast, private, local desktop prompt utility.
```

The main library should communicate:

```text
Browse and organize prompts.
```

The modal should communicate:

```text
Create or edit one prompt at a time.
```

The launcher should communicate:

```text
Search and paste instantly.
```

The tray menu should communicate:

```text
The app stays active in the background and is always accessible.
```

---

## 22. Final Design Direction

Prompt Magnus Desktop should feel like:

```text
A small system utility.
A prompt shelf.
A keyboard launcher.
A private local library.
```

It should not feel like:

```text
A complex SaaS dashboard.
A browser extension.
A full writing app.
A project management tool.
```

The product should remain simple, fast, and focused.
