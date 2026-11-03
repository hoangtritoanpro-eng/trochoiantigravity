const MilAudio = {
  audioCtx: null,
  introTimer: null,
  audioIntro: new Audio(encodeURI('mở đầu chương trình.mp3')),
  audioBg: new Audio('nhacnenlientuc.mp3'),
  audioCorrect: new Audio('amthanhdung.mp3'),
  audioWrong: new Audio('amthanhsai.mp3'),
  audioEnding: new Audio(encodeURI('kết thúc chương trình.mp3')),

  init() {
    this.audioIntro.onerror = () => { this.audioIntro = new Audio('ai-la-trieu-phu mo dau.mp3'); };
    this.audioEnding.onerror = () => { this.audioEnding = new Audio('nhacketthuc.mp3'); };
    this.audioBg.loop = true;
    this.audioBg.volume = 0.35;
    this.audioIntro.volume = 0.85;
    this.audioCorrect.volume = 0.9;
    this.audioWrong.volume = 0.85;
    this.audioEnding.volume = 0.95;
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
  
  playIntro() {
    if (typeof AppState !== 'undefined' && !AppState.soundEnabled) return;
    this.stopAll();
    this.audioIntro.currentTime = 0;
    this.audioIntro.play().then(() => {
      this.introTimer = setTimeout(() => {
        if (typeof AppState === 'undefined' || AppState.soundEnabled) {
          try {
            let vol = this.audioIntro.volume;
            const fade = setInterval(() => {
              vol = Math.max(0, vol - 0.15);
              this.audioIntro.volume = vol;
              if (vol <= 0) {
                clearInterval(fade);
                this.audioIntro.pause();
                this.playBg();
              }
            }, 50);
          } catch(e) {
            this.audioIntro.pause();
            this.playBg();
          }
        }
      }, 5500);
    }).catch(e => {
      this.playBg();
    });
  },

  playBg() {
    if (typeof AppState !== 'undefined' && !AppState.soundEnabled) return;
    if (this.introTimer) { clearTimeout(this.introTimer); this.introTimer = null; }
    try { this.audioIntro.pause(); } catch(e){}
    try { this.audioEnding.pause(); } catch(e){}
    this.audioBg.loop = true;
    this.audioBg.volume = 0.35;
    this.audioBg.play().catch(e => console.log('Audio play failed:', e));
  },

  pauseBg() {
    try { this.audioBg.pause(); } catch(e){}
  },

  resumeBg() {
    if (typeof AppState !== 'undefined' && !AppState.soundEnabled) return;
    try {
      this.audioBg.volume = 0.35;
      this.audioBg.play().catch(e => console.log('Audio resume failed:', e));
    } catch(e){}
  },

  stopAll() {
    if (this.introTimer) { clearTimeout(this.introTimer); this.introTimer = null; }
    this.audioIntro.pause();
    this.audioBg.pause();
    this.audioCorrect.pause();
    this.audioWrong.pause();
    this.audioEnding.pause();
  },

  playLockAnswer() {
    if (typeof AppState !== 'undefined' && !AppState.soundEnabled) return;
    this.synthLockAnswer();
  },

  playCorrect(isMilestone = false) {
    if (typeof AppState !== 'undefined' && !AppState.soundEnabled) return;
    this.pauseBg();
    this.audioCorrect.currentTime = 0;
    this.audioCorrect.play().catch(e => console.log('Audio play failed:', e));

    if (isMilestone) {
      setTimeout(() => this.synthApplause(2.5), 500);
    }
  },

  playWrong() {
    if (typeof AppState !== 'undefined' && !AppState.soundEnabled) return;
    this.pauseBg();
    this.audioWrong.currentTime = 0;
    this.audioWrong.play().catch(e => console.log('Audio play failed:', e));
  },

  playEnding() {
    if (typeof AppState !== 'undefined' && !AppState.soundEnabled) return;
    this.stopAll();
    this.audioEnding.currentTime = 0;
    this.audioEnding.volume = 0.95;
    this.audioEnding.play().catch(e => console.log('Audio play failed:', e));
    setTimeout(() => this.synthApplause(4.0), 1000);
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
    
    // Lấy 22 câu hỏi ngẫu nhiên từ QuestionBank
    let allQ = typeof QuestionBank !== 'undefined' ? QuestionBank.getQuestions(AppState.grade, AppState.topic, 22) : [];
    
    // Nếu không đủ, nhân bản tạm cho đủ 22 câu để test UI giống hình
    if (allQ.length > 0 && allQ.length < 22) {
      while(allQ.length < 22) {
        allQ = allQ.concat(allQ).slice(0, 22);
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
    if(qText) qText.innerHTML = q.q;
    
    document.querySelectorAll('.mil-option').forEach((btn, i) => {
      btn.className = 'mil-option';
      const optText = document.getElementById(`milOpt${i}`);
      if(optText && q.options[i]) optText.innerText = q.options[i].replace(/^[A-D]\.\s*/, ''); // bỏ tiền tố A. B. C. D. nếu có
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

    q.userAns = optIdx;
    
    document.querySelectorAll('.mil-option').forEach(b => b.classList.remove('selected'));
    const sel = document.querySelector(`.mil-option[data-opt="${optIdx}"]`);
    if(sel) sel.classList.add('selected');
    
    MilAudio.playLockAnswer();
  },

  checkAnswer() {
    const q = this.questions[this.currentIdx];
    if (!q || q.userAns === null || q.isChecked) return;

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
