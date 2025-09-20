const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'client/build')));

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Game state management
const games = new Map();
const sessions = new Map();

// Game phases
const PHASES = {
  SETUP: 'setup',
  NARRATIVE_AGREEMENT: 'narrative_agreement',
  PROMPTING: 'prompting',
  WRITING: 'writing',
  VOTING: 'voting',
  ALTERNATIVE_ENDINGS: 'alternative_endings',
  COMPLETE: 'complete'
};

// Game configuration
const GAME_CONFIG = {
  maxPlayers: 8,
  writingTime: 300000, // 5 minutes
  votingTime: 60000,   // 1 minute
  maxTimeExtensions: 2,
  minNarrativeElements: 3
};

class GameSession {
  constructor(hostId) {
    this.id = uuidv4();
    this.hostId = hostId;
    this.players = new Map();
    this.phase = PHASES.SETUP;
    this.narrativeElements = [];
    this.currentPrompt = '';
    this.storyParts = [];
    this.votes = new Map();
    this.timeExtensions = 0;
    this.timer = null;
    this.timeRemaining = 0;
    this.alternativeEndings = [];
    this.createdAt = new Date();
  }

  addPlayer(playerId, playerName) {
    if (this.players.size >= GAME_CONFIG.maxPlayers) {
      return false;
    }
    this.players.set(playerId, {
      id: playerId,
      name: playerName,
      isHost: playerId === this.hostId,
      isConnected: true,
      currentVote: null,
      hasSubmitted: false
    });
    return true;
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
    if (playerId === this.hostId && this.players.size > 0) {
      // Transfer host to first remaining player
      const newHost = this.players.values().next().value;
      newHost.isHost = true;
      this.hostId = newHost.id;
    }
  }

  startPhase(phase) {
    this.phase = phase;
    this.clearTimer();
    
    if (phase === PHASES.WRITING) {
      this.timeRemaining = GAME_CONFIG.writingTime;
      this.startTimer();
    } else if (phase === PHASES.VOTING) {
      this.timeRemaining = GAME_CONFIG.votingTime;
      this.startTimer();
    }
  }

