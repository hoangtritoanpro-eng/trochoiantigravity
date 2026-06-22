// --- GLOBAL STATE & CONFIG ---
const AppState = {
  grade: '8',
  topic: 'all',
  difficulty: 'medium',
  soundEnabled: true,
  activeGame: null,
  gameLoopId: null,
  playerName: 'Học sinh Ẩn danh'
};

// --- AUDIO SYNTHESIZER (WEB AUDIO API) ---
const AudioEngine = {
  ctx: null,
  
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },

  play(type) {
    if (!AppState.soundEnabled) return;
    this.init();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    const now = this.ctx.currentTime;

    if (type === 'correct') {
      // High-pitched double beep (Ting ting)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.setValueAtTime(800, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'wrong') {
      // Low buzz sound
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'click') {
      // Suble short click
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'win') {
      // Victory fanfare
      const notes = [440, 554, 659, 880];
      notes.forEach((freq, idx) => {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.connect(g);
        g.connect(this.ctx.destination);
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, now + idx * 0.12);
        g.gain.setValueAtTime(0.2, now + idx * 0.12);
        g.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.4);
        o.start(now + idx * 0.12);
        o.stop(now + idx * 0.12 + 0.4);
      });
    } else if (type === 'pull') {
      // Rope pull swoosh sound
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.25);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'shot') {
      // Bow release sound
      osc.type = 'noise' || 'sine';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.15);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  }
};

