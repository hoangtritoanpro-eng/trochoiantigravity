const FlipPuzzleGame = {
  canvas: null,
  ctx: null,
  questions: [],
  secretImage: null,
  imageLoaded: false,
  grid: [], // 3x3 grid
  selectedCell: null, // active cell being solved
  score: 0,
  gameState: 'PLAYING', // PLAYING, SOLVING_QUESTION, GAME_WON
  keyword: 'THẦY TOÀN A.I',
  guessOverlay: null,
  qContainer: null,
  
  start(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.score = 0;
    this.scoreSaved = false;
    this.gameState = 'PLAYING';
    this.selectedCell = null;
    this.imageLoaded = false;

    // Load secret image
    this.secretImage = new Image();
    this.secretImage.src = 'bg_secret.png';
    this.secretImage.onload = () => {
      this.imageLoaded = true;
    };

    // Initialize 3x3 grid
    this.grid = [];
    const pool = QuestionBank.getQuestions(AppState.grade, AppState.topic, 9);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const index = r * 3 + c;
        this.grid.push({
          row: r,
          col: c,
          revealed: false,
          question: pool[index] || pool[0],
          solved: false
        });
      }
    }

    // Setup Guess HUD (HTML text input overlay)
    this.createHtmlOverlay();

    // Bind click
    this.canvas.addEventListener('click', this.handleClick.bind(this));

    // Loop
    this.loop();
  },

  createHtmlOverlay() {
    this.removeHtmlOverlay();

    const viewport = document.getElementById('gameViewport');
    
    // Guess Panel Overlay
    this.guessOverlay = document.createElement('div');
    this.guessOverlay.style.position = 'absolute';
    this.guessOverlay.style.bottom = '20px';
    this.guessOverlay.style.left = '50%';
    this.guessOverlay.style.transform = 'translateX(-50%)';
    this.guessOverlay.style.display = 'flex';
    this.guessOverlay.style.gap = '10px';
    this.guessOverlay.style.zIndex = '60';
    this.guessOverlay.innerHTML = `
      <input type="text" id="guessInput" placeholder="Đoán từ khóa ẩn..." style="padding: 10px 15px; border-radius: 8px; border: 1.5px solid var(--border-input); background: rgba(255, 255, 255, 0.9); color: var(--text-primary); width: 220px; outline: none; font-size: 14px; font-family: var(--font-body);">
      <button id="btnSubmitGuess" class="btn-primary" style="padding: 8px 16px;">Đoán</button>
    `;
    viewport.appendChild(this.guessOverlay);

    document.getElementById('btnSubmitGuess').addEventListener('click', () => {
      this.checkKeywordGuess();
    });

    // Enter key support
    document.getElementById('guessInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.checkKeywordGuess();
      }
    });
  },

  removeHtmlOverlay() {
    if (this.guessOverlay) {
      this.guessOverlay.remove();
      this.guessOverlay = null;
    }
    if (this.qContainer) {
      this.qContainer.remove();
      this.qContainer = null;
    }
  },

  loop() {
    if (AppState.activeGame !== 'flip-puzzle') {
      this.removeHtmlOverlay();
      return;
    }
    this.update();
    this.draw();
    AppState.gameLoopId = requestAnimationFrame(this.loop.bind(this));
  },

  update() {
    // Check if all grid solved
    if (this.gameState === 'PLAYING') {
      const allSolved = this.grid.every(cell => cell.solved);
      if (allSolved) {
        this.gameState = 'GAME_WON';
        AudioEngine.play('win');
        this.removeHtmlOverlay();
    }
    if (this.gameState === 'GAME_WON' && !this.scoreSaved) {
      AppRouter.saveScore('flip-puzzle', 100, 100);
      this.scoreSaved = true;
    }
  },

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Main background bright theme (Pearly bright gradient)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#f0f6ff');
    bgGrad.addColorStop(1, '#dbeafe');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Setup board sizing
    const boardSize = Math.min(w, h) * 0.7;
    const bx = w / 2 - boardSize / 2;
    const by = h / 2 - boardSize / 2 - 20;

    // Draw secret background image underneath (clipped to board)
    ctx.save();
    ctx.beginPath();
    ctx.rect(bx, by, boardSize, boardSize);
    ctx.clip();

    if (this.imageLoaded) {
      ctx.drawImage(this.secretImage, bx, by, boardSize, boardSize);
    } else {
      // Fancy gradient placeholder
      const grad = ctx.createLinearGradient(bx, by, bx + boardSize, by + boardSize);
      grad.addColorStop(0, '#0284c7');
      grad.addColorStop(0.5, '#0d9488');
      grad.addColorStop(1, '#4f46e5');
      ctx.fillStyle = grad;
      ctx.fillRect(bx, by, boardSize, boardSize);
      
      // Draw text "THẦY TOÀN A.I" inside the secret layer
      ctx.fillStyle = '#ffffff';
      ctx.font = "bold 36px 'Fredoka', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText('THẦY TOÀN A.I', bx + boardSize/2, by + boardSize/2);
    }
    ctx.restore();

    // Draw Grid covers
    const cellSize = boardSize / 3;
    this.grid.forEach(cell => {
      if (cell.solved) return; // Solved cells are fully transparent (revealed)

      const cx = bx + cell.col * cellSize;
      const cy = by + cell.row * cellSize;

      ctx.save();
      // Glass card style for grid cell (bright translucent glass)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(cx + 3, cy + 3, cellSize - 6, cellSize - 6);
      
      // Glowing cell borders
      ctx.strokeStyle = this.selectedCell === cell ? 'var(--primary)' : 'rgba(15, 23, 42, 0.12)';
      ctx.lineWidth = this.selectedCell === cell ? 3 : 1;
      ctx.strokeRect(cx + 3, cy + 3, cellSize - 6, cellSize - 6);

      // Question Number
      ctx.fillStyle = '#0f172a';
      ctx.font = "bold 18px 'Fredoka', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`Mảnh ${cell.row * 3 + cell.col + 1}`, cx + cellSize/2, cy + cellSize/2);

      ctx.restore();
    });

    // Draw overlay instruction text
    ctx.fillStyle = '#1e293b';
    ctx.font = "bold 15px 'Fredoka', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('Lật mở 9 mảnh ghép bằng câu hỏi Toán, hoặc đoán từ khóa để giành chiến thắng!', w / 2, by - 25);

    // Win condition display
    if (this.gameState === 'GAME_WON') {
      drawGlassCard(
        ctx,
        `🎉 CHIẾN THẮNG!\n\nBạn đã giải mã thành công!\nTừ khóa: ${this.keyword}`,
        w / 2 - 250,
        h / 2 - 80,
        500,
        180,
        'rgba(15, 23, 42, 0.95)',
        'var(--primary)',
        '#fff',
        '22px'
      );
    }
  },

  handleClick(e) {
    if (this.gameState !== 'PLAYING') return;

    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const w = this.canvas.width;
    const h = this.canvas.height;
    const boardSize = Math.min(w, h) * 0.7;
    const bx = w / 2 - boardSize / 2;
    const by = h / 2 - boardSize / 2 - 20;
    const cellSize = boardSize / 3;

    // Check if clicked inside grid board
    if (mx >= bx && mx <= bx + boardSize && my >= by && my <= by + boardSize) {
      const col = Math.floor((mx - bx) / cellSize);
      const row = Math.floor((my - by) / cellSize);
      const cellIndex = row * 3 + col;
      const cell = this.grid[cellIndex];

      if (cell && !cell.solved) {
        AudioEngine.play('click');
        this.selectedCell = cell;
        this.gameState = 'SOLVING_QUESTION';
        this.showQuestionOverlay(cell);
      }
    }
  },

  showQuestionOverlay(cell) {
    const viewport = document.getElementById('gameViewport');
    
    this.qContainer = document.createElement('div');
    this.qContainer.className = 'game-overlay';
    this.qContainer.style.width = 'min(500px, 90%)';
    
    let optionsHtml = cell.question.options.map((opt, i) => {
      return `<button class="btn-primary option-btn" data-index="${i}" style="width: 100%; margin-top: 5px;">${opt}</button>`;
    }).join('');

    this.qContainer.innerHTML = `
      <div style="font-weight: 800; font-size: 18px; color: var(--accent); margin-bottom: 10px;">Giải câu đố để lật mảnh</div>
      <div style="font-size: 16px; margin-bottom: 15px; line-height: 1.4;">${cell.question.q}</div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${optionsHtml}
      </div>
      <button id="btnCancelSolve" class="back-btn" style="margin-top: 15px;">Hủy bỏ</button>
    `;

    viewport.appendChild(this.qContainer);

    // Option listeners
    this.qContainer.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'));
        this.submitAnswer(idx, cell);
      });
    });

    document.getElementById('btnCancelSolve').addEventListener('click', () => {
      this.gameState = 'PLAYING';
      this.selectedCell = null;
      this.qContainer.remove();
      this.qContainer = null;
    });
  },

  submitAnswer(idx, cell) {
    if (idx === cell.question.ans) {
      AudioEngine.play('correct');
      cell.solved = true;
      this.score++;
    } else {
      AudioEngine.play('wrong');
    }
    
    this.gameState = 'PLAYING';
    this.selectedCell = null;
    if (this.qContainer) {
      this.qContainer.remove();
      this.qContainer = null;
    }
  },

  checkKeywordGuess() {
    const input = document.getElementById('guessInput');
    if (!input) return;

    const val = input.value.trim().toUpperCase();
    if (val === this.keyword) {
      this.gameState = 'GAME_WON';
      AudioEngine.play('win');
      this.removeHtmlOverlay();
    } else {
      AudioEngine.play('wrong');
      input.style.borderColor = '#ef4444';
      setTimeout(() => {
        input.style.borderColor = 'var(--border-glass)';
      }, 1000);
    }
  }
};
