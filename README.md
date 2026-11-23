# Custom PC Game Launcher

A personal, console-inspired desktop game launcher for Windows built with Electron, React, and Three.js. It brings a sleek PlayStation-style interface—complete with 3D physical game cases and local library management—to your PC and Steam games.

## What This Project Does
- **Unified Game Library:** Launches local Windows `.exe` games and Steam shortcuts (`steam://rungameid/...`) from one customizable home screen.
- **3D Physical Game Shelf & Console UI:** Browse your library using keyboard arrow keys or your mouse across a horizontal ribbon or an interactive 3D shelf of physical game boxes.
- **Local Library Storage:** Saves your custom game list, cover art, and launch paths directly on your PC.

## Tech Stack
- **Desktop Wrapper:** Electron
- **Frontend & UI:** React, Tailwind CSS, Framer Motion
- **3D Game Shelf:** Three.js (`@react-three/fiber`)

## How to Test It (Windows)
1. Click **[Releases](../../releases)** on the right side of this page and download the `.exe` under **Assets**.
2. Double-click the `.exe` to run it (if Windows SmartScreen pops up, click **More info** → **Run anyway**).
3. Click the **+** tile in the launcher to add your own `.exe` or Steam games.

## Running from Source (For Developers)
If you want to inspect or modify the code yourself:
1. Clone or download this repository.
2. Run `npm install` to install dependencies.
3. Run `npm start` (or `npm run dev`) to launch the app locally.