// --- QUESTION BANK DATABASE ---
const QuestionBank = {
  questions: {
    '6': {
      'algebra': [
        { q: "Tính giá trị của: 5² - 3 x 4", options: ["A. 8", "B. 13", "C. 88", "D. 12"], ans: 1 },
        { q: "Tìm số nguyên x thỏa mãn: x + 7 = -3", options: ["A. x = 10", "B. x = 4", "C. x = -10", "D. x = -4"], ans: 2 },
        { q: "Ước chung lớn nhất của 12 và 18 là gì?", options: ["A. 2", "B. 3", "C. 6", "D. 36"], ans: 2 },
        { q: "Số đối của số nguyên -15 là:", options: ["A. -15", "B. 15", "C. 0", "D. 1/15"], ans: 1 },
        { q: "Tính chất phân phối: a(b + c) = ?", options: ["A. ab + ac", "B. ab + c", "C. abc", "D. a + b + c"], ans: 0 }
      ],
      'geometry': [
        { q: "Chu vi của một hình vuông cạnh 5cm là:", options: ["A. 10cm", "B. 20cm", "C. 25cm", "D. 15cm"], ans: 1 },
        { q: "Hình nào dưới đây có tâm đối xứng?", options: ["A. Tam giác đều", "B. Hình vuông", "C. Hình thang cân", "D. Hình lục giác đều"], ans: 1 },
        { q: "Diện tích hình chữ nhật kích thước 4cm và 6cm là:", options: ["A. 10 cm²", "B. 20 cm²", "C. 24 cm²", "D. 12 cm²"], ans: 2 },
        { q: "Tam giác đều có mấy trục đối xứng?", options: ["A. 1 trục", "B. 2 trục", "C. 3 trục", "D. Không có"], ans: 2 }
      ]
    },
    '7': {
      'algebra': [
        { q: "Tính giá trị của đa thức: x² - 3 khi x = -2", options: ["A. 1", "B. -7", "C. -1", "D. 7"], ans: 0 },
        { q: "Tỉ lệ thức: x/4 = 3/2. Giá trị của x là:", options: ["A. 6", "B. 8", "C. 2", "D. 12"], ans: 0 },
        { q: "Bậc của đa thức x³y² - 5x⁴ + 1 là:", options: ["A. 3", "B. 4", "C. 5", "D. 6"], ans: 2 },
        { q: "Tích của đơn thức: (2x²y) x (-3xy³) là:", options: ["A. -6x²y³", "B. -6x³y⁴", "C. 5x³y⁴", "D. -6x³y³"], ans: 1 }
      ],
      'geometry': [
        { q: "Tam giác có độ dài ba cạnh nào sau đây là tam giác vuông?", options: ["A. 3cm, 4cm, 5cm", "B. 2cm, 3cm, 4cm", "C. 5cm, 5cm, 8cm", "D. 4cm, 5cm, 6cm"], ans: 0 },
        { q: "Giao điểm của ba đường trung trực của tam giác cách đều:", options: ["A. Ba cạnh", "B. Ba đỉnh", "C. Hai đỉnh", "D. Trọng tâm"], ans: 1 },
        { q: "Tổng ba góc trong của một tam giác bằng bao nhiêu?", options: ["A. 90 độ", "B. 180 độ", "C. 360 độ", "D. 270 độ"], ans: 1 },
        { q: "Giao điểm ba đường cao trong tam giác gọi là gì?", options: ["A. Trọng tâm", "B. Trực tâm", "C. Tâm ngoại tiếp", "D. Tâm nội tiếp"], ans: 1 }
      ]
    },
    '8': {
      'algebra': [
        { q: "Khai triển hằng đẳng thức: (x - y)² = ?", options: ["A. x² - y²", "B. x² - 2xy + y²", "C. x² + 2xy + y²", "D. (x-y)(x+y)"], ans: 1 },
        { q: "Phân tích đa thức thành nhân tử: x² - 4", options: ["A. (x - 2)²", "B. (x - 2)(x + 2)", "C. (x + 2)²", "D. x(x - 4)"], ans: 1 },
        { q: "Mẫu thức chung của hai phân thức 1/(x-1) và 1/(x+1) là:", options: ["A. x - 1", "B. x + 1", "C. x² - 1", "D. x² + 1"], ans: 2 },
        { q: "Phân tích đa thức thành nhân tử: x² - 2x + 1", options: ["A. (x + 1)²", "B. (x - 1)²", "C. (x - 1)(x + 1)", "D. x(x - 2) + 1"], ans: 1 },
        { q: "Phân tích đa thức thành nhân tử: 3x² + 6x", options: ["A. 3x(x + 2)", "B. 3(x² + 2x)", "C. 3x(x + 3)", "D. 3(x + 2)"], ans: 0 },
        { q: "Khai triển hằng đẳng thức: x³ - 8 = ?", options: ["A. (x - 2)(x² + 2x + 4)", "B. (x - 2)(x² - 2x + 4)", "C. (x - 2)³", "D. (x + 2)(x² - 2x + 4)"], ans: 0 }
      ],
      'geometry': [
        { q: "Hình bình hành có một góc vuông là hình gì?", options: ["A. Hình thoi", "B. Hình chữ nhật", "C. Hình vuông", "D. Hình thang cân"], ans: 1 },
        { q: "Đường trung bình của tam giác thì:", options: ["A. Song song với cạnh đáy và bằng nửa cạnh ấy", "B. Vuông góc với cạnh đáy", "C. Bằng 2/3 cạnh đáy", "D. Song song với cạnh đáy và bằng cạnh đáy"], ans: 0 },
        { q: "Tứ giác có 4 cạnh bằng nhau là hình gì?", options: ["A. Hình vuông", "B. Hình chữ nhật", "C. Hình thoi", "D. Hình bình hành"], ans: 2 },
        { q: "Hình thoi có hai đường chéo bằng nhau là hình gì?", options: ["A. Hình bình hành", "B. Hình vuông", "C. Hình chữ nhật", "D. Hình thang"], ans: 1 }
      ]
    },
    '9': {
      'algebra': [
        { q: "Căn bậc hai số học của 16 là:", options: ["A. 4", "B. -4", "C. ±4", "D. 256"], ans: 0 },
        { q: "Hệ phương trình {x+y=3, x-y=1} có nghiệm là:", options: ["A. (2, 1)", "B. (1, 2)", "C. (2, -1)", "D. (3, 0)"], ans: 0 },
        { q: "Biệt thức Δ của phương trình bậc hai ax² + bx + c = 0 (a≠0) là:", options: ["A. b² - ac", "B. b² - 4ac", "C. b - 4ac", "D. b² + 4ac"], ans: 1 },
        { q: "Phương trình x² - 5x + 6 = 0 có hai nghiệm là:", options: ["A. 1 và 6", "B. 2 và 3", "C. -2 và -3", "D. 1 và 5"], ans: 1 }
      ],
      'geometry': [
        { q: "Cho tam giác ABC vuông tại A, đường cao AH. Hệ thức nào đúng?", options: ["A. AH² = HB x HC", "B. AB² = AH x BC", "C. AC² = HB x BC", "D. AH = HB x HC"], ans: 0 },
        { q: "Trong một đường tròn, góc nội tiếp bằng:", options: ["A. Góc ở tâm cùng chắn một cung", "B. Nửa số đo góc ở tâm cùng chắn cung đó", "C. Số đo cung bị chắn", "D. Gấp đôi số đo góc ở tâm"], ans: 1 },
        { q: "Độ dài đường tròn bán kính R được tính theo công thức:", options: ["A. S = πR²", "B. C = 2πR", "C. C = πR", "D. S = 2πR"], ans: 1 },
        { q: "Tứ giác nội tiếp đường tròn có tổng hai góc đối bằng:", options: ["A. 90 độ", "B. 180 độ", "C. 360 độ", "D. 270 độ"], ans: 1 }
      ]
    }
  },

  getQuestions(grade, topic, count = 5) {
    let pool = [];
    const gradeDB = this.questions[grade] || this.questions['8'];
    
    if (topic === 'all') {
      pool = [...(gradeDB['algebra'] || []), ...(gradeDB['geometry'] || [])];
    } else {
      pool = gradeDB[topic] || [];
    }

    // Load custom questions from localStorage and merge them
    const customList = JSON.parse(localStorage.getItem('toan_ai_custom_questions') || '[]');
    const matchingCustom = customList.filter(q => q.grade === grade && (topic === 'all' || q.topic === topic));
    pool = [...pool, ...matchingCustom];

    // Shuffle pool
    const shuffled = pool.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
};

// --- CORE APP ROUTER & LAYOUT HANDLER ---
const AppRouter = {
  init() {
    this.bindEvents();
    this.renderQuestionBankTab();
  },

  bindEvents() {
    // Nav Button Clicks
    document.getElementById('btnDashboard').addEventListener('click', (e) => {
      this.switchTab('dashboard');
      AudioEngine.play('click');
    });

    document.getElementById('btnQuestions').addEventListener('click', (e) => {
      this.switchTab('questions');
      AudioEngine.play('click');
    });

    // Back to Dashboard from play screen
    document.getElementById('btnBackToDashboard').addEventListener('click', () => {
      this.closeActiveGame();
    });

    // Control configuration changes
    const nameInput = document.getElementById('inputPlayerName');
    if (nameInput) {
      nameInput.addEventListener('input', (e) => {
        AppState.playerName = e.target.value.trim() || 'Học sinh Ẩn danh';
      });
    }

    document.getElementById('selectGrade').addEventListener('change', (e) => {
      AppState.grade = e.target.value;
      this.renderQuestionBankTab();
    });
    
    document.getElementById('selectTopic').addEventListener('change', (e) => {
      AppState.topic = e.target.value;
      this.renderQuestionBankTab();
    });

    document.getElementById('selectDifficulty').addEventListener('change', (e) => {
      AppState.difficulty = e.target.value;
    });

    document.getElementById('soundSwitch').addEventListener('change', (e) => {
      AppState.soundEnabled = e.target.checked;
    });

    // Leaderboard button
    const leadBtn = document.getElementById('btnLeaderboard');
    if (leadBtn) {
      leadBtn.addEventListener('click', () => {
        this.switchTab('leaderboard');
        AudioEngine.play('click');
      });
    }

    // Export leaderboard to CSV
    const exportBtn = document.getElementById('btnExportLeaderboard');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportLeaderboardToCSV();
        AudioEngine.play('click');
      });
    }

    // Clear leaderboard history
    const clearBtn = document.getElementById('btnClearLeaderboard');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Bạn có chắc chắn muốn xóa toàn bộ bảng xếp hạng?')) {
          localStorage.removeItem('toan_ai_leaderboard');
          this.renderLeaderboardTab();
          AudioEngine.play('wrong');
        }
      });
    }

    // Manage questions tab button
    const manageBtn = document.getElementById('btnManageQuestions');
    if (manageBtn) {
      manageBtn.addEventListener('click', () => {
        this.switchTab('manage-questions');
        AudioEngine.play('click');
      });
    }

    // Custom question form submit listener
    const addQForm = document.getElementById('formAddQuestion');
    if (addQForm) {
      addQForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleAddQuestionSubmit();
      });
    }

    // Launching game cards
    const cards = document.querySelectorAll('.game-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const gameId = card.getAttribute('data-game');
        this.launchGame(gameId);
      });
    });
  },

  switchTab(tab) {
    const dashBtn = document.getElementById('btnDashboard');
    const questBtn = document.getElementById('btnQuestions');
    const leadBtn = document.getElementById('btnLeaderboard');
    const manageBtn = document.getElementById('btnManageQuestions');
    
    const dashView = document.getElementById('dashboardView');
    const questView = document.getElementById('questionsView');
    const leadView = document.getElementById('leaderboardView');
    const manageView = document.getElementById('manageQuestionsView');

    // Remove active class from all buttons
    dashBtn.classList.remove('active');
    questBtn.classList.remove('active');
    if (leadBtn) leadBtn.classList.remove('active');
    if (manageBtn) manageBtn.classList.remove('active');

    // Hide all views
    dashView.style.display = 'none';
    questView.style.display = 'none';
    if (leadView) leadView.style.display = 'none';
    if (manageView) manageView.style.display = 'none';

    if (tab === 'dashboard') {
      dashBtn.classList.add('active');
      dashView.style.display = 'block';
    } else if (tab === 'questions') {
      questBtn.classList.add('active');
      questView.style.display = 'block';
      this.renderQuestionBankTab(); // Refresh question bank
    } else if (tab === 'leaderboard') {
      if (leadBtn) leadBtn.classList.add('active');
      if (leadView) leadView.style.display = 'block';
      this.renderLeaderboardTab();
    } else if (tab === 'manage-questions') {
      if (manageBtn) manageBtn.classList.add('active');
      if (manageView) manageView.style.display = 'block';
      this.renderManageQuestionsTab();
    }
  },

  renderQuestionBankTab() {
    const container = document.getElementById('questionListContainer');
    container.innerHTML = '';

    const questions = QuestionBank.getQuestions(AppState.grade, AppState.topic, 100); // Get all available
    if (questions.length === 0) {
      container.innerHTML = `<div style="color: var(--text-muted);">Không có câu hỏi nào khớp với bộ lọc hiện tại.</div>`;
      return;
    }

    questions.forEach((q, idx) => {
      const qDiv = document.createElement('div');
      qDiv.className = 'audio-toggle';
      qDiv.style.flexDirection = 'column';
      qDiv.style.alignItems = 'flex-start';
      qDiv.style.gap = '10px';
      
      let optionsHtml = q.options.map((opt, i) => {
        const isCorrect = i === q.ans;
        return `<span style="margin-right: 15px; color: ${isCorrect ? 'var(--primary)' : 'var(--text-secondary)'}; font-weight: ${isCorrect ? 'bold' : 'normal'}">${opt}</span>`;
      }).join(' ');

      qDiv.innerHTML = `
        <div style="font-weight: 800; color: var(--text-primary);">Câu ${idx + 1}: ${q.q}</div>
        <div style="font-size: 13px;">${optionsHtml}</div>
      `;
      container.appendChild(qDiv);
    });
  },

  renderLeaderboardTab() {
    const tbody = document.getElementById('leaderboardBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const leaderboard = JSON.parse(localStorage.getItem('toan_ai_leaderboard') || '[]');
    if (leaderboard.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">Chưa có thành tích nào được ghi nhận. Hãy chơi game để lưu điểm số đầu tiên!</td></tr>`;
      return;
    }

    leaderboard.forEach((entry, idx) => {
      const tr = document.createElement('tr');
      
      // Rank Badge
      let rankHtml = '';
      if (idx === 0) rankHtml = `<span class="rank-badge gold">🥇</span>`;
      else if (idx === 1) rankHtml = `<span class="rank-badge silver">🥈</span>`;
      else if (idx === 2) rankHtml = `<span class="rank-badge bronze">🥉</span>`;
      else rankHtml = `<span class="rank-badge normal">${idx + 1}</span>`;

      // Date Formatting
      const date = new Date(entry.timestamp);
      const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} - ${date.getDate()}/${date.getMonth() + 1}`;

      // Difficulty Translation
      const diffs = { 'easy': 'Dễ', 'medium': 'Vừa', 'hard': 'Khó' };
      const diffStr = diffs[entry.difficulty] || entry.difficulty;

      // Grade label
      const gradeStr = `Lớp ${entry.grade}`;

      tr.innerHTML = `
        <td style="text-align: center;">${rankHtml}</td>
        <td style="font-weight: bold; color: var(--text-primary);">${entry.playerName}</td>
        <td>${entry.gameName}</td>
        <td><span class="game-tag" style="border-color: var(--secondary); color: var(--secondary); background: rgba(14, 165, 233, 0.05);">${gradeStr}</span></td>
        <td>${diffStr}</td>
        <td><span class="score-highlight">${entry.score} / 100</span></td>
        <td style="color: var(--text-muted); font-size: 12px;">${timeStr}</td>
      `;
      tbody.appendChild(tr);
    });
  },

  renderManageQuestionsTab() {
    const container = document.getElementById('customQuestionsContainer');
    if (!container) return;
    container.innerHTML = '';

    const list = JSON.parse(localStorage.getItem('toan_ai_custom_questions') || '[]');
    if (list.length === 0) {
      container.innerHTML = `<div style="color: var(--text-muted); font-size: 14px; text-align: center; padding: 20px;">Chưa có câu hỏi tự tạo nào. Hãy thêm ở ô bên cạnh!</div>`;
      return;
    }

    list.forEach((item, idx) => {
      const qDiv = document.createElement('div');
      qDiv.className = 'audio-toggle';
      qDiv.style.flexDirection = 'row';
      qDiv.style.alignItems = 'center';
      qDiv.style.justifyContent = 'space-between';
      qDiv.style.gap = '15px';

      const details = `Lớp ${item.grade} • ${item.topic === 'algebra' ? 'Đại số' : 'Hình học'}`;

      qDiv.innerHTML = `
        <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 5px; overflow: hidden; text-align: left;">
          <div style="font-size: 11px; color: var(--text-muted); font-weight: bold;">${details}</div>
          <div style="font-weight: 800; color: var(--text-primary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${item.q}</div>
        </div>
        <button class="back-btn delete-q-btn" data-index="${idx}" style="padding: 5px 10px; border-color: rgba(239, 68, 68, 0.4); color: #ef4444; font-size: 12px; margin-left: 10px;">Xóa</button>
      `;

      qDiv.querySelector('.delete-q-btn').addEventListener('click', (e) => {
        const index = parseInt(e.target.getAttribute('data-index'));
        this.deleteCustomQuestion(index);
      });

      container.appendChild(qDiv);
    });
  },

  handleAddQuestionSubmit() {
    const newGrade = document.getElementById('newGrade').value;
    const newTopic = document.getElementById('newTopic').value;
    const newQText = document.getElementById('newQuestionText').value.trim();
    const opt0 = document.getElementById('newOpt0').value.trim();
    const opt1 = document.getElementById('newOpt1').value.trim();
    const opt2 = document.getElementById('newOpt2').value.trim();
    const opt3 = document.getElementById('newOpt3').value.trim();
    const correctIdx = parseInt(document.getElementById('newCorrectAns').value);

    if (!newQText || !opt0 || !opt1 || !opt2 || !opt3) {
      alert('Vui lòng điền đầy đủ thông tin câu hỏi và các đáp án!');
      return;
    }

    const newItem = {
      grade: newGrade,
      topic: newTopic,
      q: newQText,
      options: [opt0, opt1, opt2, opt3],
      ans: correctIdx,
      isCustom: true
    };

    let list = JSON.parse(localStorage.getItem('toan_ai_custom_questions') || '[]');
    list.push(newItem);
    localStorage.setItem('toan_ai_custom_questions', JSON.stringify(list));

    // Reset Form
    document.getElementById('newQuestionText').value = '';
    document.getElementById('newOpt0').value = '';
    document.getElementById('newOpt1').value = '';
    document.getElementById('newOpt2').value = '';
    document.getElementById('newOpt3').value = '';
    
    AudioEngine.play('correct');
    
    // Refresh view
    this.renderManageQuestionsTab();
  },

  deleteCustomQuestion(index) {
    if (!confirm('Bạn có chắc muốn xóa câu hỏi này không?')) return;
    
    let list = JSON.parse(localStorage.getItem('toan_ai_custom_questions') || '[]');
    list.splice(index, 1);
    localStorage.setItem('toan_ai_custom_questions', JSON.stringify(list));
    
    AudioEngine.play('wrong');
    this.renderManageQuestionsTab();
  },

  exportLeaderboardToCSV() {
    const leaderboard = JSON.parse(localStorage.getItem('toan_ai_leaderboard') || '[]');
    if (leaderboard.length === 0) {
      alert('Chưa có thành tích nào để xuất bảng điểm!');
      return;
    }

    // Build CSV content rows
    const headers = ["Hạng", "Người Chơi", "Trò Chơi", "Khối Lớp", "Độ Khó", "Điểm Số", "Thời Gian"];
    const rows = [headers];

    leaderboard.forEach((e, idx) => {
      const date = new Date(e.timestamp);
      const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
      const diffs = { 'easy': 'Dễ', 'medium': 'Vừa', 'hard': 'Khó' };
      const diffStr = diffs[e.difficulty] || e.difficulty;

      rows.push([
        idx + 1,
        `"${e.playerName.replace(/"/g, '""')}"`,
        `"${e.gameName.replace(/"/g, '""')}"`,
        `"Lớp ${e.grade}"`,
        `"${diffStr}"`,
        e.score,
        `"${timeStr}"`
      ]);
    });

    const csvContent = rows.map(r => r.join(",")).join("\n");
    
    // Create Blob with UTF-8 BOM to display Vietnamese accents in Excel correctly
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bang_diem_toan_ai_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  saveScore(gameId, rawScore, maxScore) {
    const normalizedScore = Math.min(100, Math.max(0, Math.round((rawScore / maxScore) * 100)));
    
    let leaderboard = JSON.parse(localStorage.getItem('toan_ai_leaderboard') || '[]');
    
    // Check if player name exists, if not use fallback
    const name = AppState.playerName || 'Học sinh Ẩn danh';
    
    const entry = {
      playerName: name,
      gameId: gameId,
      gameName: this.getGameName(gameId),
      grade: AppState.grade,
      topic: AppState.topic,
      difficulty: AppState.difficulty,
      score: normalizedScore,
      timestamp: Date.now()
    };
    
    leaderboard.push(entry);
    
    // Sort: score desc, then by date desc
    leaderboard.sort((a, b) => b.score - a.score || b.timestamp - a.timestamp);
    
    // Keep top 30 records
    leaderboard = leaderboard.slice(0, 30);
    
    localStorage.setItem('toan_ai_leaderboard', JSON.stringify(leaderboard));
  },

  getGameName(gameId) {
    const names = {
      'tug-of-war': 'Kéo Co Kiến Thức',
      'flip-puzzle': 'Lật Mảnh Ghép Trí Uẩn',
      'ninja-toan': 'Ninja Toán Học AI',
      'quiz-climb': 'Đỉnh Cao Olympia',
      'gold-miner': 'Đào Vàng Tri Thức',
      'archery-math': 'Bắn Cung Toán Học',
      'memory-match': 'Ghép Đôi Thằng Đẳng Thức',
      'flappy-math': 'Rùa Bay Toán Học'
    };
    return names[gameId] || gameId;
  },

  launchGame(gameId) {
    AudioEngine.play('click');
    const playScreen = document.getElementById('playScreen');
    const activeGameTitle = document.getElementById('activeGameTitle');
    
    // Set active game details
    let title = 'Trò Chơi';
    const card = document.querySelector(`.game-card[data-game="${gameId}"]`);
    if (card) {
      title = card.querySelector('.game-title').innerText;
    }
    activeGameTitle.innerText = title;
    
    // Show Screen Overlay
    playScreen.style.display = 'flex';
    
    // Resize target canvas
    const canvas = document.getElementById('gameCanvas');
    const viewport = document.getElementById('gameViewport');
    canvas.width = viewport.clientWidth;
    canvas.height = viewport.clientHeight;

    // Trigger specific game module launch
    AppState.activeGame = gameId;
    this.startGameLogic(gameId, canvas);
  },

  closeActiveGame() {
    AudioEngine.play('click');
    
    // Stop loops/streams
    if (AppState.gameLoopId) {
      cancelAnimationFrame(AppState.gameLoopId);
      AppState.gameLoopId = null;
    }
    
    // Stop camera stream if active
    if (window.cameraStream) {
      window.cameraStream.getTracks().forEach(track => track.stop());
      window.cameraStream = null;
    }

    // Hide Screen Overlay
    document.getElementById('playScreen').style.display = 'none';
    AppState.activeGame = null;
  },

  startGameLogic(gameId, canvas) {
    if (gameId === 'tug-of-war') {
      TugOfWarGame.start(canvas);
    } else if (gameId === 'flip-puzzle') {
      FlipPuzzleGame.start(canvas);
    } else if (gameId === 'ninja-toan') {
      NinjaToanGame.start(canvas);
    } else if (gameId === 'quiz-climb') {
      QuizClimbGame.start(canvas);
    } else if (gameId === 'gold-miner') {
      GoldMinerGame.start(canvas);
    } else if (gameId === 'archery-math') {
      ArcheryMathGame.start(canvas);
    } else if (gameId === 'memory-match') {
      MemoryMatchGame.start(canvas);
    } else if (gameId === 'flappy-math') {
      FlappyMathGame.start(canvas);
    }
  }
};

