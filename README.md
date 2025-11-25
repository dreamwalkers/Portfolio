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
