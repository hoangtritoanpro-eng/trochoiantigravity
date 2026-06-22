const MemoryMatchGame = {
  canvas: null,
  ctx: null,
  cards: [],
  firstSelected: null,
  secondSelected: null,
  lockBoard: false,
  score: 0,
  gameState: 'PLAYING', // PLAYING, FINISHED
  cardCoords: [],
  
  // Custom Algebraic / Factoring card pairs
  pairs: [
    { left: "x² - 4", right: "(x-2)(x+2)" },
    { left: "x² - 2x + 1", right: "(x-1)²" },
    { left: "x² + 2x + 1", right: "(x+1)²" },
    { left: "3x² + 6x", right: "3x(x+2)" },
    { left: "x² - y²", right: "(x-y)(x+y)" },
    { left: "x³ - 8", right: "(x-2)(x²+2x+4)" }
  ],

  start(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.score = 0;
    this.scoreSaved = false;
    this.gameState = 'PLAYING';
    this.firstSelected = null;
    this.secondSelected = null;
    this.lockBoard = false;
    this.cardCoords = [];

    this.initializeCards();
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    this.loop();
  },

  initializeCards() {
    this.cards = [];
    
    // We create left cards and right cards
    this.pairs.forEach((pair, index) => {
      // Card A: Expression
      this.cards.push({
        id: index,
        type: 'left',
        text: pair.left,
        flipped: false,
        solved: false
      });
      // Card B: Factored Form
      this.cards.push({
        id: index,
        type: 'right',
        text: pair.right,
        flipped: false,
        solved: false
      });
    });

    // Shuffle cards
    this.cards = this.cards.sort(() => 0.5 - Math.random());
  },

  loop() {
    if (AppState.activeGame !== 'memory-match') return;
    this.update();
    this.draw();
    AppState.gameLoopId = requestAnimationFrame(this.loop.bind(this));
  },

  update() {
    // Check if all solved
    if (this.gameState === 'PLAYING') {
      const allSolved = this.cards.every(c => c.solved);
      if (allSolved) {
        this.gameState = 'FINISHED';
        AudioEngine.play('win');
        if (!this.scoreSaved) {
          AppRouter.saveScore('memory-match', this.score, 6);
          this.scoreSaved = true;
        }
      }
    }
  },

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Starry velvet space background
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#090514');
    grad.addColorStop(1, '#110c24');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Setup Grid sizing (4 cols x 3 rows)
    const cardW = 150;
    const cardH = 100;
    const cols = 4;
    const rows = 3;
    const gap = 20;

    const boardW = cols * cardW + (cols - 1) * gap;
    const boardH = rows * cardH + (rows - 1) * gap;
    
    const startX = w / 2 - boardW / 2;
    const startY = h / 2 - boardH / 2 + 10;
    
    this.cardCoords = [];

    // Draw Score
    ctx.fillStyle = '#fff';
    ctx.font = "bold 18px 'Outfit'";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`⭐ Điểm: ${this.score * 10}`, 30, 25);
    ctx.textAlign = 'right';
    ctx.fillText('Ghép cặp Hằng Đẳng Thức & Phân Tích Nhân Tử!', w - 30, 25);

    // Draw Cards
    this.cards.forEach((card, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const cx = startX + col * (cardW + gap);
      const cy = startY + row * (cardH + gap);

      this.cardCoords.push({ index: idx, x1: cx, y1: cy, x2: cx + cardW, y2: cy + cardH });

      if (card.solved) {
        // Solved cards are faint/invisible
        ctx.save();
        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
        ctx.fillRect(cx, cy, cardW, cardH);
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(cx, cy, cardW, cardH);
        ctx.restore();
        return;
      }

      ctx.save();
      
      let bg = 'rgba(30, 41, 59, 0.85)';
      let border = 'var(--border-glass)';
      let text = '';

      if (card.flipped) {
        bg = 'rgba(15, 23, 42, 0.95)';
        border = 'var(--primary)';
        text = card.text;
      } else {
        // Card Back (draw pattern)
        bg = 'linear-gradient(135deg, #1e1b4b, #311042)';
        border = 'rgba(255,255,255,0.05)';
        text = '?';
      }

      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 10;
      
      // If we have back gradient, draw it manually
      if (!card.flipped) {
        const cardGrad = ctx.createLinearGradient(cx, cy, cx + cardW, cy + cardH);
        cardGrad.addColorStop(0, '#1e1b4b');
        cardGrad.addColorStop(1, '#2e1065');
        ctx.fillStyle = cardGrad;
      } else {
        ctx.fillStyle = bg;
      }

      // Rounded rectangle card
      ctx.beginPath();
      const r = 10;
      ctx.moveTo(cx + r, cy);
      ctx.lineTo(cx + cardW - r, cy);
      ctx.quadraticCurveTo(cx + cardW, cy, cx + cardW, cy + r);
      ctx.lineTo(cx + cardW, cy + cardH - r);
      ctx.quadraticCurveTo(cx + cardW, cy + cardH, cx + cardW - r, cy + cardH);
      ctx.lineTo(cx + r, cy + cardH);
      ctx.quadraticCurveTo(cx, cy + cardH, cx, cy + cardH - r);
      ctx.lineTo(cx, cy + r);
      ctx.quadraticCurveTo(cx, cy, cx + r, cy);
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = border;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Card Text
      ctx.fillStyle = card.flipped ? '#fff' : 'var(--primary)';
      ctx.font = card.flipped ? "bold 15px 'Outfit'" : "bold 32px 'Outfit'";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, cx + cardW / 2, cy + cardH / 2);

      ctx.restore();
    });

    // End Game Screen
    if (this.gameState === 'FINISHED') {
      drawGlassCard(
        ctx,
        `🃏 HOÀN THÀNH GHÉP CẶP!\n\nĐiểm số: ${this.score * 10}/60\nClick vào màn hình để chơi lại.`,
        w / 2 - 250,
        h / 2 - 100,
        500,
        200,
        'rgba(15, 23, 42, 0.95)',
        'var(--primary)',
        '#fff',
        '22px'
      );
    }
  },

  handleClick(e) {
    if (this.gameState === 'FINISHED') {
      this.start(this.canvas);
      return;
    }
    if (this.lockBoard) return;

    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    for (const box of this.cardCoords) {
      if (mx >= box.x1 && mx <= box.x2 && my >= box.y1 && my <= box.y2) {
        const card = this.cards[box.index];
        if (!card.flipped && !card.solved) {
          this.flipCard(card);
        }
        break;
      }
    }
  },

  flipCard(card) {
    card.flipped = true;
    AudioEngine.play('click');

    if (!this.firstSelected) {
      this.firstSelected = card;
    } else {
      this.secondSelected = card;
      this.checkMatch();
    }
  },

  checkMatch() {
    this.lockBoard = true;
    const match = this.firstSelected.id === this.secondSelected.id && 
                  this.firstSelected.type !== this.secondSelected.type;

    if (match) {
      setTimeout(() => {
        this.firstSelected.solved = true;
        this.secondSelected.solved = true;
        this.score++;
        AudioEngine.play('correct');
        this.resetTurn();
      }, 500);
    } else {
      setTimeout(() => {
        this.firstSelected.flipped = false;
        this.secondSelected.flipped = false;
        AudioEngine.play('wrong');
        this.resetTurn();
      }, 1000);
    }
  },

  resetTurn() {
    this.firstSelected = null;
    this.secondSelected = null;
    this.lockBoard = false;
  }
};
