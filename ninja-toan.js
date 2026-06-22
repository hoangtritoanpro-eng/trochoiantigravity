const NinjaToanGame = {
  canvas: null,
  ctx: null,
  questions: [],
  currentQIdx: 0,
  score: 0,
  gameState: 'PLAYING', // PLAYING, ANSWERED, FINISHED
  selectedOption: '', // 'A' or 'B'
  answeredTime: 0,
  isCorrect: false,
  hands: null,
  camera: null,
  stream: null,
  fingerX: 0,
  fingerY: 0,
  handActive: false,

  start(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.questions = QuestionBank.getQuestions(AppState.grade, AppState.topic, 5);
    this.currentQIdx = 0;
    this.score = 0;
    this.gameState = 'PLAYING';
    this.selectedOption = '';
    this.scoreSaved = false;
    this.fingerX = 0;
    this.fingerY = 0;
    this.handActive = false;

    // Show loading text overlay on canvas
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = "bold 20px 'Outfit', sans-serif";
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Đang kết nối camera và khởi chạy mô hình AI...', this.canvas.width/2, this.canvas.height/2);

    // Initialize Camera and MediaPipe
    this.initCamera();

    // Mouse fallback listeners (in case camera is not accessible or hand not detected)
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));

    // Run loop
    this.loop();
  },

  initCamera() {
    const video = document.getElementById('webcam');
    
    // Initialize MediaPipe Hands
    this.hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7
    });

    this.hands.onResults(this.onResults.bind(this));

    // Request webcam access
    navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } })
      .then(stream => {
        this.stream = stream;
        window.cameraStream = stream; // Reference to stop it later
        video.srcObject = stream;
        video.play();

        // Create camera frame loop
        const onFrame = async () => {
          if (AppState.activeGame !== 'ninja-toan') return;
          try {
            await this.hands.send({ image: video });
          } catch (e) {
            console.error('MediaPipe error:', e);
          }
          requestAnimationFrame(onFrame);
        };
        requestAnimationFrame(onFrame);
      })
      .catch(err => {
        console.warn('Webcam access denied. Mouse fallback active.', err);
      });
  },

  onResults(results) {
    if (AppState.activeGame !== 'ninja-toan') return;

    const w = this.canvas.width;
    const h = this.canvas.height;

    // Reset hand detection flag
    this.handActive = false;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      this.handActive = true;
      const indexFinger = results.multiHandLandmarks[0][8]; // Tip of Index Finger
      
      // Calculate coordinates with mirror flip
      this.fingerX = (1 - indexFinger.x) * w;
      this.fingerY = indexFinger.y * h;

      // Draw hand skeleton underneath if needed (optional overlay)
      this.drawHandOverlay(results.multiHandLandmarks[0]);
    }
  },

  drawHandOverlay(landmarks) {
    // Optional utility: draw thin green outline on index finger path
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    
    ctx.save();
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    // Trace index finger landmarks: 5, 6, 7, 8
    const f5 = landmarks[5];
    const f8 = landmarks[8];
    ctx.moveTo((1 - f5.x) * w, f5.y * h);
    ctx.lineTo((1 - f8.x) * w, f8.y * h);
    ctx.stroke();
    ctx.restore();
  },

  loop() {
    if (AppState.activeGame !== 'ninja-toan') {
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }
      return;
    }
    this.update();
    this.draw();
    AppState.gameLoopId = requestAnimationFrame(this.loop.bind(this));
  },

  update() {
    if (this.gameState === 'ANSWERED') {
      if (Date.now() - this.answeredTime > 2000) {
        this.currentQIdx++;
        if (this.currentQIdx >= this.questions.length) {
          this.gameState = 'FINISHED';
          AudioEngine.play('win');
          if (!this.scoreSaved) {
            AppRouter.saveScore('ninja-toan', this.score, 5);
            this.scoreSaved = true;
          }
        } else {
          this.gameState = 'PLAYING';
          this.selectedOption = '';
        }
      }
    }
  },

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    // 1. Draw Camera view or bright fallback
    const video = document.getElementById('webcam');
    ctx.save();
    if (this.stream && video.readyState === video.HAVE_ENOUGH_DATA) {
      // Draw mirrored video frame as backdrop
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, w, h);
    } else {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#f0f6ff');
      bgGrad.addColorStop(1, '#dbeafe');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#475569';
      ctx.font = "bold 15px 'Fredoka', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText('(Không thể kết nối camera - Chế độ mô phỏng Chuột đang hoạt động)', w/2, h/2 - 50);
    }
    ctx.restore();

    // 2. Draw HUD (Header / Score - Light glass style)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(0, 0, w, 70);
    ctx.fillStyle = '#0f172a';
    ctx.font = "bold 20px 'Fredoka', sans-serif";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`⭐ ĐIỂM SỐ: ${this.score * 10} | Câu ${Math.min(this.currentQIdx + 1, this.questions.length)}/5`, 30, 35);
    ctx.textAlign = 'right';
    ctx.fillText('NINJA TOÁN HỌC AI', w - 30, 35);

    if (this.currentQIdx < this.questions.length) {
      const q = this.questions[this.currentQIdx];

      // Sizing of A/B cards
      const boxW = Math.min(320, w / 4);
      const boxH = Math.min(240, h / 3);
      const boxY = h / 2 - boxH / 2 + 30;

      let colorA = 'rgba(14, 165, 233, 0.85)';
      let colorB = 'rgba(14, 165, 233, 0.85)';

      if (this.gameState === 'ANSWERED') {
        if (this.selectedOption === 'A') colorA = this.isCorrect ? '#10b981' : '#ef4444';
        if (this.selectedOption === 'B') colorB = this.isCorrect ? '#10b981' : '#ef4444';
      }

      // Draw Answer Card A (Left)
      drawGlassCard(ctx, `A\n\n${q.options[0]}`, 30, boxY, boxW, boxH, colorA, '#fff', '#fff', '20px');

      // Draw Answer Card B (Right)
      drawGlassCard(ctx, `B\n\n${q.options[1]}`, w - boxW - 30, boxY, boxW, boxH, colorB, '#fff', '#fff', '20px');

      // Draw Question Card (Center Top - Light glass card)
      const qW = w * 0.55;
      const qH = 90;
      drawGlassCard(ctx, q.q, w / 2 - qW / 2, 90, qW, qH, 'rgba(255, 255, 255, 0.9)', 'var(--primary)', '#0f172a', '22px');

      // 3. Draw Laser Cursor at Index Finger position
      if (this.handActive || (!this.stream && this.fingerX > 0)) {
        ctx.save();
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.arc(this.fingerX, this.fingerY, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();

        // Perform hit test collision
        if (this.gameState === 'PLAYING') {
          // Check collision with Box A
          if (this.fingerX > 30 && this.fingerX < 30 + boxW && this.fingerY > boxY && this.fingerY < boxY + boxH) {
            this.handleSelection('A', q);
          }
          // Check collision with Box B
          else if (this.fingerX > w - boxW - 30 && this.fingerX < w - 30 && this.fingerY > boxY && this.fingerY < boxY + boxH) {
            this.handleSelection('B', q);
          }
        }
      }
    } else {
      // Completed Screen
      drawGlassCard(
        ctx,
        `🏆 HOÀN THÀNH BÀI THI!\nĐiểm số: ${this.score * 10}/50\nCảm ơn bạn đã trải nghiệm.`,
        w / 2 - 250,
        h / 2 - 100,
        500,
        200,
        'rgba(15, 23, 42, 0.9)',
        'var(--primary)',
        '#fff',
        '22px'
      );
    }
  },

  handleSelection(ans, q) {
    this.selectedOption = ans;
    this.gameState = 'ANSWERED';
    this.answeredTime = Date.now();

    // Correct index check (A = options[0], B = options[1])
    const optIdx = ans === 'A' ? 0 : 1;
    if (optIdx === q.ans) {
      this.isCorrect = true;
      this.score++;
      AudioEngine.play('correct');
    } else {
      this.isCorrect = false;
      AudioEngine.play('wrong');
    }
  },

  handleMouseMove(e) {
    // Mouse emulator in case webcam has no active tracking
    if (this.stream) return; // Keep hand tracking primary if active
    const rect = this.canvas.getBoundingClientRect();
    this.fingerX = e.clientX - rect.left;
    this.fingerY = e.clientY - rect.top;
  },

  handleMouseDown(e) {
    if (this.gameState === 'FINISHED') {
      this.start(this.canvas);
    }
  }
};
