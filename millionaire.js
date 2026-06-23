const MilAudio = {
  audioIntro: new Audio('ai-la-trieu-phu mo dau.mp3'),
  audioBg: new Audio('nhacnenlientuc.mp3'),
  audioCorrect: new Audio('amthanhdung.mp3'),
  audioWrong: new Audio('amthanhsai.mp3'),
  
  playIntro() {
    if (typeof AppState !== 'undefined' && !AppState.soundEnabled) return;
    this.stopAll();
    this.audioIntro.currentTime = 0;
    this.audioIntro.play().catch(e => console.log('Audio play failed:', e));
  },

  playBg() {
    if (typeof AppState !== 'undefined' && !AppState.soundEnabled) return;
    this.stopAll();
    this.audioBg.loop = true;
    this.audioBg.volume = 0.5;
    this.audioBg.play().catch(e => console.log('Audio play failed:', e));
  },

  stopAll() {
    this.audioIntro.pause();
    this.audioBg.pause();
    this.audioCorrect.pause();
    this.audioWrong.pause();
  },

  playCorrect() {
    if (typeof AppState !== 'undefined' && !AppState.soundEnabled) return;
    this.audioCorrect.currentTime = 0;
    this.audioCorrect.play().catch(e => console.log('Audio play failed:', e));
  },

  playWrong() {
    if (typeof AppState !== 'undefined' && !AppState.soundEnabled) return;
    this.audioWrong.currentTime = 0;
    this.audioWrong.play().catch(e => console.log('Audio play failed:', e));
  }
};

const MillionaireGame = {
  questions: [],
  currentIdx: 0,
  score: 0,
  answers: [],
  isGameOver: false,
  
  init() {
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
        if(typeof AudioEngine !== 'undefined') AudioEngine.play('click');
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
    if(qNum) qNum.innerText = `Câu ${idx + 1}`;
    
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
    
    if(typeof AudioEngine !== 'undefined') AudioEngine.play('click');
  },

  checkAnswer() {
    const q = this.questions[this.currentIdx];
    if (!q || q.userAns === null || q.isChecked) return;

    q.isChecked = true;
    
    if (q.userAns === q.ans) {
      this.score++;
      MilAudio.playCorrect();
    } else {
      MilAudio.playWrong();
    }

    this.revealAnswer(q);
    this.updateGridActive();
    this.updateProgress();

    if (q.userAns === q.ans && this.currentIdx < this.questions.length - 1) {
      setTimeout(() => this.navigate(1), 1500);
    } else if (this.currentIdx === this.questions.length - 1) {
      this.endGame();
    }
  },

  showAnswer() {
    const q = this.questions[this.currentIdx];
    if(!q) return;
    q.isChecked = true;
    this.revealAnswer(q);
    this.updateGridActive();
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
  },

  updateProgress() {
    const scoreEl = document.getElementById('milScore');
    if(scoreEl) scoreEl.innerText = this.score;
  },

  endGame() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    MilAudio.stopAll();
    setTimeout(() => {
      alert(`Tuyệt vời! Bạn đã hoàn thành game với số điểm: ${this.score}/${this.questions.length} câu đúng.`);
      if(typeof AppRouter !== 'undefined') AppRouter.saveScore('millionaire', this.score, this.questions.length);
    }, 800);
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
