const MathRacingGame = {
  canvas: null,
  ctx: null,
  questions: [],
  currentQIdx: 0,
  score: 0,
  gameState: 'PLAYING',
  
  speed: 2,
  distance: 0,
  maxDistance: 5000,
  carX: 0,
  carY: 0,
  targetX: 0,
  lanes: [], // 4 lanes
  obstacles: [],
  
  start(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.questions = QuestionBank.getQuestions(AppState.grade, AppState.topic, 5);
    this.currentQIdx = 0;
    this.score = 0;
    this.scoreSaved = false;
    this.gameState = 'PLAYING';
    
    this.speed = 3.5;
    this.distance = 0;
    
    const w = this.canvas.width;
    this.lanes = [w*0.2, w*0.4, w*0.6, w*0.8];
    this.carX = this.lanes[1];
    this.targetX = this.carX;
    this.carY = this.canvas.height - 100;
    
    this.generateObstacles();
    
    this.canvas.addEventListener('click', this.clickLane.bind(this));
    
    this.loop();
  },

  clickLane(e) {
    if (this.gameState === 'FINISHED') {
      this.start(this.canvas);
      return;
    }
    if (this.gameState !== 'PLAYING') return;
    
    const rect = this.canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    
    // Find closest lane
    let closestLaneIdx = 0;
    let minDiff = Infinity;
    for(let i=0; i<this.lanes.length; i++) {
      let diff = Math.abs(clickX - this.lanes[i]);
      if (diff < minDiff) {
        minDiff = diff;
        closestLaneIdx = i;
      }
    }
    
    this.targetX = this.lanes[closestLaneIdx];
  },

  generateObstacles() {
    this.obstacles = [];
    const currentQ = this.questions[this.currentQIdx];
    if (!currentQ) return;
    
    const optionsToShow = [0, 1, 2, 3];
    optionsToShow.forEach((optIdx, index) => {
      this.obstacles.push({
        index: optIdx,
        text: currentQ.options[optIdx],
        x: this.lanes[index],
        y: -100 - (Math.random() * 50), // slightly offset randomly
        w: 120,
        h: 50,
        hit: false
      });
    });
  },

  loop() {
    if (AppState.activeGame !== 'math-racing') return;
    this.update();
    this.draw();
    AppState.gameLoopId = requestAnimationFrame(this.loop.bind(this));
  },

  update() {
    if (this.gameState === 'FINISHED') return;
    
    // Move car towards target lane smoothly
    if (this.carX < this.targetX) this.carX += 8;
    if (this.carX > this.targetX) this.carX -= 8;
    if (Math.abs(this.carX - this.targetX) < 8) this.carX = this.targetX;
    
    this.distance += this.speed;
    
    let allObstaclesPassed = true;
    for (let obs of this.obstacles) {
      if (!obs.hit) {
        allObstaclesPassed = false;
        obs.y += this.speed;
        
        // Check collision (AABB)
        if (Math.abs(this.carX - obs.x) < (obs.w/2 + 15) && Math.abs(this.carY - obs.y) < (obs.h/2 + 25)) {
          obs.hit = true;
          this.evaluateHit(obs);
        }
        
        // Pass without hit
        if (obs.y > this.canvas.height + 50) {
          obs.hit = true;
        }
      }
    }
    
    if (allObstaclesPassed && this.gameState === 'PLAYING') {
      this.nextQuestion();
    }
  },

  evaluateHit(obs) {
    const currentQ = this.questions[this.currentQIdx];
    if (obs.index === currentQ.ans) {
      this.score++;
      this.speed = Math.min(10, this.speed + 1.5); // Speed boost!
      AudioEngine.play('correct');
      // clear others so they disappear
      this.obstacles.forEach(o => o.hit = true); 
    } else {
      this.speed = Math.max(2, this.speed - 2); // Slow down
      AudioEngine.play('wrong');
    }
  },

  nextQuestion() {
    this.currentQIdx++;
    if (this.currentQIdx >= this.questions.length) {
      this.gameState = 'FINISHED';
      AudioEngine.play('win');
      if (!this.scoreSaved) {
        AppRouter.saveScore('math-racing', this.score, 5);
        this.scoreSaved = true;
      }
    } else {
      // Delay next generation slightly for pacing
      setTimeout(() => {
        if (this.gameState === 'PLAYING') this.generateObstacles();
      }, 500);
    }
  },

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);
    
    // Grass/sides
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(0, 0, w, h);

    // Road
    ctx.fillStyle = '#334155';
    ctx.fillRect(w*0.1, 0, w*0.8, h);
    
    // Lane dividers
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 6;
    ctx.setLineDash([30, 30]);
    for (let i = 0.3; i <= 0.7; i+=0.2) {
      ctx.beginPath();
      // Moving lines effect
      ctx.moveTo(w * i, (this.distance % 60) - 60);
      ctx.lineTo(w * i, h);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    
    // Draw obstacles (Option boxes)
    for (let obs of this.obstacles) {
      if (!obs.hit) {
        ctx.fillStyle = '#f59e0b'; // orange box
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 10;
        ctx.fillRect(obs.x - obs.w/2, obs.y - obs.h/2, obs.w, obs.h);
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#ffffff';
        ctx.font = "bold 18px 'Lexend', sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(obs.text, obs.x, obs.y);
      }
    }
    
    // Draw Car
    ctx.fillStyle = '#ef4444'; // Red sports car
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 8;
    ctx.fillRect(this.carX - 25, this.carY - 40, 50, 80);
    ctx.shadowBlur = 0;
    
    // Car details (windshield)
    ctx.fillStyle = '#93c5fd';
    ctx.fillRect(this.carX - 20, this.carY - 15, 40, 20);
    
    // Headlights
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(this.carX - 20, this.carY - 40, 10, 5);
    ctx.fillRect(this.carX + 10, this.carY - 40, 10, 5);
    
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

    ctx.fillStyle = '#ffffff';
    ctx.font = "bold 18px 'Lexend', sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText(`⭐ Điểm: ${this.score * 10} | Câu ${this.currentQIdx + 1}/5`, 30, 35);
    ctx.fillText(`Tốc độ: ${Math.floor(this.speed * 20)} km/h`, 30, 60);
    
    const qW = Math.min(w * 0.7, 750);
    drawGlassCard(ctx, currentQ.q, w / 2 - qW / 2, 20, qW, 80, 'rgba(15, 23, 42, 0.85)', 'rgba(59, 130, 246, 0.6)', '#fff', '18px');
  },

  drawEndScreen(w, h) {
    const ctx = this.ctx;
    drawGlassCard(
      ctx,
      `🏁 VỀ ĐÍCH!\n\nĐiểm số: ${this.score * 10}/50\nClick để đua lại.`,
      w / 2 - 250,
      h / 2 - 100,
      500,
      200,
      'rgba(15, 23, 42, 0.95)',
      '#ef4444',
      '#fff',
      '22px'
    );
  }
};