  startTimer() {
    this.timer = setInterval(() => {
      this.timeRemaining -= 1000;
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.clearTimer();
        this.handleTimeUp();
      }
    }, 1000);
  }

  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  handleTimeUp() {
    switch (this.phase) {
      case PHASES.WRITING:
        this.collectSubmissions();
        break;
      case PHASES.VOTING:
        this.processVotes();
        break;
    }
  }

  requestTimeExtension(playerId) {
    if (this.players.get(playerId)?.isHost && this.timeExtensions < GAME_CONFIG.maxTimeExtensions) {
      this.timeExtensions++;
      this.timeRemaining += 60000; // Add 1 minute
      return true;
    }
    return false;
  }

  submitNarrativeElement(playerId, element) {
    if (this.phase === PHASES.NARRATIVE_AGREEMENT) {
      this.narrativeElements.push({
        id: uuidv4(),
        playerId,
        element,
        votes: 0
      });
      return true;
    }
    return false;
  }

  submitStoryPart(playerId, content, type = 'text') {
    if (this.phase === PHASES.WRITING) {
      this.storyParts.push({
        id: uuidv4(),
        playerId,
        content,
        type,
        timestamp: new Date(),
        votes: 0
      });
      this.players.get(playerId).hasSubmitted = true;
      return true;
    }
    return false;
  }

  vote(playerId, targetId, targetType) {
    if (this.phase === PHASES.VOTING) {
      // Remove previous vote
      if (this.votes.has(playerId)) {
        const prevVote = this.votes.get(playerId);
        this.decrementVotes(prevVote.targetId, prevVote.targetType);
      }
      
      // Add new vote
      this.votes.set(playerId, { targetId, targetType });
      this.incrementVotes(targetId, targetType);
      return true;
    }
    return false;
  }

  incrementVotes(targetId, targetType) {
    if (targetType === 'narrative') {
      const element = this.narrativeElements.find(e => e.id === targetId);
      if (element) element.votes++;
    } else if (targetType === 'story') {
      const part = this.storyParts.find(p => p.id === targetId);
      if (part) part.votes++;
    }
  }

  decrementVotes(targetId, targetType) {
    if (targetType === 'narrative') {
      const element = this.narrativeElements.find(e => e.id === targetId);
      if (element) element.votes--;
    } else if (targetType === 'story') {
      const part = this.storyParts.find(p => p.id === targetId);
      if (part) part.votes--;
    }
  }

  collectSubmissions() {
    this.startPhase(PHASES.VOTING);
  }

  processVotes() {
    // Find highest voted elements
    const topNarrativeElements = this.narrativeElements
      .sort((a, b) => b.votes - a.votes)
      .slice(0, GAME_CONFIG.minNarrativeElements);
    
    const topStoryPart = this.storyParts
      .sort((a, b) => b.votes - a.votes)[0];
    
    if (this.phase === PHASES.VOTING && this.narrativeElements.length > 0) {
      this.narrativeElements = topNarrativeElements;
      this.startPhase(PHASES.PROMPTING);
    } else if (this.phase === PHASES.VOTING && this.storyParts.length > 0) {
      this.currentPrompt = topStoryPart.content;
      this.startPhase(PHASES.ALTERNATIVE_ENDINGS);
    }
  }

  submitAlternativeEnding(playerId, ending) {
    if (this.phase === PHASES.ALTERNATIVE_ENDINGS) {
      this.alternativeEndings.push({
        id: uuidv4(),
        playerId,
        ending,
        votes: 0
      });
      return true;
    }
    return false;
  }

  getGameState() {
    return {
      id: this.id,
      phase: this.phase,
      players: Array.from(this.players.values()),
      narrativeElements: this.narrativeElements,
      currentPrompt: this.currentPrompt,
      storyParts: this.storyParts,
      alternativeEndings: this.alternativeEndings,
      timeRemaining: this.timeRemaining,
      timeExtensions: this.timeExtensions,
      maxTimeExtensions: GAME_CONFIG.maxTimeExtensions
    };
  }
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create-game', (playerName) => {
    const game = new GameSession(socket.id);
    game.addPlayer(socket.id, playerName);
    games.set(game.id, game);
    sessions.set(socket.id, game.id);
    socket.join(game.id);
    socket.emit('game-created', game.getGameState());
  });

  socket.on('join-game', (gameId, playerName) => {
    console.log(`Join attempt: gameId=${gameId}, playerName=${playerName}, socketId=${socket.id}`);
    console.log(`Available games:`, Array.from(games.keys()));
    console.log(`Current sessions:`, Array.from(sessions.entries()));
    
    const game = games.get(gameId);
    if (game && game.addPlayer(socket.id, playerName)) {
      sessions.set(socket.id, gameId);
      socket.join(gameId);
      console.log(`Player ${playerName} successfully joined game ${gameId}`);
      socket.emit('game-joined', game.getGameState());
      socket.to(gameId).emit('player-joined', game.getGameState());
    } else {
      const reason = !game ? 'Game not found' : 'Game is full';
      console.log(`Join failed: ${reason} for game ${gameId}`);
      socket.emit('join-failed', reason);
    }
  });

  socket.on('start-phase', (phase) => {
    const gameId = sessions.get(socket.id);
    const game = games.get(gameId);
    if (game && game.players.get(socket.id)?.isHost) {
      game.startPhase(phase);
      io.to(gameId).emit('phase-started', game.getGameState());
    }
  });

  socket.on('submit-narrative-element', (element) => {
    const gameId = sessions.get(socket.id);
    const game = games.get(gameId);
    if (game && game.submitNarrativeElement(socket.id, element)) {
      io.to(gameId).emit('narrative-element-added', game.getGameState());
    }
  });

  socket.on('submit-story-part', (content, type) => {
    const gameId = sessions.get(socket.id);
    const game = games.get(gameId);
    if (game && game.submitStoryPart(socket.id, content, type)) {
      io.to(gameId).emit('story-part-added', game.getGameState());
    }
  });

  socket.on('vote', (targetId, targetType) => {
    const gameId = sessions.get(socket.id);
    const game = games.get(gameId);
    if (game && game.vote(socket.id, targetId, targetType)) {
      io.to(gameId).emit('vote-cast', game.getGameState());
    }
  });

  socket.on('request-time-extension', () => {
    const gameId = sessions.get(socket.id);
    const game = games.get(gameId);
    if (game && game.requestTimeExtension(socket.id)) {
      io.to(gameId).emit('time-extended', game.getGameState());
    }
  });

  socket.on('submit-alternative-ending', (ending) => {
    const gameId = sessions.get(socket.id);
    const game = games.get(gameId);
    if (game && game.submitAlternativeEnding(socket.id, ending)) {
      io.to(gameId).emit('alternative-ending-added', game.getGameState());
    }
  });

  socket.on('disconnect', () => {
    const gameId = sessions.get(socket.id);
    if (gameId) {
      const game = games.get(gameId);
      if (game) {
        game.removePlayer(socket.id);
        sessions.delete(socket.id);
        if (game.players.size === 0) {
          games.delete(gameId);
        } else {
          io.to(gameId).emit('player-left', game.getGameState());
        }
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Access from other devices: http://[YOUR_IP]:${PORT}`);
});
