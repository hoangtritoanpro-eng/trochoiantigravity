const GoldMinerGame = {
  canvas: null,
  ctx: null,
  questions: [],
  currentQIdx: 0,
  score: 0,
  gameState: 'PLAYING', // PLAYING, RETRACTING, FINISHED
  minerX: 0,
  minerY: 0,
  
  // Pendulum variables
  hookAngle: 0,
  hookSpeed: 2, // Speed of swinging
  hookLength: 40,
  maxHookLength: 400,
  hookState: 'SWINGING', // SWINGING, SHOOTING, RETRACTING
  hookX: 0,
  hookY: 0,
  shootSpeed: 10,
  
  nuggets: [],
  selectedNugget: null,

  start(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.questions = QuestionBank.getQuestions(AppState.grade, AppState.topic, 5);
    this.currentQIdx = 0;
    this.score = 0;
    this.scoreSaved = false;
    this.gameState = 'PLAYING';
    
    this.minerX = this.canvas.width / 2;
    this.minerY = 70;
    
    this.hookAngle = 0;
    this.hookLength = 40;
    this.hookState = 'SWINGING';
    
    this.nuggets = [];
    this.generateNuggets();
    
    this.canvas.addEventListener('click', this.shootHook.bind(this));
    this.loop();
  },

  generateNuggets() {
    this.nuggets = [];
    const currentQ = this.questions[this.currentQIdx];
    if (!currentQ) return;

    const w = this.canvas.width;
    const h = this.canvas.height;
    
    // We create 3 nuggets representing Options 0, 1, 2 (or correct + 2 random options)
    const optionsToShow = [0, 1, 2]; // For simplicity, show options A, B, C
    if (!optionsToShow.includes(currentQ.ans)) {
      optionsToShow[2] = currentQ.ans; // Make sure correct answer is always present
    }

    const cols = [w * 0.25, w * 0.5, w * 0.75];
    optionsToShow.forEach((optIdx, index) => {
      this.nuggets.push({
        index: optIdx,
        text: currentQ.options[optIdx],
        x: cols[index],
        y: h * 0.65 + (index % 2 === 0 ? 30 : -30),
        r: 50,
        grabbed: false
      });
    });
  },

  loop() {
    if (AppState.activeGame !== 'gold-miner') return;
    this.update();
    this.draw();
    AppState.gameLoopId = requestAnimationFrame(this.loop.bind(this));
  },

  update() {
    if (this.gameState === 'FINISHED') return;

    // Swing logic
    if (this.hookState === 'SWINGING') {
      const time = Date.now() * 0.0025;
      this.hookAngle = Math.sin(time) * 1.1; // Oscillate between -65 and +65 degrees
      this.hookX = this.minerX + Math.sin(this.hookAngle) * this.hookLength;
      this.hookY = this.minerY + Math.cos(this.hookAngle) * this.hookLength;
    } 
    // Shoot logic
    else if (this.hookState === 'SHOOTING') {
      this.hookLength += this.shootSpeed;
      this.hookX = this.minerX + Math.sin(this.hookAngle) * this.hookLength;
      this.hookY = this.minerY + Math.cos(this.hookAngle) * this.hookLength;

      // Check collision with nuggets
      for (const nugget of this.nuggets) {
        const dx = this.hookX - nugget.x;
        const dy = this.hookY - nugget.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nugget.r) {
          this.hookState = 'RETRACTING';
          nugget.grabbed = true;
          this.selectedNugget = nugget;
          break;
        }
      }

      // Check boundary limits
      if (this.hookLength >= this.maxHookLength || this.hookX < 0 || this.hookX > this.canvas.width || this.hookY > this.canvas.height) {
        this.hookState = 'RETRACTING';
      }
    } 
    // Retract logic
    else if (this.hookState === 'RETRACTING') {
      this.hookLength -= this.shootSpeed * (this.selectedNugget ? 0.65 : 1.2); // Slower if holding heavy gold
      if (this.hookLength <= 40) {
        this.hookLength = 40;
        this.hookState = 'SWINGING';

        // Check answer if nugget grabbed
        if (this.selectedNugget) {
          this.evaluateGrabbedNugget(this.selectedNugget);
          this.selectedNugget = null;
        }
      }
      this.hookX = this.minerX + Math.sin(this.hookAngle) * this.hookLength;
      this.hookY = this.minerY + Math.cos(this.hookAngle) * this.hookLength;
    }
  },

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Deep underground cave background
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1e293b');
    grad.addColorStop(1, '#0b0f19');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Draw underground ground divider
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(0, h * 0.45, w, h * 0.55);

    // Miner head/avatar at top
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(this.minerX, this.minerY - 15, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = "bold 12px 'Outfit'";
    ctx.textAlign = 'center';
    ctx.fillText('Đào Vàng AI', this.minerX, this.minerY - 42);

    // Draw Rope/Line and Hook
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(this.minerX, this.minerY);
    ctx.lineTo(this.hookX, this.hookY);
    ctx.stroke();

    // Hook tip (Anchor shape)
    ctx.save();
    ctx.translate(this.hookX, this.hookY);
    ctx.rotate(-this.hookAngle);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI);
    ctx.stroke();
    ctx.restore();

    // Draw Nuggets
    this.nuggets.forEach(nugget => {
      const nx = nugget.grabbed ? this.hookX : nugget.x;
      const ny = nugget.grabbed ? this.hookY + 25 : nugget.y;

      ctx.save();
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      // Irregular rock shape using arc
      ctx.arc(nx, ny, nugget.r, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw inner answer text on gold rock
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#0f172a';
      ctx.font = "bold 14px 'Inter'";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Wrap text in gold nugget if needed
      const words = nugget.text.split(' ');
      ctx.fillText(nugget.text, nx, ny);
      ctx.restore();
    });

    // Draw HUD & Question Card
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

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = "bold 18px 'Outfit'";
    ctx.textAlign = 'left';
    ctx.fillText(`⭐ Điểm: ${this.score * 10} | Câu ${this.currentQIdx + 1}/5`, 30, 35);
    
    ctx.textAlign = 'right';
    ctx.fillText('Click chuột để phóng móc cẩu!', w - 30, 35);

    // Question Box (Floating)
    const qW = Math.min(w * 0.7, 750);
    const qH = 75;
    drawGlassCard(ctx, currentQ.q, w / 2 - qW / 2, 110, qW, qH, 'var(--bg-panel)', 'var(--border-glass)', '#fff', '18px');
  },

  drawEndScreen(w, h) {
    const ctx = this.ctx;
    drawGlassCard(
      ctx,
      `⛏️ ĐÀO VÀNG HOÀN TẤT!\n\nĐiểm số: ${this.score * 10}/50\nClick vào màn hình để chơi lại.`,
      w / 2 - 250,
      h / 2 - 100,
      500,
      200,
      'rgba(15, 23, 42, 0.95)',
      'var(--primary)',
      '#fff',
      '22px'
    );
  },

  shootHook(e) {
    if (this.gameState === 'FINISHED') {
      this.start(this.canvas);
      return;
    }
    if (this.hookState === 'SWINGING') {
      this.hookState = 'SHOOTING';
      AudioEngine.play('shot');
    }
  },

  evaluateGrabbedNugget(nugget) {
    const currentQ = this.questions[this.currentQIdx];
    if (nugget.index === currentQ.ans) {
      this.score++;
      AudioEngine.play('correct');
    } else {
      AudioEngine.play('wrong');
    }

    // Go to next question
    this.currentQIdx++;
    if (this.currentQIdx >= this.questions.length) {
      this.gameState = 'FINISHED';
      AudioEngine.play('win');
      if (!this.scoreSaved) {
        AppRouter.saveScore('gold-miner', this.score, 5);
        this.scoreSaved = true;
      }
    } else {
      this.generateNuggets();
    }
  }
};
