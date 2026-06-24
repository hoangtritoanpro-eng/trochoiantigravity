const SpaceMathGame = {
  canvas: null,
  ctx: null,
  questions: [],
  currentQIdx: 0,
  score: 0,
  gameState: 'PLAYING',
  
  shipX: 0,
  shipY: 0,
  lasers: [],
  asteroids: [],
  
  start(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.questions = QuestionBank.getQuestions(AppState.grade, AppState.topic, 5);
    this.currentQIdx = 0;
    this.score = 0;
    this.scoreSaved = false;
    this.gameState = 'PLAYING';
    
    this.shipX = this.canvas.width / 2;
    this.shipY = this.canvas.height - 150;
    this.lasers = [];
    this.generateAsteroids();
    
    this.canvas.addEventListener('mousemove', this.moveShip.bind(this));
    this.canvas.addEventListener('click', this.shoot.bind(this));
    
    this.loop();
  },

  moveShip(e) {
    if (this.gameState !== 'PLAYING') return;
    const rect = this.canvas.getBoundingClientRect();
    this.shipX = e.clientX - rect.left;
  },

  shoot(e) {
    if (this.gameState === 'FINISHED') {
      this.start(this.canvas);
      return;
    }
    if (this.gameState === 'PLAYING') {
      this.lasers.push({ x: this.shipX, y: this.shipY - 20, speed: 12 });
      AudioEngine.play('shot');
    }
  },

  generateAsteroids() {
    this.asteroids = [];
    const currentQ = this.questions[this.currentQIdx];
    if (!currentQ) return;
    
    const w = this.canvas.width;
    const optionsToShow = [0, 1, 2, 3];
    optionsToShow.forEach((optIdx, index) => {
      this.asteroids.push({
        index: optIdx,
        text: currentQ.options[optIdx],
        x: w * 0.2 + (index * w * 0.2),
        y: -50 - Math.random() * 100,
        r: 38,
        speed: 1.5 + Math.random() * 1.5,
        destroyed: false
      });
    });
  },

  loop() {
    if (AppState.activeGame !== 'space-math') return;
    this.update();
    this.draw();
    AppState.gameLoopId = requestAnimationFrame(this.loop.bind(this));
  },

  update() {
    if (this.gameState === 'FINISHED') return;
    
    // Update lasers
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      this.lasers[i].y -= this.lasers[i].speed;
      if (this.lasers[i].y < -20) {
        this.lasers.splice(i, 1);
      }
    }
    
    // Update asteroids
    let allAsteroidsGone = true;
    for (let ast of this.asteroids) {
      if (!ast.destroyed) {
        allAsteroidsGone = false;
        ast.y += ast.speed;
        
        // Check collision with lasers
        for (let i = this.lasers.length - 1; i >= 0; i--) {
          const l = this.lasers[i];
          const dx = l.x - ast.x;
          const dy = l.y - ast.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < ast.r) {
            ast.destroyed = true;
            this.lasers.splice(i, 1);
            this.evaluateHit(ast);
            break;
          }
        }
        
        // If asteroid reaches bottom, it's missed
        if (ast.y > this.canvas.height) {
          ast.destroyed = true;
        }
      }
    }
    
    if (allAsteroidsGone && this.gameState === 'PLAYING') {
      this.nextQuestion();
    }
  },

  evaluateHit(ast) {
    const currentQ = this.questions[this.currentQIdx];
    if (ast.index === currentQ.ans) {
      this.score++;
      AudioEngine.play('correct');
      // Mark all other asteroids as destroyed to skip to next question
      this.asteroids.forEach(a => a.destroyed = true);
    } else {
      AudioEngine.play('wrong');
    }
  },

  nextQuestion() {
    this.currentQIdx++;
    if (this.currentQIdx >= this.questions.length) {
      this.gameState = 'FINISHED';
      AudioEngine.play('win');
      if (!this.scoreSaved) {
        AppRouter.saveScore('space-math', this.score, 5);
        this.scoreSaved = true;
      }
    } else {
      this.generateAsteroids();
    }
  },

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);
    
    // Space Background (Bright sky)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#e0f2fe');
    bgGrad.addColorStop(1, '#bae6fd');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);
    
    // Stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 60; i++) {
      ctx.beginPath();
      // Simple pseudo-random star position that drifts down
      const sx = (Math.sin(i * 123) * 1000 + w) % w;
      const sy = (Date.now() * 0.05 + i * 200) % h;
      ctx.arc(sx, sy, (i % 3) * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw Ship
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.moveTo(this.shipX, this.shipY - 20);
    ctx.lineTo(this.shipX - 25, this.shipY + 20);
    ctx.lineTo(this.shipX + 25, this.shipY + 20);
    ctx.closePath();
    ctx.fill();
    
    // Engine flame
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(this.shipX - 10, this.shipY + 20);
    ctx.lineTo(this.shipX, this.shipY + 35 + Math.random() * 10);
    ctx.lineTo(this.shipX + 10, this.shipY + 20);
    ctx.closePath();
    ctx.fill();
    
    // Draw Lasers
    ctx.fillStyle = '#10b981';
    for (let l of this.lasers) {
      ctx.fillRect(l.x - 3, l.y, 6, 20);
    }
    
    // Draw Asteroids
    for (let ast of this.asteroids) {
      if (!ast.destroyed) {
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        // Slightly irregular asteroid shape
        ctx.arc(ast.x, ast.y, ast.r, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#0f172a';
        ctx.font = "bold 15px 'Fredoka', sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ast.text, ast.x, ast.y);
      }
    }
    
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

    ctx.fillStyle = '#0f172a';
    ctx.font = "bold 18px 'Fredoka', sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText(`⭐ Điểm: ${this.score * 10} | Câu ${this.currentQIdx + 1}/5`, 30, 35);
    
    const qW = Math.min(w * 0.7, 750);
    drawGlassCard(ctx, currentQ.q, w / 2 - qW / 2, h - 100, qW, 80, 'rgba(255, 255, 255, 0.9)', 'rgba(59, 130, 246, 0.5)', '#0f172a', '18px');
  },

  drawEndScreen(w, h) {
    const ctx = this.ctx;
    drawGlassCard(
      ctx,
      `🚀 NHIỆM VỤ HOÀN TẤT!\n\nĐiểm số: ${this.score * 10}/50\nClick để chơi lại.`,
      w / 2 - 250,
      h / 2 - 100,
      500,
      200,
      'rgba(15, 23, 42, 0.95)',
      '#3b82f6',
      '#fff',
      '22px'
    );
  }
};
