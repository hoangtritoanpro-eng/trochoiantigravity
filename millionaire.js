const MilAudio = {
  audioCtx: null,
  introTimer: null,
  audioCorrect: new Audio('amthanhdung.mp3'),
  audioWrong: new Audio('amthanhsai.mp3'),

  init() {
    this.audioCorrect.volume = 0.9;
    this.audioWrong.volume = 0.85;
  },

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  },
  
  playIntro(onFinished) {
    if (typeof AppState !== 'undefined' && !AppState.soundEnabled) {
      if (onFinished) onFinished();
      return;
    }
    this.stopAll();
    this.synthReveal();
    if (onFinished) this.introTimer = setTimeout(() => onFinished(), 800);
  },

  fadeIntroToBg() {},
  playBg() {},
  pauseBg() {},
  resumeBg() {},

  stopAll() {
    if (this.introTimer) { clearTimeout(this.introTimer); this.introTimer = null; }
    this.audioCorrect.pause();
    this.audioWrong.pause();
  },

  playLockAnswer() {
    if (typeof AppState !== 'undefined' && !AppState.soundEnabled) return;
    this.synthLockAnswer();
  },

  playCorrect(isMilestone = false) {
    if (typeof AppState !== 'undefined' && !AppState.soundEnabled) return;
    this.audioCorrect.currentTime = 0;
    this.audioCorrect.play().catch(e => console.log('Audio play failed:', e));

    if (isMilestone) {
      setTimeout(() => this.synthApplause(2.5), 500);
    }
  },

  playWrong() {
    if (typeof AppState !== 'undefined' && !AppState.soundEnabled) return;
    this.audioWrong.currentTime = 0;
    this.audioWrong.play().catch(e => console.log('Audio play failed:', e));
  },

  playEnding() {
    if (typeof AppState !== 'undefined' && !AppState.soundEnabled) return;
    this.stopAll();
    this.synthReveal();
    setTimeout(() => this.synthApplause(4.0), 600);
  },

  playReveal() {
    if (typeof AppState !== 'undefined' && !AppState.soundEnabled) return;
    this.synthReveal();
  },

  playNavigate() {
    if (typeof AppState !== 'undefined' && !AppState.soundEnabled) return;
    this.synthNavigate();
  },

  synthLockAnswer() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const freqs = [146.83, 185.00, 220.00, 293.66];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.65);
      });
    } catch(e) {}
  },

  synthReveal() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const notes = [659.25, 830.61, 987.77, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const t = now + idx * 0.06;
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.25);
      });
    } catch(e) {}
  },

  synthNavigate() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(640, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch(e) {}
  },

  synthApplause(duration = 2.5) {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        if (Math.random() < 0.08) {
          data[i] = (Math.random() * 2 - 1) * 0.85;
        } else {
          data[i] = (Math.random() * 2 - 1) * 0.09;
        }
      }

      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1300, ctx.currentTime);
      filter.Q.setValueAtTime(1.2, ctx.currentTime);

      const gain = ctx.createGain();
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.25);
      gain.gain.setValueAtTime(0.3, now + duration - 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noiseNode.start(now);
      noiseNode.stop(now + duration);
    } catch(e) {}
  }
};

// Bộ render công thức toán LaTeX & fallback
const MathRenderer = {
  formatRawMath(text) {
    if (!text) return '';
    let s = String(text);
    if (/\$[^$]+\$|\\\([^\)]+\\\)|\\\[[^\]]+\\\]/.test(s)) return s;
    s = s.replace(/(\\frac\{[^{}]+\}\{[^{}]+\})/g, '$$$1$$');
    s = s.replace(/(\\sqrt(?:\[[^{}]+\])?\{[^{}]+\})/g, '$$$1$$');
    s = s.replace(/([a-zA-Z0-9\)])\^([0-9nkmx\+\-]+)/g, '$$$1^{$2}$$');
    s = s.replace(/([a-zA-Z])_([0-9ijkm])/g, '$$$1_$2$$');
    return s;
  },

  render(container) {
    if (!container) return;
    if (typeof window.renderMathInElement === 'function') {
      try {
        window.renderMathInElement(container, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
            { left: "\\(", right: "\\)", display: false },
            { left: "\\[", right: "\\]", display: true }
          ],
          throwOnError: false,
          errorColor: '#ef4444'
        });
        return;
      } catch(e) {}
    }
    this.fallbackRender(container);
  },

  fallbackRender(container) {
    if (!container) return;
    let html = container.innerHTML;
    html = html.replace(/\$([^$]+)\$/g, (m, expr) => {
      let clean = expr;
      clean = clean.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '<span class="math-frac"><span class="math-num">$1</span><span class="math-den">$2</span></span>');
      clean = clean.replace(/\\sqrt\{([^{}]+)\}/g, '<span class="math-sqrt">√<span class="math-radicand">$1</span></span>');
      clean = clean.replace(/\^\{?([0-9a-zA-Z\+\-]+)\}?/g, '<sup>$1</sup>');
      clean = clean.replace(/_\{?([0-9a-zA-Z\+\-]+)\}?/g, '<sub>$1</sub>');
      clean = clean.replace(/\\times/g, '×').replace(/\\div/g, '÷').replace(/\\pm/g, '±');
      clean = clean.replace(/\\le/g, '≤').replace(/\\ge/g, '≥').replace(/\\ne/g, '≠');
      clean = clean.replace(/\\approx/g, '≈').replace(/\\pi/g, 'π').replace(/\\Delta/g, 'Δ');
      clean = clean.replace(/\\angle/g, '∠').replace(/\\circ/g, '°');
      return clean;
    });
    container.innerHTML = html;
  }
};

