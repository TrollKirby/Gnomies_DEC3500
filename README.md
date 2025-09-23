# 🎭 Gnomies - Collaborative Storytelling (React)

A real-time collaborative storytelling application built with React that addresses common issues in group creative writing through structured phases, anonymous voting, and inclusive participation features.

## ✨ Features

### Core Functionality
- **Real-time Collaboration**: Multiple players can join and participate simultaneously
- **Anonymous Voting**: Vote on ideas without revealing identity to reduce social pressure
- **Multiple Input Types**: Text and drawing capabilities for diverse expression
- **Structured Phases**: Guided workflow prevents chaos and ensures participation
- **Timer Management**: Built-in timers with host-controlled extensions

### Game Phases
1. **Narrative Agreement**: Players suggest story elements (characters, setting, conflict)
2. **Element Voting**: Anonymous voting to select the most popular elements
3. **Prompt Creation**: Generate opening prompts based on selected elements
4. **Story Writing**: Collaborative story building with text and drawing
5. **Alternative Endings**: Create multiple story conclusions
6. **Final Selection**: Vote on the best ending

### Addressing Design Issues
- **Reduces Sharing Anxiety**: Anonymous contributions and voting
- **Prevents Writer's Block**: Structured prompts and multiple input methods
- **Accommodates Different Speeds**: Timer extensions and flexible participation
- **Ensures Cohesion**: Narrative agreement phase prevents story drift
- **Inclusive Participation**: Drawing options for non-textual thinkers

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd Gnomies_DEC3500
   npm install
   cd client
   npm install
   cd ..
   ```

2. **Build React App**
   ```bash
   npm run build
   ```

3. **Start the Server**
   ```bash
   npm start
   ```

4. **Access the Application**
   - Main device: `http://localhost:3000`
   - Other devices: `http://[YOUR_IP]:3000`

### Development Mode

For development with hot reloading:

```bash
# Terminal 1 - Start backend server
npm run dev

# Terminal 2 - Start React development server
npm run client
```

Or run both simultaneously:
```bash
npm run dev-full
```

### Finding Your IP Address

**On macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**On Windows:**
```bash
ipconfig | findstr "IPv4"
```

## 🎮 How to Play

### Creating a Game
1. Enter your name and click "Create Game"
2. Share the 8-character game code with other players
3. Wait for players to join (minimum 2, maximum 8)
4. Click "Start Game" when ready

### Joining a Game
1. Enter the game code and your name
2. Click "Join Game"
3. Wait for the host to start the game

### Game Flow
1. **Setup Phase**: Players join and prepare
2. **Narrative Agreement**: Suggest story elements
3. **Voting**: Vote on your favorite elements
4. **Prompting**: Create story opening based on selected elements
5. **Writing**: Continue the story with text or drawings
6. **Alternative Endings**: Create different conclusions
7. **Final Vote**: Choose the best ending
8. **Complete**: Export and share your story

## 🛠️ Technical Details

### Architecture
- **Backend**: Node.js with Express and Socket.io
- **Frontend**: React with hooks and context
- **Real-time**: WebSocket connections for live updates
- **Local Network**: Designed for local device connections

### Key Components
- `server.js`: Main server with game logic and WebSocket handling
- `client/src/App.js`: Main React application
- `client/src/context/GameContext.js`: Game state management with React Context
- `client/src/components/`: React components for each game phase
- `client/src/App.css`: Responsive styling and animations

### Game State Management
- Server-side game state with real-time synchronization
- Phase-based progression system
- Anonymous voting and contribution tracking
- Timer management with host controls

## 🎯 Design Solutions

### Problem: Sharing Anxiety
**Solution**: Anonymous contributions and voting system reduces social pressure

### Problem: Writer's Block
**Solution**: Structured prompts, multiple input types (text/drawing), and guided phases

### Problem: Different Writing Speeds
**Solution**: Timer system with host-controlled extensions (up to 2 per session)

### Problem: Story Cohesion
**Solution**: Narrative agreement phase ensures all players contribute to story direction

### Problem: Group Dynamics
**Solution**: Anonymous voting prevents conflicts and ensures fair selection

## 📱 Mobile Support

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- Any device with a modern web browser

## 🔧 Development

### Running in Development Mode
```bash
npm run dev
```

### Project Structure
```
Gnomies_DEC3500/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── README.md             # This file
├── start.sh              # Startup script
└── client/               # React frontend
    ├── package.json      # React dependencies
    ├── public/           # Static assets
    ├── src/              # React source code
    │   ├── App.js        # Main React component
    │   ├── App.css       # Styling
    │   ├── context/      # React Context for state
    │   └── components/   # React components
    └── build/            # Production build
```

## 🎨 Customization

### Modifying Game Rules
Edit `GAME_CONFIG` in `server.js`:
```javascript
const GAME_CONFIG = {
  maxPlayers: 8,           // Maximum players per game
  writingTime: 300000,     // Writing phase duration (ms)
  votingTime: 60000,       // Voting phase duration (ms)
  maxTimeExtensions: 2,    // Maximum time extensions
  minNarrativeElements: 3  // Minimum elements to select
};
```

### Styling
Modify `public/styles.css` to customize the appearance while maintaining functionality.

## 🤝 Contributing

This is a collaborative storytelling application designed for educational and creative purposes. Feel free to:
- Report bugs or issues
- Suggest new features
- Improve the user experience
- Add new input methods or game phases

## 📄 License

MIT License - Feel free to use and modify for your projects.

---

**Happy Storytelling! 🎭✨**
