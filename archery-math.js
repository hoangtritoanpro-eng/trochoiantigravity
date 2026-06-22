const ArcheryMathGame = {
  canvas: null,
  ctx: null,
  questions: [],
  currentQIdx: 0,
  score: 0,
  gameState: 'PLAYING', // PLAYING, ARROW_FLYING, FINISHED

  // Bow & Arrow position
  bowX: 120,
  bowY: 0, // dynamic
  arrowX: 120,
  arrowY: 0,
  arrowVx: 0,
  arrowVy: 0,
  gravity: 0.28,

  isAiming: false,
  dragStartX: 0,
  dragStartY: 0,
  dragCurrentX: 0,
  dragCurrentY: 0,

  targets: [],
  selectedTarget: null,
  shotDelayTimer: 0,

  start(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.questions = QuestionBank.getQuestions(AppState.grade, AppState.topic, 5);
    this.currentQIdx = 0;
    this.score = 0;
    this.scoreSaved = false;
    this.gameState = 'PLAYING';
    
    this.bowY = this.canvas.height * 0.65;
    this.arrowX = this.bowX;
    this.arrowY = this.bowY;
    this.isAiming = false;
    this.selectedTarget = null;
    
    this.generateTargets();
    
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    
    this.loop();
  },

  generateTargets() {
    this.targets = [];
    const currentQ = this.questions[this.currentQIdx];
    if (!currentQ) return;

    const w = this.canvas.width;
    const h = this.canvas.height;
    
    // We create 3 target boards on the right side
    const optionsToShow = [0, 1, 2];
    if (!optionsToShow.includes(currentQ.ans)) {
      optionsToShow[2] = currentQ.ans;
    }

    const startY = h * 0.3;
    const spacing = h * 0.2;
    optionsToShow.forEach((optIdx, index) => {
      this.targets.push({
        index: optIdx,
        text: currentQ.options[optIdx],
        x: w * 0.82,
        y: startY + index * spacing,
        r: 45,
        hit: false,
        oscOffset: Math.random() * 100 // Target float oscillation
      });
    });
  },

  loop() {
    if (AppState.activeGame !== 'archery-math') return;
    this.update();
    this.draw();
    AppState.gameLoopId = requestAnimationFrame(this.loop.bind(this));
  },

  update() {
    if (this.gameState === 'FINISHED') return;

    // Float targets up and down slightly
    const time = Date.now() * 0.003;
    this.targets.forEach(target => {
      if (!target.hit) {
        target.y += Math.sin(time + target.oscOffset) * 0.5;
      }
    });

    // Arrow flying physics
    if (this.gameState === 'ARROW_FLYING') {
      this.arrowX += this.arrowVx;
      this.arrowY += this.arrowVy;
      this.arrowVy += this.gravity; // Gravity pull

      // Collision detection with targets
      for (const target of this.targets) {
        if (target.hit) continue;
        const dx = this.arrowX - target.x;
        const dy = this.arrowY - target.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < target.r) {
          target.hit = true;
          this.evaluateHitTarget(target);
          break;
        }
      }

      // Check boundary / miss
      if (this.arrowX > this.canvas.width || this.arrowY > this.canvas.height || this.arrowX < 0) {
        this.resetArrow();
      }
    }
  },

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Bright daylight sky background
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#bae6fd');
    grad.addColorStop(1, '#f0f9ff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Draw Bow (Left)
    this.drawBow(w, h);

    // Draw Targets (Right)
    this.targets.forEach(target => {
      if (target.hit) return;

      ctx.save();
      ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
      ctx.shadowBlur = 5;
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.15)';
      ctx.lineWidth = 3;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(target.x, target.y, target.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Red inner circle
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(target.x, target.y, target.r * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Text label
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff'; // white text on red circle
      ctx.font = "bold 13px 'Fredoka', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(target.text, target.x, target.y);
      ctx.restore();
    });

    // Draw Arrow if flying
    if (this.gameState === 'ARROW_FLYING') {
      this.drawArrow();
    }

    // Draw HUD / UI Question
    if (this.gameState === 'FINISHED') {
      this.drawEndScreen(w, h);
    } else {
      this.drawQuiz(w, h);
    }
  },

  drawBow(w, h) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = '#854d0e'; // warm brown wooden bow
    ctx.lineWidth = 4;
    ctx.beginPath();

    // Arc bow body
    ctx.arc(this.bowX, this.bowY, 40, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();

    // Draw Bowstring
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    
    const stringTopX = this.bowX + Math.cos(-Math.PI / 3) * 40;
    const stringTopY = this.bowY + Math.sin(-Math.PI / 3) * 40;
    const stringBotX = this.bowX + Math.cos(Math.PI / 3) * 40;
    const stringBotY = this.bowY + Math.sin(Math.PI / 3) * 40;
    
    ctx.moveTo(stringTopX, stringTopY);
    if (this.isAiming) {
      // Pull bow string back to current drag point
      ctx.lineTo(this.dragCurrentX, this.dragCurrentY);
      ctx.lineTo(stringBotX, stringBotY);
    } else {
      ctx.lineTo(stringBotX, stringBotY);
    }
    ctx.stroke();

    // Draw Aiming Line (dotted trajectory line)
    if (this.isAiming) {
      const dx = this.dragStartX - this.dragCurrentX;
      const dy = this.dragStartY - this.dragCurrentY;
      const power = Math.min(Math.sqrt(dx * dx + dy * dy) * 0.1, 15);
      const angle = Math.atan2(dy, dx);

      let tx = this.bowX;
      let ty = this.bowY;
      let tvx = Math.cos(angle) * power;
      let tvy = Math.sin(angle) * power;

      ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      for (let i = 0; i < 30; i++) {
        tx += tvx;
        ty += tvy;
        tvy += this.gravity;
        ctx.lineTo(tx, ty);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  },

  drawArrow() {
    const ctx = this.ctx;
    const angle = Math.atan2(this.arrowVy, this.arrowVx);
    
    ctx.save();
    ctx.translate(this.arrowX, this.arrowY);
    ctx.rotate(angle);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-25, 0);
    ctx.lineTo(15, 0);
    ctx.stroke();

    // Arrow feather fletching
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(-25, 0);
    ctx.lineTo(-30, -6);
    ctx.lineTo(-20, 0);
    ctx.lineTo(-30, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },

  drawQuiz(w, h) {
    const ctx = this.ctx;
    const currentQ = this.questions[this.currentQIdx];
    if (!currentQ) return;

    // Score
    ctx.fillStyle = '#0f172a';
    ctx.font = "bold 18px 'Fredoka', sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText(`⭐ Điểm: ${this.score * 10} | Câu ${this.currentQIdx + 1}/5`, 30, 35);
    
    ctx.textAlign = 'right';
    ctx.fillText('Kéo và thả để ngắm bắn!', w - 30, 35);

    // Question
    const qW = Math.min(w * 0.7, 750);
    const qH = 75;
    drawGlassCard(ctx, currentQ.q, w / 2 - qW / 2, 90, qW, qH, 'rgba(255, 255, 255, 0.92)', 'rgba(15, 23, 42, 0.15)', '#0f172a', '18px');
  },

  drawEndScreen(w, h) {
    const ctx = this.ctx;
    drawGlassCard(
      ctx,
      `🏹 BẮN CUNG HOÀN TẤT!\n\nĐiểm số: ${this.score * 10}/50\nClick vào màn hình để chơi lại.`,
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

  handleMouseDown(e) {
    if (this.gameState === 'FINISHED') {
      this.start(this.canvas);
      return;
    }
    if (this.gameState !== 'PLAYING') return;

    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Check if clicked near bow to start drag
    const dist = Math.sqrt((mx - this.bowX) * (mx - this.bowX) + (my - this.bowY) * (my - this.bowY));
    if (dist < 80) {
      this.isAiming = true;
      this.dragStartX = this.bowX;
      this.dragStartY = this.bowY;
      this.dragCurrentX = mx;
      this.dragCurrentY = my;
      AudioEngine.play('click');
    }
  },

  handleMouseMove(e) {
    if (!this.isAiming) return;
    const rect = this.canvas.getBoundingClientRect();
    this.dragCurrentX = e.clientX - rect.left;
    this.dragCurrentY = e.clientY - rect.top;
  },

  handleMouseUp(e) {
    if (!this.isAiming) return;
    this.isAiming = false;

    // Launch arrow
    const dx = this.dragStartX - this.dragCurrentX;
    const dy = this.dragStartY - this.dragCurrentY;
    const power = Math.min(Math.sqrt(dx * dx + dy * dy) * 0.1, 15);
    const angle = Math.atan2(dy, dx);

    // Set arrow velocity vector
    this.arrowVx = Math.cos(angle) * power;
    this.arrowVy = Math.sin(angle) * power;
    this.arrowX = this.bowX;
    this.arrowY = this.bowY;
    this.gameState = 'ARROW_FLYING';
    AudioEngine.play('shot');
  },

  evaluateHitTarget(target) {
    const currentQ = this.questions[this.currentQIdx];
    if (target.index === currentQ.ans) {
      this.score++;
      AudioEngine.play('correct');
    } else {
      AudioEngine.play('wrong');
    }

    setTimeout(() => {
      this.currentQIdx++;
      if (this.currentQIdx >= this.questions.length) {
        this.gameState = 'FINISHED';
        AudioEngine.play('win');
        if (!this.scoreSaved) {
          AppRouter.saveScore('archery-math', this.score, 5);
          this.scoreSaved = true;
        }
      } else {
        this.generateTargets();
        this.resetArrow();
      }
    }, 1000);
  },

  resetArrow() {
    this.gameState = 'PLAYING';
    this.arrowX = this.bowX;
    this.arrowY = this.bowY;
    this.arrowVx = 0;
    this.arrowVy = 0;
  }
};