const MillionaireGame = {
  questions: [],
  currentIdx: 0,
  score: 0,
  answers: [],
  isGameOver: false,
  
  init() {
    MilAudio.init();
    this.bindEvents();
  },

  onEnter() {
    MilAudio.playIntro();
  },

  bindEvents() {
    document.getElementById('btnMilStart')?.addEventListener('click', () => this.startGame());
    document.getElementById('btnMilCheck')?.addEventListener('click', () => this.checkAnswer());
    document.getElementById('btnMilAnswer')?.addEventListener('click', () => this.showAnswer());
    document.getElementById('btnMilRestart')?.addEventListener('click', () => this.startGame());
    document.getElementById('btnMilPrev')?.addEventListener('click', () => this.navigate(-1));
    document.getElementById('btnMilNext')?.addEventListener('click', () => this.navigate(1));
    document.getElementById('btnMilExit')?.addEventListener('click', () => this.exitGame());

    document.querySelectorAll('.mil-option').forEach(btn => {
      btn.addEventListener('click', (e) => this.selectOption(parseInt(e.currentTarget.getAttribute('data-opt'))));
    });
  },

  startGame() {
    this.currentIdx = 0;
    this.score = 0;
    this.isGameOver = false;
    
    // Ưu tiên nạp câu hỏi tùy chỉnh (từ PDF hoặc mã nhập tay) nếu có
    let allQ = [];
    const customJson = localStorage.getItem('toan_ai_custom_questions_json');
    if (customJson) {
      try {
        const list = JSON.parse(customJson);
        if (Array.isArray(list) && list.length > 0) {
          allQ = list; // Giữ nguyên đúng số câu người dùng nạp (VD: 6 câu thì hiển thị 6 câu)
        }
      } catch(e) {}
    }

    if (allQ.length === 0) {
      allQ = typeof QuestionBank !== 'undefined' ? QuestionBank.getQuestions(AppState.grade, AppState.topic, 22) : [];
      if (allQ.length > 0 && allQ.length < 22) {
        while(allQ.length < 22) {
          allQ = allQ.concat(allQ).slice(0, 22);
        }
      }
    }

    this.questions = allQ.map(q => ({
      ...q,
      userAns: null,
      isChecked: false
    }));

    if (this.questions.length === 0) {
      alert("Không có câu hỏi nào trong ngân hàng đề!");
      return;
    }

    this.answers = new Array(this.questions.length).fill(null);
    this.renderGrid();
    this.loadQuestion(0);
    this.updateProgress();
    
    if(typeof AudioEngine !== 'undefined') AudioEngine.play('click');
    MilAudio.playBg();
  },

  renderGrid() {
    const grid = document.getElementById('milQuestionGrid');
    if(!grid) return;
    grid.innerHTML = '';
    for(let i = 0; i < this.questions.length; i++) {
      const btn = document.createElement('button');
      btn.className = 'mil-q-btn';
      btn.innerText = i + 1;
      btn.onclick = () => {
        MilAudio.playNavigate();
        this.loadQuestion(i);
      };
      grid.appendChild(btn);
    }
  },

  loadQuestion(idx) {
    if (idx < 0 || idx >= this.questions.length) return;
    this.currentIdx = idx;
    const q = this.questions[idx];

    const qNum = document.getElementById('milBadgeQNum');
    if(qNum) {
      if (idx === this.questions.length - 1) {
        qNum.innerText = `Câu ${idx + 1}/${this.questions.length} - CÂU CUỐI CÙNG 👑`;
        qNum.style.background = '#fef08a';
        qNum.style.color = '#854d0e';
        qNum.style.borderColor = '#eab308';
      } else {
        qNum.innerText = `Câu ${idx + 1}`;
        qNum.style.background = '';
        qNum.style.color = '';
        qNum.style.borderColor = '';
      }
    }
    
    const topicBadge = document.getElementById('milBadgeTopic');
    if(topicBadge) topicBadge.innerText = (typeof AppState !== 'undefined' && AppState.topic === 'algebra') ? 'Đại số' : 'Hình học';
    
    const qText = document.getElementById('milQuestionText');
    if(qText) {
      qText.innerHTML = MathRenderer.formatRawMath(q.q);
      MathRenderer.render(qText);
    }

    // Hiển thị hình ảnh minh họa nếu câu hỏi có ảnh
    const imgWrap = document.getElementById('milQImageWrap');
    const imgEl = document.getElementById('milQImage');
    if (imgWrap && imgEl) {
      if (q.image) {
        imgEl.src = q.image;
        imgWrap.style.display = 'block';
      } else {
        imgWrap.style.display = 'none';
        imgEl.src = '';
      }
    }
    
    document.querySelectorAll('.mil-option').forEach((btn, i) => {
      btn.className = 'mil-option';
      const optText = document.getElementById(`milOpt${i}`);
      if(optText && q.options[i]) {
        const cleanOpt = q.options[i].replace(/^[A-D]\.\s*/, '');
        optText.innerHTML = MathRenderer.formatRawMath(cleanOpt);
        MathRenderer.render(optText);
      }
    });

    if (q.userAns !== null) {
      const sel = document.querySelector(`.mil-option[data-opt="${q.userAns}"]`);
      if(sel) sel.classList.add('selected');
    }
    
    if (q.isChecked) {
      this.revealAnswer(q);
    }

    this.updateGridActive();
  },

  zoomImage(src) {
    if (!src) return;
    const modal = document.getElementById('modalImageZoom');
    const modalImg = document.getElementById('zoomModalImg');
    if (modal && modalImg) {
      modalImg.src = src;
      modal.style.display = 'flex';
    }
  },

  updateGridActive() {
    const btns = document.querySelectorAll('.mil-q-btn');
    btns.forEach((b, i) => {
      b.classList.remove('active', 'correct', 'wrong');
      if (i === this.currentIdx) b.classList.add('active');
      
      const q = this.questions[i];
      if (q.isChecked) {
        if (q.userAns === q.ans) b.classList.add('correct');
        else b.classList.add('wrong');
      }
    });
  },

  selectOption(optIdx) {
    const q = this.questions[this.currentIdx];
    if (!q || q.isChecked) return;

    MilAudio.fadeIntroToBg();
    q.userAns = optIdx;
    
    document.querySelectorAll('.mil-option').forEach(b => b.classList.remove('selected'));
    const sel = document.querySelector(`.mil-option[data-opt="${optIdx}"]`);
    if(sel) sel.classList.add('selected');
    
    MilAudio.playLockAnswer();
  },

  checkAnswer() {
    const q = this.questions[this.currentIdx];
    if (!q || q.userAns === null || q.isChecked) return;

    MilAudio.fadeIntroToBg();
    q.isChecked = true;
    const isLastQuestion = (this.currentIdx === this.questions.length - 1);
    const isMilestone = [5, 10, 15, 20].includes(this.currentIdx + 1);
    
    if (q.userAns === q.ans) {
      this.score++;
      if (isLastQuestion) {
        MilAudio.playEnding();
      } else {
        MilAudio.playCorrect(isMilestone);
      }
    } else {
      MilAudio.playWrong();
      if (isLastQuestion) {
        setTimeout(() => MilAudio.playEnding(), 1500);
      }
    }

    this.revealAnswer(q);
    this.updateGridActive();
    this.updateProgress();

    if (q.userAns === q.ans && !isLastQuestion) {
      setTimeout(() => {
        this.navigate(1);
        MilAudio.resumeBg();
      }, isMilestone ? 2400 : 1800);
    } else if (isLastQuestion) {
      setTimeout(() => this.endGame(), 2000);
    }
  },

  showAnswer() {
    const q = this.questions[this.currentIdx];
    if(!q) return;
    q.isChecked = true;
    this.revealAnswer(q);
    this.updateGridActive();
    MilAudio.playReveal();
  },

  revealAnswer(q) {
    document.querySelectorAll('.mil-option').forEach((btn, i) => {
      if (i === q.ans) {
        btn.classList.add('correct');
      } else if (i === q.userAns && q.userAns !== q.ans) {
        btn.classList.add('wrong');
      }
    });
  },

  navigate(dir) {
    this.loadQuestion(this.currentIdx + dir);
    MilAudio.playNavigate();
  },

  updateProgress() {
    const scoreEl = document.getElementById('milScore');
    if(scoreEl) scoreEl.innerText = this.score;
    const totalEl = document.getElementById('milTotalCount');
    if(totalEl) totalEl.innerText = this.questions.length;
    const gridCount = document.getElementById('milGridCount');
    if(gridCount) gridCount.innerText = `${this.score}/${this.questions.length}`;
  },

  endGame() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    MilAudio.playEnding();
    setTimeout(() => {
      alert(`Tuyệt vời! Bạn đã hoàn thành game với số điểm: ${this.score}/${this.questions.length} câu đúng.`);
      if(typeof AppRouter !== 'undefined') AppRouter.saveScore('millionaire', this.score, this.questions.length);
    }, 600);
  },

  exitGame() {
    if(typeof AudioEngine !== 'undefined') AudioEngine.play('click');
    MilAudio.stopAll();
    document.getElementById('millionaireView').style.display = 'none';
    document.getElementById('dashboardView').style.display = 'block';
  }
};

window.addEventListener('DOMContentLoaded', () => {
  MillionaireGame.init();
});
