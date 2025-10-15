# Gnomies – Collaborative Storytelling for Small Groups

Gnomies is a real-time party game that guides two to eight players through creating a branching story together. A structured flow, live sockets, and lightweight prompts keep the session moving while still leaving space for improvisation and creativity.

## Why Gnomies?
- **Runs in the browser** – no installs, everyone joins from a shared code.
- **Guided collaboration** – clearly defined phases help shy writers participate.
- **Inclusive inputs** – players can contribute with text, drawings, and images for inspiration.
- **Host controls** – timers, phase changes, and extensions stay in the facilitator’s hands.

## Feature Highlights
- Live Socket.IO transport keeps the lobby, votes, and story content synchronized.
- Theme selection with instant vote tallies and host confirmation before writing begins.
- Round 1 prompts collect setting details plus two character write-ups inspired by reference images.
- Anonymous story seeds keep Round 1 submissions unbiased before the collaboration sprint.
- Round 2 collaboration sprint rotates through every player, giving each person a timed drafting turn while others feed verbs, adjectives, or drawings.
- Auto-saving lead drafts pushes updates to everyone in real time while hosts retain control over turn hand-offs.
- Final story reveal stitches everyone’s contributions into one continuous narrative.
- Time management with per-phase timers and limited host-triggered extensions.
- Automatic anonymous codenames keep every contribution nameless.

## Game Flow Overview

| Phase | What Happens | Host Tools |
| --- | --- | --- |
| **Lobby** | Players enter an 8-character room code. Minimum two players required to start. | Start game, leave room |
| **Theme Selection** | Everyone votes on Fantasy, Sci-Fi, Funny, Mystery, Adventure, or Drama. Counts update in real time. | Finalize winning theme |
| **Round 1 – Setting** | Players describe the story location in free text. | Advance once at least one setting is submitted |
| **Round 1 – Character 1 & 2** | Players view reference images (configurable) and write quick bios. | Move from Character 1 → Character 2 → Story Seeds |
| **Round 1 – Story Seeds** | Everyone reviews the anonymous Round 1 submissions before the sprint. | Launch Round 2 when ready |
| **Round 2 – Lead Selection** | Host chooses who will drive the next scene. | Assign a lead writer |
| **Round 2 – Collaboration** | Lead writes for two minutes; everyone else supplies verbs, adjectives, or drawings. Control then passes to the next player until all have contributed. | Trigger the 2-minute sprint, optional +60s extensions, finish a turn early |
| **Final Story** | Once every writer has taken a turn, the finished story appears as one cohesive piece for the group to read. | Restart session, export the story |

## Getting Started

### Prerequisites
- Node.js 16+
- npm (bundled with Node)

### Installation
```bash
git clone <repository-url>
cd Gnomies_DEC3500
npm install          # installs server dependencies
cd client
npm install          # installs React dependencies
cd ..
```

### Development Workflow
```bash
# Terminal 1 – backend with hot reload
npm run dev

# Terminal 2 – React development server
npm run client

# Or start both together
npm run dev-full
```

The React dev server uses port `3000`; the Node server uses `8080`.

### Production Build
```bash
npm run build   # builds the React client into client/build
npm start       # serves the production bundle and Socket.IO API
```

Open `http://localhost:8080` to reach the combined app. If you need to access the game from other devices on your network, share `http://<your-ip>:8080`.

### Environment Variables
- `REACT_APP_SOCKET_URL` (optional): set this in the client environment when the Socket.IO server is hosted somewhere other than the same origin. During development the app falls back to `http://localhost:8080`.

### Finding Your Local IP
- macOS / Linux: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- Windows: `ipconfig | findstr "IPv4"`

## Playing a Session

Every player gets an anonymous codename automatically when they open the landing page—no name entry required.

### Host Checklist
1. Open the app and click **Create Game**.
2. Share the 8-character code displayed in the lobby.
3. Wait until at least two players are present.
4. Click **Start Game** to launch the Theme Selection phase.
5. After reviewing the story seeds, assign a Round 2 lead, kick off the two-minute collaboration sprint, and advance the turn when a writer finishes so every player cycles through.
6. Use the host-only buttons in each phase to advance or extend time, and jump straight to the finale once everyone has contributed.

### Player Experience
1. Enter the shared code and choose **Join Game**.
2. Vote on the theme and contribute to the setting and character prompts.
3. During Round 2, feed verbs, adjectives, or drawing links to the active lead—and when the baton reaches you, use your timed turn to expand the story.
4. Watch the finished story appear as one seamless narrative once the last writer hands off, then collaborate on another round if you’d like.

### Character Images
Reference art for Character 1 and Character 2 lives in `client/public/character-images/`:
- `character1.png`
- `character2.png`

Replace these placeholders with your own artwork to customize the experience.

## Project Structure
```
Gnomies_DEC3500/
├── server.js                  # Express + Socket.IO game server
├── start.sh                   # Helper script (optional)
├── package.json               # Server scripts and dependencies
├── client/
│   ├── package.json           # React scripts and dependencies
│   ├── public/
│   │   ├── character-images/  # Optional reference art
│   │   └── index.html
│   └── src/
│       ├── App.jsx            # Application shell
│       ├── App.css            # Global styling
│       ├── context/GameContext.jsx
│       └── components/
│           ├── Landing.jsx
│           ├── Lobby.jsx
│           ├── Game.jsx
│           └── phases/        # Individual phase UIs
└── README.md
```

## Configuration Notes
- Gameplay limits live in `GAME_CONFIG` inside `server.js` (max players, timers, etc.).
- The host can request up to two time extensions per game.
- The server enforces the minimum two-player requirement before Theme Selection begins.
- Socket events such as `vote-theme`, `submit-round1-setting`, and `start-phase` drive the round system; see `server.js` for the full event catalogue.

## Tech Stack
- **Frontend:** React, Context API, CSS modules
- **Backend:** Node.js, Express, Socket.IO
- **Tooling:** npm scripts, concurrently, nodemon for development

## Contributing
Bug fixes and gameplay tweaks are welcome. Before opening a pull request, run:
```bash
npm run build
```
to ensure the combined build succeeds.

## License
MIT © Gnomies Team
