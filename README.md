# Custom PC Game Launcher

A personal, console-inspired desktop game launcher for Windows built with Electron, React, and Three.js. It brings a sleek PlayStation-style interface—complete with controller navigation, 3D game cases, and playtime tracking—to your local PC and Steam games.

## What This Project Does
- **Unified Game Library:** Launches local Windows `.exe` games and Steam shortcuts (`steam://rungameid/...`) from one customizable home screen.
- **Console Navigation & Views:** Supports full keyboard and PlayStation/Xbox gamepad navigation across a horizontal ribbon, 3D physical game shelf, or arcade cabinet mode.
- **Built-In Tracking & Customization:** Automatically tracks hours played, lets you write quick per-game notes, and stores your library locally on your PC.

## Tech Stack
- **Desktop Wrapper:** Electron
- **Frontend & UI:** React, Tailwind CSS, Framer Motion
- **3D Shelf / Arcade Views:** Three.js (`@react-three/fiber`)

## How to Test It (Windows)
1. Click **[Releases](../../releases)** on the right side of this page and download the `.exe` under **Assets**.
2. Double-click the `.exe` to run it (if Windows SmartScreen pops up, click **More info** → **Run anyway**).
3. Click the **+** tile in the launcher to add your own `.exe` or Steam games.

## Running from Source (For Developers)
If you want to inspect or modify the code yourself:
1. Clone or download this repository.
2. Run `npm install` to install dependencies.
3. Run `npm start` (or `npm run dev`) to launch the app locally.
