const QuizClimbGame = {
  canvas: null,
  ctx: null,
  questions: [],
  currentQIdx: 0,
  score: 0,
  gameState: 'PLAYING', // PLAYING, ANSWERED, FINISHED
  selectedOption: -1,
  answeredTime: 0,
  isCorrect: false,
  hopeStarActive: false,
  hopeStarUsedThisTurn: false,
  buttonCoords: [],
  climberProgress: 0, // 0 to 5 steps
  targetProgress: 0,
  climbSpeed: 2,

  start(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.questions = QuestionBank.getQuestions(AppState.grade, AppState.topic, 5);
    this.currentQIdx = 0;
    this.score = 0;
    this.scoreSaved = false;
    this.gameState = 'PLAYING';
    this.selectedOption = -1;
    this.hopeStarActive = false;
    this.hopeStarUsedThisTurn = false;
    this.climberProgress = 0;
    this.targetProgress = 0;
    
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    this.loop();
  },

  loop() {
    if (AppState.activeGame !== 'quiz-climb') return;
    this.update();
    this.draw();
    AppState.gameLoopId = requestAnimationFrame(this.loop.bind(this));
  },

  update() {
    // Smoothly animate climber up the mountain
    if (this.climberProgress < this.targetProgress) {
      this.climberProgress += this.climbSpeed * 0.016;
      if (this.climberProgress > this.targetProgress) {
        this.climberProgress = this.targetProgress;
      }
    }

    if (this.gameState === 'ANSWERED') {
      if (Date.now() - this.answeredTime > 2000) {
        this.currentQIdx++;
        if (this.currentQIdx >= this.questions.length) {
          this.gameState = 'FINISHED';
          if (this.climberProgress >= 5) {
            AudioEngine.play('win');
          }
          if (!this.scoreSaved) {
            AppRouter.saveScore('quiz-climb', this.score, 5);
            this.scoreSaved = true;
          }
        } else {
          this.gameState = 'PLAYING';
          this.selectedOption = -1;
          this.hopeStarActive = false;
          this.hopeStarUsedThisTurn = false;
        }
      }
    }
  },

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    // 1. Draw Mountain Background (Bright daylight sky)
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#bae6fd'); // bright sky blue
    grad.addColorStop(0.6, '#e0f2fe'); // light sky blue
    grad.addColorStop(1, '#f0f9ff'); // soft whitish blue
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Draw Mountain Silhouette (Light green mountain)
    ctx.fillStyle = '#a7f3d0';
    ctx.beginPath();
    ctx.moveTo(w * 0.1, h * 0.85);
    ctx.lineTo(w * 0.5, h * 0.15); // Summit
    ctx.lineTo(w * 0.9, h * 0.85);
    ctx.closePath();
    ctx.fill();

    // 2. Draw Milestones (Checkpoints 0 to 5)
    ctx.strokeStyle = 'var(--primary)';
    ctx.lineWidth = 4;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    for (let i = 0; i <= 5; i++) {
      const t = i / 5;
      const mx = w * 0.1 + (w * 0.4) * t;
      const my = h * 0.85 - (h * 0.7) * t;
      if (i === 0) ctx.moveTo(mx, my);
      else ctx.lineTo(mx, my);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Checkpoint nodes
    for (let i = 0; i <= 5; i++) {
      const t = i / 5;
      const mx = w * 0.1 + (w * 0.4) * t;
      const my = h * 0.85 - (h * 0.7) * t;
      ctx.fillStyle = this.climberProgress >= i ? 'var(--primary)' : '#64748b';
      ctx.beginPath();
      ctx.arc(mx, my, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Draw Climber Avatar
    const ct = this.climberProgress / 5;
    const cx = w * 0.1 + (w * 0.4) * ct;
    const cy = h * 0.85 - (h * 0.7) * ct - 15;
    ctx.fillStyle = '#eab308'; // Friendly yellow climber
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fill();
    // Label
    ctx.fillStyle = '#0f172a';
    ctx.font = "bold 12px 'Fredoka', sans-serif";
    ctx.fillText('Bạn', cx, cy - 18);

    // Summit Flag
    const sx = w * 0.5;
    const sy = h * 0.15;
    ctx.fillStyle = '#ef4444'; // Red flag
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + 20, sy - 10);
    ctx.lineTo(sx, sy - 20);
    ctx.closePath();
    ctx.fill();

    // 4. Draw Quiz Overlay
    if (this.gameState === 'FINISHED') {
      this.drawEndScreen(w, h);
    } else {
      this.drawQuiz(w, h);
    }
  },

  drawQuiz(w, h) {
    const ctx = this.ctx;
    const currentQ = this.questions[this.currentQIdx];
    if (!currentQ) return;

    // Hope Star Button (Only selectable in PLAYING state)
    const starW = 160;
    const starH = 45;
    const starX = w - starW - 30;
    const starY = 90;
    
    let starBg = 'rgba(255, 255, 255, 0.85)';
    let starBorder = 'rgba(15, 23, 42, 0.12)';
    let starText = '⭐ Ngôi Sao Hy Vọng';
    
    if (this.hopeStarActive) {
      starBg = 'rgba(234, 179, 8, 0.2)';
      starBorder = '#eab308';
    }

    drawGlassCard(ctx, starText, starX, starY, starW, starH, starBg, starBorder, '#fff', '13px');
    this.starBtnCoords = { x1: starX, y1: starY, x2: starX + starW, y2: starY + starH };

    // Score indicator
    ctx.fillStyle = '#0f172a';
    ctx.font = "bold 20px 'Fredoka', sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText(`🏆 Điểm số: ${this.score * 20}`, 30, 40);

    // Question
    const qW = Math.min(w * 0.8, 900);
    const qH = 90;
    const qX = w / 2 - qW / 2;
    const qY = 150;
    drawGlassCard(ctx, currentQ.q, qX, qY, qW, qH, 'var(--bg-panel)', 'var(--border-glass)', '#fff', '20px');

    // Options Grid
    const btnW = qW / 2 - 15;
    const btnH = 65;
    const optY = qY + qH + 20;
    this.buttonCoords = [];

    for (let i = 0; i < 4; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = qX + col * (btnW + 30);
      const by = optY + row * (btnH + 15);

      let bg = 'rgba(255, 255, 255, 0.85)';
      let border = 'var(--border-glass)';
      let textCol = '#0f172a';

      if (this.gameState === 'ANSWERED') {
        if (i === currentQ.ans) {
          bg = '#10b981';
          border = '#10b981';
          textCol = '#fff';
        } else if (i === this.selectedOption) {
          bg = '#ef4444';
          border = '#ef4444';
          textCol = '#fff';
        }
      } else {
        if (i === this.selectedOption) {
          bg = 'rgba(16, 185, 129, 0.15)';
          border = 'var(--primary)';
        }
      }

      drawGlassCard(ctx, currentQ.options[i], bx, by, btnW, btnH, bg, border, textCol, '16px');
      this.buttonCoords.push({ index: i, x1: bx, y1: by, x2: bx + btnW, y2: by + btnH });
    }
  },

  drawEndScreen(w, h) {
    const ctx = this.ctx;
    const isWin = this.climberProgress >= 5;
    const text = isWin ? '🏆 LEO NÚI THÀNH CÔNG!' : '🏔️ CHƯA THỂ CHINH PHỤC ĐỈNH NÚI!';
    const border = isWin ? 'var(--primary)' : '#ef4444';
    
    drawGlassCard(
      ctx,
      `${text}\n\nĐiểm số: ${this.score * 20}/100\nNhấn vào màn hình để chơi lại.`,
      w / 2 - 250,
      h / 2 - 100,
      500,
      200,
      'rgba(15, 23, 42, 0.95)',
      border,
      '#fff',
      '22px'
    );
  },

  handleClick(e) {
    if (this.gameState === 'FINISHED') {
      this.start(this.canvas);
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (this.gameState === 'PLAYING') {
      // Check hope star button click
      const star = this.starBtnCoords;
      if (mx >= star.x1 && mx <= star.x2 && my >= star.y1 && my <= star.y2) {
        if (!this.hopeStarUsedThisTurn) {
          this.hopeStarActive = !this.hopeStarActive;
          AudioEngine.play('click');
        }
        return;
      }

      // Check options grid buttons click
      for (const btn of this.buttonCoords) {
        if (mx >= btn.x1 && mx <= btn.x2 && my >= btn.y1 && my <= btn.y2) {
          this.handleAnswer(btn.index);
          break;
        }
      }
    }
  },

  handleAnswer(optIndex) {
    this.gameState = 'ANSWERED';
    this.selectedOption = optIndex;
    this.answeredTime = Date.now();
    this.hopeStarUsedThisTurn = true;

    const currentQ = this.questions[this.currentQIdx];
    const pointsGained = this.hopeStarActive ? 2 : 1;

    if (optIndex === currentQ.ans) {
      this.isCorrect = true;
      this.score += pointsGained;
      this.targetProgress = Math.min(5, this.climberProgress + pointsGained);
      AudioEngine.play('correct');
    } else {
      this.isCorrect = false;
      this.targetProgress = Math.max(0, this.climberProgress - pointsGained);
      AudioEngine.play('wrong');
    }
  }
};
