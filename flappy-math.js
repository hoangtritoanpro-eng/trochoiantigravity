const FlappyMathGame = {
  canvas: null,
  ctx: null,
  questions: [],
  currentQIdx: 0,
  score: 0,
  gameState: 'PLAYING', // PLAYING, HIT_DOOR, FINISHED

  // Physics variables
  turtleX: 150,
  turtleY: 200,
  turtleVy: 0,
  gravity: 0.35,
  jumpPower: -6.5,
  turtleRadius: 20,

  // Gate variables
  gateX: 0,
  gateWidth: 80,
  gateSpeed: 3,
  gateGapY: 0,
  gateGapHeight: 180,
  topDoorVal: '',
  botDoorVal: '',
  correctDoor: '', // 'top' or 'bottom'
  passedGate: false,

  start(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.questions = QuestionBank.getQuestions(AppState.grade, AppState.topic, 5);
    this.currentQIdx = 0;
    this.score = 0;
    this.scoreSaved = false;
    this.gameState = 'PLAYING';
    
    this.turtleY = this.canvas.height / 2;
    this.turtleVy = 0;
    this.gateX = this.canvas.width;
    this.passedGate = false;

    this.generateGate();

    // Event listener for flap (Jump)
    this.canvas.addEventListener('mousedown', this.flap.bind(this));
    window.addEventListener('keydown', this.handleKeyDown.bind(this));

    this.loop();
  },

  generateGate() {
    const currentQ = this.questions[this.currentQIdx];
    if (!currentQ) return;

    const w = this.canvas.width;
    const h = this.canvas.height;
    
    this.gateX = w;
    this.gateGapY = h * 0.3 + Math.random() * (h * 0.3); // Midpoint of gap
    this.passedGate = false;

    // A/B options doors
    const options = [0, 1];
    if (!options.includes(currentQ.ans)) {
      options[1] = currentQ.ans; // Ensure correct is in options
    }

    // Randomize which door has the correct answer
    if (Math.random() > 0.5) {
      this.topDoorVal = currentQ.options[options[0]];
      this.botDoorVal = currentQ.options[options[1]];
      this.correctDoor = options[0] === currentQ.ans ? 'top' : 'bottom';
    } else {
      this.topDoorVal = currentQ.options[options[1]];
      this.botDoorVal = currentQ.options[options[0]];
      this.correctDoor = options[1] === currentQ.ans ? 'top' : 'bottom';
    }
  },

  loop() {
    if (AppState.activeGame !== 'flappy-math') return;
    this.update();
    this.draw();
    AppState.gameLoopId = requestAnimationFrame(this.loop.bind(this));
  },

  update() {
    if (this.gameState === 'FINISHED') return;

    // Gravity pull on turtle
    this.turtleVy += this.gravity;
    this.turtleY += this.turtleVy;

    // Cap vertical position
    if (this.turtleY - this.turtleRadius < 0) {
      this.turtleY = this.turtleRadius;
      this.turtleVy = 0;
    }
    if (this.turtleY + this.turtleRadius > this.canvas.height) {
      this.turtleY = this.canvas.height - this.turtleRadius;
      this.turtleVy = 0;
    }

    // Scroll gate
    if (this.gameState === 'PLAYING') {
      this.gateX -= this.gateSpeed;

      // Gate boundary check
      if (this.gateX + this.gateWidth < 0) {
        this.currentQIdx++;
        if (this.currentQIdx >= this.questions.length) {
          this.gameState = 'FINISHED';
          AudioEngine.play('win');
          if (!this.scoreSaved) {
            AppRouter.saveScore('flappy-math', this.score, 5);
            this.scoreSaved = true;
          }
        } else {
          this.generateGate();
        }
      }

      // Check collision with gate/passages
      const insideX = (this.turtleX + this.turtleRadius > this.gateX) && 
                      (this.turtleX - this.turtleRadius < this.gateX + this.gateWidth);

      if (insideX && !this.passedGate) {
        const topLimit = this.gateGapY - this.gateGapHeight / 2;
        const botLimit = this.gateGapY + this.gateGapHeight / 2;

        const inTopDoor = this.turtleY < this.gateGapY;
        const inBotDoor = this.turtleY >= this.gateGapY;

        // Check if hit the solid walls
        const hitWall = (this.turtleY - this.turtleRadius < topLimit - 20) || 
                        (this.turtleY + this.turtleRadius > botLimit + 20);

        if (hitWall) {
          AudioEngine.play('wrong');
          this.gameState = 'HIT_DOOR';
          setTimeout(() => this.resetGateAfterFail(), 1500);
        } else {
          // Passed through one of the doors
          this.passedGate = true;
          const chosenDoor = inTopDoor ? 'top' : 'bottom';
          
          if (chosenDoor === this.correctDoor) {
            this.score++;
            AudioEngine.play('correct');
          } else {
            AudioEngine.play('wrong');
            this.gameState = 'HIT_DOOR';
            setTimeout(() => this.resetGateAfterFail(), 1500);
          }
        }
      }
    }
  },

  resetGateAfterFail() {
    this.gameState = 'PLAYING';
    this.turtleY = this.canvas.height / 2;
    this.turtleVy = 0;
    this.generateGate();
  },

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Bright daylight sky background
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#e0f2fe');
    grad.addColorStop(1, '#bae6fd');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Draw Gate and Answers
    if (this.currentQIdx < this.questions.length && this.gameState !== 'FINISHED') {
      this.drawGate(w, h);
    }

    // Draw Turtle (Cute green flappy avatar)
    ctx.save();
    ctx.shadowColor = 'rgba(16, 185, 129, 0.3)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(this.turtleX, this.turtleY, this.turtleRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(this.turtleX + 8, this.turtleY - 5, 5, 0, Math.PI * 2); // Eye
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.turtleX + 9, this.turtleY - 6, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw HUD / UI Question
    if (this.gameState === 'FINISHED') {
      this.drawEndScreen(w, h);
    } else {
      this.drawQuiz(w, h);
    }
  },

  drawGate(w, h) {
    const ctx = this.ctx;
    const topLimit = this.gateGapY - this.gateGapHeight / 2;
    const botLimit = this.gateGapY + this.gateGapHeight / 2;

    // Draw top panel (A door) - light glass style
    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
    ctx.strokeStyle = this.correctDoor === 'top' && this.passedGate ? 'var(--primary)' : 'rgba(15, 23, 42, 0.12)';
    ctx.lineWidth = 3;
    ctx.fillRect(this.gateX, 0, this.gateWidth, topLimit);
    ctx.strokeRect(this.gateX, 0, this.gateWidth, topLimit);

    // Draw bottom panel (B door) - light glass style
    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
    ctx.fillRect(this.gateX, botLimit, this.gateWidth, h - botLimit);
    ctx.strokeRect(this.gateX, botLimit, this.gateWidth, h - botLimit);

    // Door options text labels - dark for readability
    ctx.fillStyle = '#0f172a';
    ctx.font = "bold 15px 'Fredoka', sans-serif";
    ctx.textAlign = 'center';
    
    // Draw answers in doors
    ctx.fillText(this.topDoorVal, this.gateX + this.gateWidth / 2, topLimit - 25);
    ctx.fillText(this.botDoorVal, this.gateX + this.gateWidth / 2, botLimit + 35);
  },

  drawQuiz(w, h) {
    const ctx = this.ctx;
    const currentQ = this.questions[this.currentQIdx];
    if (!currentQ) return;

    // Score - slate text on light background
    ctx.fillStyle = '#0f172a';
    ctx.font = "bold 18px 'Fredoka', sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText(`⭐ Điểm: ${this.score * 10} | Câu ${this.currentQIdx + 1}/5`, 30, 35);
    
    ctx.textAlign = 'right';
    ctx.fillText('Click chuột hoặc phím Space để bay!', w - 30, 35);

    // Question
    const qW = Math.min(w * 0.7, 750);
    const qH = 75;
    drawGlassCard(ctx, currentQ.q, w / 2 - qW / 2, 80, qW, qH, 'rgba(255, 255, 255, 0.92)', 'rgba(15, 23, 42, 0.15)', '#0f172a', '18px');
  },

  drawEndScreen(w, h) {
    const ctx = this.ctx;
    drawGlassCard(
      ctx,
      `🐢 HOÀN THÀNH CHẶNG BAY!\n\nĐiểm số: ${this.score * 10}/50\nClick vào màn hình để chơi lại.`,
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

  flap(e) {
    if (this.gameState === 'FINISHED') {
      this.start(this.canvas);
      return;
    }
    if (this.gameState === 'PLAYING') {
      this.turtleVy = this.jumpPower;
      AudioEngine.play('click');
    }
  },

  handleKeyDown(e) {
    if (e.code === 'Space') {
      e.preventDefault();
      this.flap();
    }
  }
};
