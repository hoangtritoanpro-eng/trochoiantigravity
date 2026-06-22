const TugOfWarGame = {
  canvas: null,
  ctx: null,
  questions: [],
  currentQIdx: 0,
  score: 0,
  ropePosition: 0, // Offset from center (-X is player win, +X is opponent win)
  timeLimit: 12, // 12 seconds per question
  timeLeft: 12,
  lastTime: 0,
  gameState: 'PLAYING', // PLAYING, ANSWERED, FINISHED
  selectedOption: -1,
  answerStatus: null, // 'correct' or 'wrong'
  statusTimer: 0,
  buttonCoords: [],

  start(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.questions = QuestionBank.getQuestions(AppState.grade, AppState.topic, 5);
    this.currentQIdx = 0;
    this.score = 0;
    this.ropePosition = 0;
    this.timeLeft = this.timeLimit;
    this.lastTime = Date.now();
    this.gameState = 'PLAYING';
    this.selectedOption = -1;
    this.answerStatus = null;
    this.statusTimer = 0;
    this.scoreSaved = false;
    
    // Bind click events on the canvas
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    
    // Run loop
    this.loop();
  },

  loop() {
    if (AppState.activeGame !== 'tug-of-war') return;
    this.update();
    this.draw();
    AppState.gameLoopId = requestAnimationFrame(this.loop.bind(this));
  },

  update() {
    const now = Date.now();
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    if (this.gameState === 'PLAYING') {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.handleAnswer(-1); // Timeout is incorrect
      }
    } else if (this.gameState === 'ANSWERED') {
      this.statusTimer -= dt;
      if (this.statusTimer <= 0) {
        this.currentQIdx++;
        if (this.currentQIdx >= this.questions.length || Math.abs(this.ropePosition) > 150) {
          this.gameState = 'FINISHED';
          if (this.ropePosition < 0) {
            AudioEngine.play('win');
          }
          if (!this.scoreSaved) {
            AppRouter.saveScore('tug-of-war', this.score, 5);
            this.scoreSaved = true;
          }
        } else {
          this.gameState = 'PLAYING';
          this.timeLeft = this.timeLimit;
          this.selectedOption = -1;
          this.answerStatus = null;
        }
      }
    }
  },

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    // 1. Draw Field / Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Center divider
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();

    // Target boundary zones
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)';
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(w / 2 - 150, 0); ctx.lineTo(w / 2 - 150, h);
    ctx.moveTo(w / 2 + 150, 0); ctx.lineTo(w / 2 + 150, h);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Draw Rope & Teams
    this.drawRopeAndTeams(w, h);

    // 3. Draw Quiz Interface or End Screen
    if (this.gameState === 'FINISHED') {
      this.drawEndScreen(w, h);
    } else {
      this.drawQuizInterface(w, h);
    }
  },

  drawRopeAndTeams(w, h) {
    const ctx = this.ctx;
    const ropeY = h * 0.45;
    const centerOffset = this.ropePosition;
    
    // Draw rope shadow/glow
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.2)';
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(50, ropeY);
    ctx.lineTo(w - 50, ropeY);
    ctx.stroke();

    // Neon Rope itself
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(50, ropeY);
    ctx.lineTo(w - 50, ropeY);
    ctx.stroke();

    // Center red ribbon (glowing marker)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(w / 2 + centerOffset, ropeY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // DRAW PLAYERS (Left Team - Thầy Toàn A.I & Class)
    const px = w * 0.2 + (centerOffset * 0.3);
    const py = ropeY;
    
    ctx.fillStyle = '#10b981'; // Green team
    ctx.beginPath();
    ctx.arc(px, py + 20, 20, 0, Math.PI * 2); // Body
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('Toàn A.I', px, py - 10);

    // DRAW OPPONENTS (Right Team - Robot AI)
    const ox = w * 0.8 + (centerOffset * 0.3);
    const oy = ropeY;
    
    ctx.fillStyle = '#0ea5e9'; // Blue team
    ctx.beginPath();
    ctx.arc(ox, oy + 20, 20, 0, Math.PI * 2); // Body
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('AI Bot', ox, oy - 10);
  },

  drawQuizInterface(w, h) {
    const ctx = this.ctx;
    const currentQ = this.questions[this.currentQIdx];
    if (!currentQ) return;

    // Timer Bar
    const timerW = w * 0.6;
    const timerH = 8;
    const timerX = w / 2 - timerW / 2;
    const timerY = 30;
    
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(timerX, timerY, timerW, timerH);
    
    const pct = this.timeLeft / this.timeLimit;
    ctx.fillStyle = pct < 0.3 ? '#ef4444' : 'var(--primary)';
    ctx.fillRect(timerX, timerY, timerW * pct, timerH);

    // Draw Question Card
    const qW = Math.min(w * 0.8, 900);
    const qH = 100;
    const qX = w / 2 - qW / 2;
    const qY = 60;
    drawGlassCard(ctx, currentQ.q, qX, qY, qW, qH, 'var(--bg-panel)', 'var(--border-glass)', '#fff', '22px');

    // Draw Options Grid
    const btnW = qW / 2 - 15;
    const btnH = 65;
    const optY = qY + qH + 20;
    this.buttonCoords = [];

    for (let i = 0; i < 4; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = qX + col * (btnW + 30);
      const by = optY + row * (btnH + 15);
      
      let bg = 'rgba(30, 41, 59, 0.7)';
      let border = 'var(--border-glass)';
      let textCol = 'var(--text-primary)';

      if (this.gameState === 'ANSWERED') {
        if (i === currentQ.ans) {
          bg = 'rgba(16, 185, 129, 0.9)'; // Green
          border = '#10b981';
          textCol = '#fff';
        } else if (i === this.selectedOption) {
          bg = 'rgba(239, 68, 68, 0.9)'; // Red
          border = '#ef4444';
          textCol = '#fff';
        }
      } else {
        if (i === this.selectedOption) {
          bg = 'rgba(16, 185, 129, 0.2)';
          border = 'var(--primary)';
        }
      }

      drawGlassCard(ctx, currentQ.options[i], bx, by, btnW, btnH, bg, border, textCol, '16px');
      this.buttonCoords.push({ index: i, x1: bx, y1: by, x2: bx + btnW, y2: by + btnH });
    }
  },

  drawEndScreen(w, h) {
    const ctx = this.ctx;
    const text = this.ropePosition < 0 ? '🏆 THẦY TOÀN A.I CHIẾN THẮNG!' : '🤖 AI BOT CHIẾN THẮNG!';
    const color = this.ropePosition < 0 ? 'var(--primary)' : '#ef4444';

    drawGlassCard(
      ctx,
      text + `\nĐiểm số: ${this.score}/5\nNhấp vào màn hình để chơi lại.`,
      w / 2 - 250,
      h / 2 - 100,
      500,
      200,
      'rgba(15, 23, 42, 0.9)',
      color,
      '#fff',
      '22px'
    );
  },

  handleClick(e) {
    if (this.gameState === 'FINISHED') {
      this.start(this.canvas);
      return;
    }
    if (this.gameState !== 'PLAYING') return;

    // Get click coords relative to canvas
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    for (const btn of this.buttonCoords) {
      if (mx >= btn.x1 && mx <= btn.x2 && my >= btn.y1 && my <= btn.y2) {
        this.handleAnswer(btn.index);
        break;
      }
    }
  },

  handleAnswer(optIndex) {
    this.gameState = 'ANSWERED';
    this.selectedOption = optIndex;
    this.statusTimer = 2.0; // 2 seconds delay

    const currentQ = this.questions[this.currentQIdx];
    if (optIndex === currentQ.ans) {
      this.score++;
      this.ropePosition -= 60; // Pull left
      this.answerStatus = 'correct';
      AudioEngine.play('correct');
      AudioEngine.play('pull');
    } else {
      this.ropePosition += 60; // Pull right
      this.answerStatus = 'wrong';
      AudioEngine.play('wrong');
      AudioEngine.play('pull');
    }
  }
};
