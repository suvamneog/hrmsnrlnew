# DESIGN.md — NRL People

Reference: Apple's own apps (Health, Settings, Wallet) and iOS system controls: calm surfaces, springs, capsules.
Tone in three words: calm, plain, exact.
Audience: NRL staff on a shift, managers at changeover, HR and payroll at month end, guards at the gate, often on a phone and sometimes in Hindi or Assamese.

## Palette (tokens in src/app/globals.css)

| Token | Hex | Job |
|---|---|---|
| bg | #f7f7f5 | Page background |
| ink | #1d1d1f | Text |
| muted | #6e6e73 | Secondary text (AA on white) |
| line / fill / subtle | #ebebea / #f2f2f0 / #f5f5f3 | Dividers and quiet surfaces |
| brand | #3d5afe | The one accent: primary buttons, active states, links |
| ok / warn / danger (+ -soft) | green / amber / red | Status only, never decoration |
| shift-morning / shift-afternoon / shift-night | #ffe9a8 / #ef7d32 / #26306b | Shift identity, light to dark through the day |

## Type

One family, Plus Jakarta Sans, with Noto Sans Devanagari and Bengali for Hindi and Assamese. IBM Plex Mono for codes. Display sizes use tight tracking; numbers are tabular.
Body is 14–15px because this is a dense work tool, not a reading page; nothing below 12px except grid day labels.

## Layout

Sidebar from 1024px, a floating glass tab bar below it. Cards are white on the warm grey page; each page leads with what needs doing today, then detail.

## Radius

Three sizes, each with a job: full for pills, capsules and avatars; 12px (rounded-xl) for cards, sheets and day pills; 8px (rounded-lg) for controls and small tiles. Continuous (squircle) corners where the browser supports them.

## Motion

One idea: springs with no bounce for things that move, a short ease-out for things that appear (under 400ms). Sheets follow the finger. Nothing loops. Reduced motion turns it all off.

## Interaction

Act at once and offer Undo rather than asking first. Cmd/Ctrl+K opens search. Focus is always visible. Touch targets are at least 44px on touch screens.

## Icons

Icons sit alone, coloured by status, not inside tinted badges. Exceptions where the picture carries meaning a word cannot: shift pictures (sunrise, sun, moon) and the kiosk tiles for staff who read little.
