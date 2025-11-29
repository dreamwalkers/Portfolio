# Ninshid P H — Windows XP Themed Portfolio

This is a frontend-only React + Vite portfolio that simulates a Windows XP desktop environment. It includes a taskbar, start menu, desktop icons, draggable/resizable windows styled like XP, and content sourced from JSON.

## Features
- Windows XP "Luna" inspired theme.
- Taskbar with Start menu and system tray (clock/volume/network icons).
- Clickable desktop icons that open windows.
- Draggable, resizable modal windows with minimize/maximize/close.
- Content stored in `src/content.json` for easy updates.
- Responsive design and simple animations.

## Quick start (Windows PowerShell)

Install dependencies:

```powershell
cd "d:\Workspace 3.0\Portfolio\ninshid-portfolio"
npm install
```

Run dev server:

```powershell
npm run dev
```

Build for production:

```powershell
npm run build
npm run preview
```

## Deploy
This app is static and can be deployed to Vercel, Netlify, Render, or Azure Static Web Apps. Build with `npm run build` and follow your host's static-site deployment steps.

## Replace assets
Replace `public/assets/profile.png` and `public/assets/logo.svg` with real images.

## JSON content
Update `src/content.json` to edit About, Experience, Skills, Projects, and Contact.

## Notes
- This is intentionally frontend-only. No backend required.
- For better polished drag/resize and accessibility, consider using libraries like `react-rnd` or `react-draggable`.

## Recent changes
These are the most recent updates made to this repository (automated changelog):

- feat: touch/tap support for desktop icons on mobile
	- File: `src/components/Icon.jsx`
	- Single short taps (pointer events) now open icons on touch devices; dragging remains supported.
	- Commit: `72122a0` (fix(icon): support touch tap to open icons on mobile)

- feat: Projects shown as folders and per-project windows
	- Files: `src/components/Window.jsx`, `src/components/Desktop.jsx`
	- The "Projects" window now displays projects as folder tiles; double-clicking a folder opens a dedicated project window showing details.
	- Commit: `c518543` (feat(projects): show projects as folders and open individual project windows)

- style: watermark added/relocated on desktop wallpaper
	- File: `src/styles.scss`
	- Watermark text `© Backend Infotech Pvt Ltd` added as a CSS overlay on the desktop background; positioned lower and darkened for readability on most wallpapers.
	- Commit: `d9cc9b0` (style(watermark): move watermark lower and increase contrast for readability)

- chore: synced workspace and committed build artifacts
	- Commit: `c518543` (chore: sync all workspace changes)

How to test the changes locally

1. Install dependencies (if not already done):

```powershell
npm install
```

2. Start dev server and open in a mobile emulator (or real device):

```powershell
npm run dev
```

3. Test cases:
- On a mobile device or emulator, tap a desktop icon once — the window should open.
- Try dragging an icon — it should move without triggering the open action.
- Open the Start menu and open "Projects" — confirm folder-style tiles appear; double-click a project to open its detail window.
- Confirm the watermark `© Backend Infotech Pvt Ltd` is visible near the lower center-right of the wallpaper. If it's still hard to read, change `src/styles.scss` (selector `.desktop::after`) to adjust `top`, `left`, `font-size`, or `color`.