// Start router and register service worker when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  AppRouter.init();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => console.log('Service Worker registered successfully:', reg.scope))
      .catch((err) => console.warn('Service Worker registration failed:', err));
  }
});

// --- HELPER FUNCTION: DRAW TEXT WITH BACKGROUND (UI CARD) ---
function drawGlassCard(ctx, text, x, y, w, h, bgStyle, borderStyle, textColor, fontSize = '20px') {
  ctx.save();
  
  // Smart colors for Bright Theme
  let finalBg = bgStyle;
  let finalBorder = borderStyle;
  let finalTextColor = textColor;
  
  // Check if background is dark
  const bgStr = String(bgStyle).toLowerCase().trim();
  const isDark = bgStr.includes('15, 23, 42') || bgStr.includes('11, 15, 25') || bgStr.startsWith('#0') || bgStr.startsWith('#11') || bgStr.startsWith('#1e1') || bgStr.includes('#10b981') || bgStr.includes('#ef4444') || bgStr.includes('14, 165, 233') || bgStr.includes('rgba(0, 50') || bgStr.includes('rgba(16, 185') || bgStr.includes('rgba(239, 68');
  
  // Adapt text color to bright theme
  if (!isDark && (textColor === '#fff' || textColor === '#ffffff' || textColor === 'white' || textColor === 'var(--text-primary)')) {
    finalTextColor = '#0f172a'; // slate 900
  }
  if (!isDark && (borderStyle === '#fff' || borderStyle === '#ffffff' || borderStyle === 'white' || borderStyle === 'var(--border-glass)')) {
    finalBorder = 'rgba(15, 23, 42, 0.12)';
  }

  ctx.shadowColor = isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(15, 23, 42, 0.08)';
  ctx.shadowBlur = isDark ? 15 : 8;
  ctx.fillStyle = finalBg;
  
  // Rounded rectangular path
  ctx.beginPath();
  const radius = 16; // slightly more rounded and friendly
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = finalBorder;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw Text
  ctx.fillStyle = finalTextColor;
  ctx.font = `bold ${fontSize} 'Fredoka', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Multiline wrapping if too long
  const words = text.split(' ');
  let line = '';
  let lines = [];
  const maxWidth = w - 30;
  const lineHeight = parseInt(fontSize) * 1.35;
  
  for(let n = 0; n < words.length; n++) {
    let testLine = line + words[n] + ' ';
    let metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      lines.push(line);
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  let startY = y + h/2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((lineText, idx) => {
    ctx.fillText(lineText.trim(), x + w/2, startY + idx * lineHeight);
  });

  ctx.restore();
}
