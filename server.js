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

// Set cache headers for favicon and static assets
app.use((req, res, next) => {
  if (req.path.includes('favicon') || req.path.includes('logo')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

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
  THEME_SELECTION: 'theme_selection',
  ROUND1_SETTING: 'round1_setting',
  ROUND1_CHARACTER1: 'round1_character1',
  ROUND1_CHARACTER2: 'round1_character2',
  ROUND1_RESULTS: 'round1_results',
  ROUND2_LEAD_SELECTION: 'round2_lead_selection',
  ROUND2_COLLABORATION: 'round2_collaboration',
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
  writingTime: 30000,  // 30 seconds for testing
  votingTime: 15000,   // 15 seconds for testing
  maxTimeExtensions: 2,
  minNarrativeElements: 3,
  roundTwoCollaborationTime: 120000 // 2 minutes
};

const THEME_OPTIONS = [
  'Fantasy',
  'Sci-Fi',
  'Funny',
  'Mystery',
  'Adventure',
  'Drama'
];

const ANON_ADJECTIVES = ['Mysterious', 'Silent', 'Curious', 'Brave', 'Wandering', 'Clever'];
const ANON_NOUNS = ['Gnome', 'Sprite', 'Scribe', 'Storyteller', 'Quill', 'Owl'];

const generateAnonymousName = () => {
  const adjective = ANON_ADJECTIVES[Math.floor(Math.random() * ANON_ADJECTIVES.length)];
  const noun = ANON_NOUNS[Math.floor(Math.random() * ANON_NOUNS.length)];
  const number = Math.floor(100 + Math.random() * 900);
  return `${adjective} ${noun} ${number}`;
};

const sanitizePlayerName = (name) => {
  if (typeof name === 'string') {
    const trimmed = name.trim().slice(0, 40);
    if (trimmed) {
      return trimmed;
    }
  }
  return generateAnonymousName();
};

class GameSession {
  constructor(hostId) {
    this.id = uuidv4();
    this.hostId = hostId;
    this.players = new Map();
    this.phase = PHASES.SETUP;
    this.themeVotes = new Map();
    this.selectedTheme = null;
    this.narrativeElements = [];
    this.currentPrompt = '';
    this.storyParts = [];
    this.votes = new Map();
    this.timeExtensions = 0;
    this.timer = null;
    this.timeRemaining = 0;
    this.alternativeEndings = [];
    this.createdAt = new Date();
    this.roundOne = {
      settingSubmissions: new Map(),
      characterSubmissions: {
        character1: new Map(),
        character2: new Map()
      }
    };
    this.roundTwo = {
      leadWriterId: null,
      writing: '',
      support: {
        verbs: [],
        adjectives: [],
        drawings: []
      },
      turnOrder: [],
      completedLeads: [],
      segments: []
    };
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
    this.themeVotes.delete(playerId);
    const wasLead = this.roundTwo.leadWriterId === playerId;
    this.roundTwo.turnOrder = this.roundTwo.turnOrder.filter(id => id !== playerId);
    this.roundTwo.completedLeads = this.roundTwo.completedLeads.filter(id => id !== playerId);
    ['verbs', 'adjectives', 'drawings'].forEach(category => {
      this.roundTwo.support[category] = this.roundTwo.support[category].filter(
        entry => entry.playerId !== playerId
      );
    });
    if (wasLead && this.phase === PHASES.ROUND2_COLLABORATION) {
      this.executeRoundTwoTurnCompletion();
    } else if (wasLead) {
      this.roundTwo.leadWriterId = null;
    }
    if (playerId === this.hostId && this.players.size > 0) {
      // Transfer host to first remaining player
      const newHost = this.players.values().next().value;
      newHost.isHost = true;
      this.hostId = newHost.id;
    }
  }

  resetRoundOneData() {
    this.roundOne = {
      settingSubmissions: new Map(),
      characterSubmissions: {
        character1: new Map(),
        character2: new Map()
      }
    };
  }

  resetRoundTwoData() {
    this.roundTwo = {
      leadWriterId: null,
      writing: '',
      support: {
        verbs: [],
        adjectives: [],
        drawings: []
      },
      turnOrder: [],
      completedLeads: [],
      segments: []
    };
  }
  initializeRoundTwoOrder(startPlayerId) {
    const playersInOrder = Array.from(this.players.values()).filter(player => player.isConnected);
    const orderedIds = playersInOrder.map(player => player.id);
    const startIndex = orderedIds.indexOf(startPlayerId);
    if (startIndex > 0) {
      const rotated = orderedIds.slice(startIndex).concat(orderedIds.slice(0, startIndex));
      this.roundTwo.turnOrder = rotated;
    } else {
      this.roundTwo.turnOrder = orderedIds;
    }
    this.roundTwo.completedLeads = [];
    this.roundTwo.segments = [];
  }

  advanceRoundTwoLead() {
    const currentLead = this.roundTwo.leadWriterId;
    if (currentLead && !this.roundTwo.completedLeads.includes(currentLead)) {
      this.roundTwo.completedLeads.push(currentLead);
    }
    this.roundTwo.turnOrder = this.roundTwo.turnOrder.filter(id => this.players.has(id));
    const nextLead = this.roundTwo.turnOrder.find(
      id => !this.roundTwo.completedLeads.includes(id) && this.players.has(id)
    );
    if (!nextLead) {
      this.roundTwo.leadWriterId = null;
      this.roundTwo.support = {
        verbs: [],
        adjectives: [],
        drawings: []
      };
      return false;
    }
    this.roundTwo.leadWriterId = nextLead;
    this.roundTwo.support = {
      verbs: [],
      adjectives: [],
      drawings: []
    };
    return true;
  }

  executeRoundTwoTurnCompletion() {
    const currentLead = this.roundTwo.leadWriterId;
    const finalDraft = typeof this.roundTwo.writing === 'string'
      ? this.roundTwo.writing.trim()
      : '';
    if (currentLead) {
      this.roundTwo.segments.push({
        id: uuidv4(),
        playerId: currentLead,
        playerName: this.players.get(currentLead)?.name || 'Unknown',
        content: finalDraft
      });
    }
    this.roundTwo.writing = '';
    this.clearTimer();
    const advanced = this.advanceRoundTwoLead();
    if (advanced) {
      this.timeRemaining = GAME_CONFIG.roundTwoCollaborationTime;
      this.startTimer();
      return 'advanced';
    }
    this.startPhase(PHASES.COMPLETE);
    return 'finished';
  }

  getThemeVoteCounts() {
    const counts = {};
    THEME_OPTIONS.forEach(option => {
      counts[option] = 0;
    });

    for (const theme of this.themeVotes.values()) {
      if (typeof theme === 'string') {
        counts[theme] = (counts[theme] || 0) + 1;
      }
    }
    return counts;
  }

  voteTheme(playerId, selection) {
    if (!selection || this.phase !== PHASES.THEME_SELECTION) return false;
    const normalized = THEME_OPTIONS.find(
      option => option.toLowerCase() === String(selection).toLowerCase()
    );
    if (!normalized) return false;
    this.themeVotes.set(playerId, normalized);
    return true;
  }

  finalizeTheme() {
    if (this.phase !== PHASES.THEME_SELECTION) return this.selectedTheme;
    const counts = this.getThemeVoteCounts();
    let topTheme = THEME_OPTIONS[0];
    let topCount = -1;

    THEME_OPTIONS.forEach(option => {
      const count = counts[option] || 0;
      if (count > topCount) {
        topCount = count;
        topTheme = option;
      }
    });

    this.selectedTheme = topTheme;
    this.resetRoundOneData();
    return this.selectedTheme;
  }

  submitRoundOneContribution(playerId, type, content) {
    if (!content || !content.trim()) return false;
    const trimmed = content.trim();

    switch (type) {
      case 'setting':
        if (this.phase !== PHASES.ROUND1_SETTING) return false;
        this.roundOne.settingSubmissions.set(playerId, trimmed);
        return true;
      case 'character1':
        if (this.phase !== PHASES.ROUND1_CHARACTER1) return false;
        this.roundOne.characterSubmissions.character1.set(playerId, trimmed);
        return true;
      case 'character2':
        if (this.phase !== PHASES.ROUND1_CHARACTER2) return false;
        this.roundOne.characterSubmissions.character2.set(playerId, trimmed);
        return true;
      default:
        return false;
    }
  }

  setRoundTwoLead(playerId) {
    if (this.phase !== PHASES.ROUND2_LEAD_SELECTION) return false;
    if (!this.players.has(playerId)) return false;
    if (!this.roundTwo.turnOrder.length || !this.roundTwo.turnOrder.includes(playerId)) {
      this.initializeRoundTwoOrder(playerId);
    } else {
      this.roundTwo.completedLeads = [];
      this.roundTwo.turnOrder = [
        playerId,
        ...this.roundTwo.turnOrder.filter(id => id !== playerId)
      ];
      this.roundTwo.segments = [];
    }
    this.roundTwo.leadWriterId = playerId;
    return true;
  }

  submitRoundTwoWriting(playerId, content) {
    if (this.phase !== PHASES.ROUND2_COLLABORATION) return false;
    if (this.roundTwo.leadWriterId !== playerId) return false;
    if (typeof content !== 'string') return false;
    this.roundTwo.writing = content;
    return true;
  }

  submitRoundTwoSupport(playerId, category, content) {
    if (this.phase !== PHASES.ROUND2_COLLABORATION) return false;
    const normalized = String(category || '').toLowerCase();
    if (!['verbs', 'adjectives', 'drawings'].includes(normalized)) return false;
    if (!content || !String(content).trim()) return false;

    const entry = {
      id: uuidv4(),
      playerId,
      playerName: this.players.get(playerId)?.name || 'Unknown',
      content: String(content).trim()
    };

    this.roundTwo.support[normalized].push(entry);
    return entry;
  }

  startPhase(phase) {
    if (phase === PHASES.THEME_SELECTION && this.players.size < 2) {
      return false;
    }

    if (phase === PHASES.PROMPTING) {
      this.processVotes();
    }
    if (phase === PHASES.THEME_SELECTION) {
      this.themeVotes.clear();
      this.selectedTheme = null;
      this.resetRoundOneData();
    }
    if (phase === PHASES.ROUND2_LEAD_SELECTION) {
      this.resetRoundTwoData();
    }
    this.phase = phase;
    this.clearTimer();
    
    if (phase === PHASES.WRITING) {
      this.timeRemaining = GAME_CONFIG.writingTime;
      this.startTimer();
    } else if (phase === PHASES.VOTING) {
      this.timeRemaining = GAME_CONFIG.votingTime;
      this.startTimer();
    } else if (phase === PHASES.ROUND2_COLLABORATION) {
      this.timeRemaining = GAME_CONFIG.roundTwoCollaborationTime;
      this.startTimer();
    }
    return true;
  }

  startTimer() {
    console.log(`Starting timer for phase ${this.phase}, time: ${this.timeRemaining}ms`);
    this.timer = setInterval(() => {
      this.timeRemaining -= 1000;
      console.log(`Timer tick: ${this.timeRemaining}ms remaining`);
      
      // Send timer update to all players
      if (this.timeRemaining % 10000 === 0 || this.timeRemaining <= 10000) {
        io.to(this.id).emit('timer-update', this.getGameState());
      }
      
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
      case PHASES.ROUND2_COLLABORATION:
        {
          const result = this.executeRoundTwoTurnCompletion();
          const state = this.getGameState();
          if (result === 'advanced') {
            io.to(this.id).emit('game-updated', state);
          } else if (result === 'finished') {
            io.to(this.id).emit('phase-started', state);
          }
        }
        break;
      case PHASES.WRITING:
        this.collectSubmissions();
        break;
      case PHASES.VOTING:
        this.timeoutPhaseChange();
        break;
    }
  }

  completeRoundTwoTurn(requesterId) {
    if (this.phase !== PHASES.ROUND2_COLLABORATION) return 'invalid';
    const requester = this.players.get(requesterId);
    if (!requester) return 'invalid';
    const isLead = requesterId === this.roundTwo.leadWriterId;
    if (!isLead && !requester.isHost) {
      return 'forbidden';
    }
    return this.executeRoundTwoTurnCompletion();
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
    console.log("test");
    const topNarrativeElements = this.narrativeElements
      .sort((a, b) => b.votes - a.votes)
      .slice(0, GAME_CONFIG.minNarrativeElements);
    this.narrativeElements = topNarrativeElements;
    
    const topStoryPart = this.storyParts
      .sort((a, b) => b.votes - a.votes)[0];
    if (topStoryPart) {this.currentPrompt = topStoryPart.content; }
  }

  timeoutPhaseChange() {
    if (this.phase === PHASES.VOTING && this.narrativeElements.length > 0) {
      this.startPhase(PHASES.PROMPTING);
    } else if (this.phase === PHASES.VOTING && this.storyParts.length > 0) {
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
    const serializeSubmissions = (submissionsMap) => Array.from(submissionsMap.entries()).map(([playerId, content]) => ({
      playerId,
      playerName: this.players.get(playerId)?.name || 'Unknown',
      content
    }));

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
      maxTimeExtensions: GAME_CONFIG.maxTimeExtensions,
      themeOptions: THEME_OPTIONS,
      themeVoteCounts: this.getThemeVoteCounts(),
      themeVotes: Array.from(this.themeVotes.entries()).map(([playerId, theme]) => ({
        playerId,
        playerName: this.players.get(playerId)?.name || 'Unknown',
        theme
      })),
      selectedTheme: this.selectedTheme,
      roundOne: {
        settingSubmissions: serializeSubmissions(this.roundOne.settingSubmissions),
        characterSubmissions: {
          character1: serializeSubmissions(this.roundOne.characterSubmissions.character1),
          character2: serializeSubmissions(this.roundOne.characterSubmissions.character2)
        }
      },
      roundTwo: {
        leadWriterId: this.roundTwo.leadWriterId,
        writing: this.roundTwo.writing,
        support: this.roundTwo.support,
        turnOrder: this.roundTwo.turnOrder,
        completedLeads: this.roundTwo.completedLeads,
        segments: this.roundTwo.segments
      }
    };
  }
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create-game', (playerName) => {
    const safeName = sanitizePlayerName(playerName);
    const game = new GameSession(socket.id);
    game.addPlayer(socket.id, safeName);
    games.set(game.id, game);
    sessions.set(socket.id, game.id);
    socket.join(game.id);
    socket.emit('game-created', game.getGameState());
  });

  socket.on('join-game', (gameCode, playerName) => {
    const safeName = sanitizePlayerName(playerName);
    console.log(`Join attempt: gameCode=${gameCode}, playerName=${safeName}, socketId=${socket.id}`);
    console.log(`Available games:`, Array.from(games.keys()));
    console.log(`Current sessions:`, Array.from(sessions.entries()));
    
    // Find game by 8-character code
    let gameId = null;
    for (const [id, game] of games.entries()) {
      if (id.substring(0, 8).toUpperCase() === gameCode.toUpperCase()) {
        gameId = id;
        break;
      }
    }
    
    const game = gameId ? games.get(gameId) : null;
    if (game && game.addPlayer(socket.id, safeName)) {
      sessions.set(socket.id, gameId);
      socket.join(gameId);
      console.log(`Player ${safeName} successfully joined game ${gameId} (code: ${gameCode})`);
      socket.emit('game-joined', game.getGameState());
      socket.to(gameId).emit('player-joined', game.getGameState());
    } else {
      const reason = !game ? 'Game not found' : 'Game is full';
      console.log(`Join failed: ${reason} for game code ${gameCode}`);
      socket.emit('join-failed', reason);
    }
  });

  socket.on('vote-theme', (theme) => {
    const gameId = sessions.get(socket.id);
    const game = games.get(gameId);
    if (game && game.voteTheme(socket.id, theme)) {
      io.to(gameId).emit('game-updated', game.getGameState());
    }
  });

  socket.on('finalize-theme', () => {
    const gameId = sessions.get(socket.id);
    const game = games.get(gameId);
    if (game && game.players.get(socket.id)?.isHost) {
      game.finalizeTheme();
      const started = game.startPhase(PHASES.ROUND1_SETTING);
      if (started) {
        io.to(gameId).emit('phase-started', game.getGameState());
      } else {
        socket.emit('phase-start-failed', {
          reason: 'Unable to advance phase. Please check player count.'
        });
      }
    }
  });

  socket.on('submit-round1-setting', (content) => {
    const gameId = sessions.get(socket.id);
    const game = games.get(gameId);
    if (game && game.submitRoundOneContribution(socket.id, 'setting', content)) {
      io.to(gameId).emit('game-updated', game.getGameState());
    }
  });

  socket.on('submit-round1-character', (characterKey, content) => {
    const gameId = sessions.get(socket.id);
    const game = games.get(gameId);
    if (!['character1', 'character2'].includes(characterKey)) {
      return;
    }
    if (game && game.submitRoundOneContribution(socket.id, characterKey, content)) {
      io.to(gameId).emit('game-updated', game.getGameState());
    }
  });

  socket.on('start-phase', (phase) => {
    const gameId = sessions.get(socket.id);
    const game = games.get(gameId);
    if (game && game.players.get(socket.id)?.isHost) {
      const started = game.startPhase(phase);
      if (started) {
        io.to(gameId).emit('phase-started', game.getGameState());
      } else {
        socket.emit('phase-start-failed', {
          reason: 'At least two players are required to start the game.'
        });
      }
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

  socket.on('set-round2-lead', (playerId) => {
    const gameId = sessions.get(socket.id);
    const game = games.get(gameId);
    if (game && game.players.get(socket.id)?.isHost) {
      if (game.setRoundTwoLead(playerId)) {
        io.to(gameId).emit('game-updated', game.getGameState());
      }
    }
  });

  socket.on('submit-round2-writing', (content) => {
    const gameId = sessions.get(socket.id);
    const game = games.get(gameId);
    if (game && game.submitRoundTwoWriting(socket.id, content)) {
      io.to(gameId).emit('game-updated', game.getGameState());
    }
  });

  socket.on('submit-round2-support', (category, content) => {
    const gameId = sessions.get(socket.id);
    const game = games.get(gameId);
    if (game) {
      const entry = game.submitRoundTwoSupport(socket.id, category, content);
      if (entry) {
        io.to(gameId).emit('game-updated', game.getGameState());
      }
    }
  });

  socket.on('complete-round2-turn', () => {
    const gameId = sessions.get(socket.id);
    const game = games.get(gameId);
    if (!game) return;
    const result = game.completeRoundTwoTurn(socket.id);
    if (result === 'advanced') {
      io.to(gameId).emit('game-updated', game.getGameState());
    } else if (result === 'finished') {
      io.to(gameId).emit('phase-started', game.getGameState());
    } else if (result === 'forbidden') {
      socket.emit('phase-start-failed', {
        reason: 'Only the current lead writer or host can finish the turn.'
      });
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
