/* ═══════════════════════════════════════════════════════════
   ĐỌC HIỂU CÙNG AI – Game đánh giá năng lực đọc hiểu văn bản
   Luồng: Nạp văn bản → Gemini phân tích → Giáo viên duyệt
          → 6 vòng chơi → Infographic chốt kiến thức
═══════════════════════════════════════════════════════════ */

/* ───────── TIỆN ÍCH ───────── */
const $ = (id) => document.getElementById(id);

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const str = (v) => (typeof v === 'string' ? v.trim() : (v == null ? '' : String(v).trim()));
const arr = (v) => (Array.isArray(v) ? v : []);

let toastTimer = null;
function toast(msg, isError = false) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.toggle('error', isError);
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), isError ? 6000 : 3000);
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
  $('btnShowText').hidden = !(id === 'screenGame' || id === 'screenPreview');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function levelKey(level) {
  const l = str(level).toLowerCase();
  if (l.includes('nhận')) return 'NB';
  if (l.includes('vận')) return 'VD';
  return 'TH';
}
const LEVEL_NAMES = { NB: 'Nhận biết', TH: 'Thông hiểu', VD: 'Vận dụng' };
const LEVEL_CLASS = { NB: 'lvl-nb', TH: 'lvl-th', VD: 'lvl-vd' };
const lvlBadge = (level) => {
  const k = levelKey(level);
  return `<span class="lvl ${LEVEL_CLASS[k]}">${LEVEL_NAMES[k]}</span>`;
};

/* ───────── ÂM THANH ───────── */
const Sound = {
  enabled: localStorage.getItem('dh_sound') !== 'off',
  ctx: null,
  files: {
    correct: new Audio('assets/sounds/amthanhdung.mp3'),
    wrong: new Audio('assets/sounds/amthanhsai.mp3'),
    end: new Audio('assets/sounds/nhacketthuc.mp3'),
  },

  beep(freqs, dur = 0.12, type = 'sine', vol = 0.15) {
    try {
      this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
      freqs.forEach((f, i) => {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = type;
        o.frequency.value = f;
        const t = this.ctx.currentTime + i * dur;
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur * 1.6);
        o.connect(g).connect(this.ctx.destination);
        o.start(t);
        o.stop(t + dur * 1.7);
      });
    } catch (e) { /* trình duyệt không hỗ trợ WebAudio */ }
  },

  play(name) {
    if (!this.enabled) return;
    if (name === 'click') return this.beep([660], 0.06, 'triangle', 0.08);
    if (name === 'round') return this.beep([523, 659, 784, 1047], 0.13, 'triangle', 0.12);
    const a = this.files[name];
    if (!a) return;
    a.currentTime = 0;
    a.volume = name === 'end' ? 0.8 : 0.9;
    a.play().catch(() => this.beep(name === 'wrong' ? [300, 200] : [784, 1047], 0.15));
  },

  stopAll() {
    Object.values(this.files).forEach((a) => { a.pause(); a.currentTime = 0; });
  },

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('dh_sound', this.enabled ? 'on' : 'off');
    if (!this.enabled) this.stopAll();
    $('btnSound').textContent = this.enabled ? '🔊' : '🔇';
  },
};

/* ───────── ĐỊNH NGHĨA CÁC VÒNG CHƠI ───────── */
const ROUNDS = {
  mcq:       { icon: '🅰️', title: 'Trắc nghiệm',          desc: 'Chọn 1 đáp án đúng trong 4 phương án A, B, C, D' },
  trueFalse: { icon: '⚖️', title: 'Đúng hay Sai?',         desc: 'Nhận định sau đây đúng hay sai so với văn bản?' },
  fillBlank: { icon: '✍️', title: 'Điền từ còn thiếu',     desc: 'Chọn từ ngữ phù hợp để hoàn thành câu' },
  matching:  { icon: '🔗', title: 'Nối cặp',               desc: 'Nối mỗi ý ở cột trái với ý phù hợp ở cột phải' },
  ordering:  { icon: '🔢', title: 'Sắp xếp trình tự',      desc: 'Sắp xếp các sự việc / ý theo đúng thứ tự trong văn bản' },
  openEnded: { icon: '💬', title: 'Suy ngẫm & Tự luận',    desc: 'Trả lời ngắn gọn bằng lời của em' },
};
const ROUND_ORDER = ['mcq', 'trueFalse', 'fillBlank', 'matching', 'ordering', 'openEnded'];

/* ───────── TRẠNG THÁI ỨNG DỤNG ───────── */
const App = {
  sourceText: '',
  analysis: null,
  isDemo: false,
  settings: {
    grade: localStorage.getItem('dh_grade') || 'Lớp 8',
    count: parseInt(localStorage.getItem('dh_count') || '5', 10),
    rounds: JSON.parse(localStorage.getItem('dh_rounds') || 'null') || ROUND_ORDER.slice(),
  },

  apiKey: () => $('inpApiKey').value.trim(),
  model: () => ($('selModel').value === 'custom' ? ($('inpCustomModel').value.trim() || 'gemini-3.8-flash') : $('selModel').value),

  saveSession() {
    try {
      localStorage.setItem('dh_last_session', JSON.stringify({ text: this.sourceText, analysis: this.analysis, isDemo: this.isDemo }));
    } catch (e) { /* bộ nhớ đầy – bỏ qua */ }
  },
};

/* ───────── ĐỌC FILE (PDF / DOCX / TXT) ───────── */
const FileLoader = {
  async read(file) {
    const name = file.name.toLowerCase();
    if (name.endsWith('.txt')) return file.text();
    if (name.endsWith('.docx')) return this.readDocx(file);
    if (name.endsWith('.pdf')) return this.readPdf(file);
    throw new Error('Định dạng chưa hỗ trợ. Hãy dùng file .pdf, .docx hoặc .txt');
  },

  async readDocx(file) {
    if (!window.mammoth) throw new Error('Chưa tải được thư viện đọc Word (cần Internet). Hãy dán nội dung trực tiếp hoặc dùng PDF.');
    const res = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return res.value;
  },

  async readPdf(file) {
    if (!window.pdfjsLib) throw new Error('Thư viện PDF.js chưa sẵn sàng.');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/vendor/pdf.worker.min.js';
    const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    let out = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const content = await (await pdf.getPage(i)).getTextContent();
      let line = '';
      content.items.forEach((it) => {
        line += it.str;
        if (it.hasEOL) { out += line.trimEnd() + '\n'; line = ''; }
      });
      out += line + '\n\n';
    }
    if (!out.trim()) throw new Error('PDF không có lớp chữ (có thể là ảnh scan). Hãy dán nội dung trực tiếp.');
    return out.replace(/\n{3,}/g, '\n\n').trim();
  },
};

/* ───────── DỊCH VỤ GEMINI AI ───────── */
const AIService = {
  base: 'https://generativelanguage.googleapis.com/v1beta',
  models: [], // danh sách model thực tế mà API Key được phép dùng

  friendly(status, msg) {
    if ((status === 400 || status === 403) && /api key|API_KEY|permission/i.test(msg)) return 'API Key không hợp lệ hoặc chưa bật Gemini API. Hãy kiểm tra lại key.';
    if (status === 404) return `Không tìm thấy model "${App.model()}". Hãy bấm "Kết nối" để chọn model có sẵn.`;
    if (status === 429) return 'Đã hết hạn mức gọi AI tạm thời. Hãy đợi khoảng 1 phút rồi thử lại.';
    if (status >= 500) return 'Máy chủ Gemini đang bận. Hãy thử lại sau ít phút.';
    return `Lỗi Gemini (${status}): ${msg}`;
  },

  async request(path, key, body) {
    let res;
    try {
      res = await fetch(`${this.base}/${path}`, {
        method: body ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      throw new Error('Không kết nối được tới Gemini. Hãy kiểm tra Internet.');
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const e = new Error(this.friendly(res.status, err.error?.message || res.statusText));
      e.status = res.status;
      throw e;
    }
    return res.json();
  },

  /* Lấy danh sách model hỗ trợ sinh nội dung, sắp xếp: phiên bản mới → Flash → Pro */
  async listModels(key) {
    const data = await this.request('models?pageSize=200', key);
    const score = (id) => {
      const v = parseFloat((id.match(/gemini-(\d+(?:\.\d+)?)/) || [])[1] || '0');
      let s = v * 10;
      if (/flash/.test(id)) s += 3; else if (/pro/.test(id)) s += 2;
      if (/lite/.test(id)) s -= 1;
      if (/preview|exp|\d{2}-\d{2}|latest/.test(id)) s -= 0.5;
      return s;
    };
    this.models = arr(data.models)
      .filter((m) => arr(m.supportedGenerationMethods).includes('generateContent'))
      .map((m) => ({ id: str(m.name).replace(/^models\//, ''), label: str(m.displayName) }))
      .filter((m) => /^gemini-/.test(m.id) && !/(embedding|image|tts|audio|live|vision|aqa|robotics|computer-use|nano)/i.test(m.id))
      .sort((a, b) => score(b.id) - score(a.id));
    return this.models;
  },

  async call(prompt, { json = true, temperature = 0.5, maxTokens = 16384, model } = {}) {
    const key = App.apiKey();
    if (!key) throw new Error('Chưa nhập Gemini API Key.');
    const useModel = model || App.model();
    const data = await this.request(`models/${encodeURIComponent(useModel)}:generateContent`, key, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature, maxOutputTokens: maxTokens, ...(json ? { responseMimeType: 'application/json' } : {}) },
    });
    if (data.promptFeedback?.blockReason) throw new Error(`Gemini từ chối xử lý nội dung này (${data.promptFeedback.blockReason}).`);
    const cand = data.candidates?.[0];
    const text = cand?.content?.parts?.map((p) => p.text || '').join('') || '';
    if (!text) throw new Error('Gemini không trả về nội dung. Hãy thử lại.');
    if (!json) return text;
    try {
      return this.parseJSON(text);
    } catch (e) {
      if (cand.finishReason === 'MAX_TOKENS') throw new Error('Câu trả lời của AI bị cắt ngắn vì quá dài. Hãy giảm "Số câu mỗi vòng" rồi thử lại.');
      throw e;
    }
  },

  /* Gọi AI; nếu model không tồn tại (404) thì tự chuyển sang model khả dụng khác */
  async callWithFallback(prompt, opts) {
    try {
      return await this.call(prompt, opts);
    } catch (e) {
      if (e.status !== 404) throw e;
      if (!this.models.length) await this.listModels(App.apiKey()).catch(() => {});
      const alt = this.models.find((m) => m.id !== App.model() && /flash/.test(m.id)) || this.models.find((m) => m.id !== App.model());
      if (!alt) throw e;
      Connection.fillModels(alt.id);
      toast(`Model cũ không khả dụng – đã tự chuyển sang ${alt.id}`);
      return this.call(prompt, opts);
    }
  },

  parseJSON(text) {
    let t = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const s = t.indexOf('{'), e = t.lastIndexOf('}');
    if (s >= 0 && e > s) t = t.slice(s, e + 1);
    try {
      return JSON.parse(t);
    } catch (err) {
      throw new Error('Dữ liệu AI trả về bị lỗi định dạng. Hãy bấm phân tích lại.');
    }
  },

  async test() {
    await this.callWithFallback('Trả lời đúng một từ: OK', { json: false, maxTokens: 50 });
  },

  buildPrompt(text, grade, n, rounds) {
    const on = (t) => rounds.includes(t);
    const c = {
      mcq: on('mcq') ? n : 0,
      trueFalse: on('trueFalse') ? n : 0,
      fillBlank: on('fillBlank') ? n : 0,
      matching: on('matching') ? clamp(n, 4, 6) : 0,
      ordering: on('ordering') ? clamp(n + 1, 4, 7) : 0,
      openEnded: on('openEnded') ? (n <= 3 ? 1 : 2) : 0,
    };
    return `Bạn là giáo viên Ngữ văn THCS giỏi, am hiểu Chương trình GDPT 2018, đang thiết kế trò chơi đánh giá NĂNG LỰC ĐỌC HIỂU cho học sinh ${grade}.
Hãy đọc kĩ văn bản ở cuối, phân tích và tạo bộ câu hỏi.

YÊU CẦU BẮT BUỘC:
1. Mọi câu hỏi và đáp án phải căn cứ vào nội dung văn bản; tuyệt đối không bịa chi tiết không có trong văn bản.
2. Tiếng Việt chuẩn mực, phù hợp lứa tuổi ${grade}; câu hỏi ngắn gọn, rõ ràng (đọc được trên màn chiếu).
3. Gắn mức độ cho từng câu ("Nhận biết" | "Thông hiểu" | "Vận dụng"), phân bố khoảng 40% / 40% / 20%.
4. Phương án nhiễu hợp lí, độ dài tương đương đáp án đúng; không dùng "Tất cả đều đúng/sai".
5. Mỗi câu có "explain": giải thích ngắn 1–2 câu, nên dẫn chứng từ văn bản.
6. Nếu văn bản là thơ, nghị luận hoặc văn bản thông tin: "timeline" và "ordering" là trình tự các ý / khổ thơ / luận điểm; "characters" là nhân vật trữ tình hoặc đối tượng được nói tới (có thể để mảng rỗng).
7. Câu điền từ: lấy từ câu trong văn bản (có thể rút gọn), chỗ trống ghi đúng "____", đáp án là từ/cụm từ ngắn (1–4 tiếng), kèm đúng 4 lựa chọn (gồm đáp án đúng).
8. Nối cặp: vế trái là chi tiết/từ ngữ/nhân vật, vế phải là ý nghĩa/đặc điểm tương ứng; mỗi vế dưới 12 từ.
9. Sắp xếp: liệt kê các mục THEO ĐÚNG THỨ TỰ trong văn bản.
10. Nếu số lượng yêu cầu là 0 thì trả về mảng rỗng cho phần đó.

SỐ LƯỢNG: mcq ${c.mcq} câu; trueFalse ${c.trueFalse} câu; fillBlank ${c.fillBlank} câu; matching ${c.matching} cặp; ordering ${c.ordering} mục; openEnded ${c.openEnded} câu.

CHỈ TRẢ VỀ JSON theo đúng cấu trúc sau:
{
  "title": "Tên văn bản", "author": "Tác giả", "genre": "Thể loại", "gradeLevel": "${grade}",
  "summary": "Tóm tắt 3–4 câu", "theme": "Chủ đề", "mainIdeas": ["Ý chính / bố cục"],
  "characters": [{"name": "", "traits": "Đặc điểm ngắn"}],
  "timeline": ["Sự việc / ý theo thứ tự"],
  "artTechniques": [{"name": "Biện pháp / đặc sắc nghệ thuật", "example": "Dẫn chứng", "effect": "Tác dụng"}],
  "message": "Thông điệp, bài học", "vocabulary": [{"word": "", "meaning": ""}],
  "questions": {
    "mcq": [{"q": "", "options": ["", "", "", ""], "ans": 0, "level": "Nhận biết", "explain": ""}],
    "trueFalse": [{"statement": "", "answer": true, "level": "Nhận biết", "explain": ""}],
    "fillBlank": [{"sentence": "... ____ ...", "answer": "", "options": ["", "", "", ""], "level": "Nhận biết", "explain": ""}],
    "matching": {"instruction": "", "pairs": [{"left": "", "right": ""}]},
    "ordering": {"instruction": "", "items": ["mục 1", "mục 2"]},
    "openEnded": [{"q": "", "rubric": "Tiêu chí chấm", "sampleAnswer": "Đáp án gợi ý"}]
  }
}

VĂN BẢN:
"""
${text.slice(0, 25000)}
"""`;
  },

  async analyze(text, grade, n, rounds) {
    const raw = await this.callWithFallback(this.buildPrompt(text, grade, n, rounds));
    return Normalizer.analysis(raw, text);
  },

  async grade(text, q, rubric, answer) {
    const prompt = `Bạn là giáo viên Ngữ văn THCS chấm câu trả lời đọc hiểu, nhận xét khích lệ, ngắn gọn.
VĂN BẢN (trích): """${text.slice(0, 8000)}"""
CÂU HỎI: ${q}
TIÊU CHÍ CHẤM: ${rubric}
CÂU TRẢ LỜI CỦA HỌC SINH: """${answer.slice(0, 2000)}"""
Chấm thang 0–10. Chỉ trả về JSON: {"score": 0, "verdict": "Nhận xét chung 1 câu", "strengths": "Điểm tốt", "improve": "Cần bổ sung"}`;
    const r = await this.callWithFallback(prompt, { temperature: 0.2, maxTokens: 2048 });
    return {
      score: clamp(Math.round(Number(r.score) || 0), 0, 10),
      verdict: str(r.verdict), strengths: str(r.strengths), improve: str(r.improve),
    };
  },
};

/* ───────── CHUẨN HÓA DỮ LIỆU AI ───────── */
const Normalizer = {
  analysis(raw, text) {
    const q = raw.questions || {};
    const firstLine = str(text).split('\n').find((l) => l.trim()) || 'Văn bản đọc hiểu';
    return {
      title: str(raw.title) || firstLine.slice(0, 80),
      author: str(raw.author),
      genre: str(raw.genre),
      gradeLevel: str(raw.gradeLevel),
      summary: str(raw.summary),
      theme: str(raw.theme),
      mainIdeas: arr(raw.mainIdeas).map(str).filter(Boolean).slice(0, 6),
      characters: arr(raw.characters).map((c) => ({ name: str(c.name), traits: str(c.traits) })).filter((c) => c.name).slice(0, 6),
      timeline: arr(raw.timeline).map(str).filter(Boolean).slice(0, 8),
      artTechniques: arr(raw.artTechniques).map((t) => ({ name: str(t.name), example: str(t.example), effect: str(t.effect) })).filter((t) => t.name).slice(0, 5),
      message: str(raw.message),
      vocabulary: arr(raw.vocabulary).map((v) => ({ word: str(v.word), meaning: str(v.meaning) })).filter((v) => v.word).slice(0, 8),
      questions: {
        mcq: this.mcq(q.mcq),
        trueFalse: this.trueFalse(q.trueFalse),
        fillBlank: this.fillBlank(q.fillBlank),
        matching: this.matching(q.matching),
        ordering: this.ordering(q.ordering, raw.timeline),
        openEnded: this.openEnded(q.openEnded),
      },
    };
  },

  parseAns(ans, opts) {
    if (typeof ans === 'number') return Math.trunc(ans);
    const s = str(ans);
    if (/^[A-Da-d]$/.test(s)) return s.toUpperCase().charCodeAt(0) - 65;
    if (/^\d+$/.test(s)) return parseInt(s, 10);
    return opts.findIndex((o) => o.toLowerCase() === s.replace(/^[A-D][.):]\s*/i, '').toLowerCase());
  },

  mcq(list) {
    return arr(list).map((it) => {
      const opts = arr(it.options).map((o) => str(o).replace(/^[A-Da-d][.):]\s+/, '')).filter(Boolean).slice(0, 4);
      const ans = this.parseAns(it.ans, opts);
      if (!str(it.q) || opts.length < 2 || ans < 0 || ans >= opts.length) return null;
      const correct = opts[ans];
      const options = shuffle(opts);
      return { q: str(it.q), options, ans: options.indexOf(correct), level: str(it.level), explain: str(it.explain) };
    }).filter(Boolean);
  },

  trueFalse(list) {
    return arr(list).map((it) => {
      let a = it.answer;
      if (typeof a === 'string') a = /^(true|đúng|dung|đ|t)$/i.test(a.trim());
      if (!str(it.statement) || typeof a !== 'boolean') return null;
      return { statement: str(it.statement), answer: a, level: str(it.level), explain: str(it.explain) };
    }).filter(Boolean);
  },

  fillBlank(list) {
    return arr(list).map((it) => {
      const answer = str(it.answer);
      let sentence = str(it.sentence).replace(/_{2,}|…{2,}|\.{4,}/g, '____');
      if (!answer || !sentence) return null;
      if (!sentence.includes('____')) {
        const idx = sentence.toLowerCase().indexOf(answer.toLowerCase());
        if (idx < 0) return null;
        sentence = sentence.slice(0, idx) + '____' + sentence.slice(idx + answer.length);
      }
      let opts = [...new Set(arr(it.options).map(str).filter(Boolean))];
      if (!opts.some((o) => o.toLowerCase() === answer.toLowerCase())) opts.unshift(answer);
      const others = shuffle(opts.filter((o) => o.toLowerCase() !== answer.toLowerCase())).slice(0, 3);
      const options = shuffle([answer, ...others]);
      if (options.length < 2) return null;
      return { sentence, answer, options, ans: options.indexOf(answer), level: str(it.level), explain: str(it.explain) };
    }).filter(Boolean);
  },

  matching(m) {
    const pairs = arr(m?.pairs).map((p) => ({ left: str(p.left), right: str(p.right) })).filter((p) => p.left && p.right).slice(0, 6);
    return { instruction: str(m?.instruction) || 'Nối mỗi ý ở cột trái với ý phù hợp ở cột phải.', pairs: pairs.length >= 2 ? pairs : [] };
  },

  ordering(o, timeline) {
    let items = arr(o?.items).map(str).filter(Boolean).slice(0, 8);
    if (items.length < 3) items = arr(timeline).map(str).filter(Boolean).slice(0, 7);
    return { instruction: str(o?.instruction) || 'Sắp xếp theo đúng trình tự trong văn bản.', items: items.length >= 3 ? items : [] };
  },

  openEnded(list) {
    return arr(list).map((it) => (str(it.q) ? { q: str(it.q), rubric: str(it.rubric), sampleAnswer: str(it.sampleAnswer) } : null)).filter(Boolean);
  },
};

/* ───────── QUẢN LÝ KẾT NỐI GEMINI ───────── */
const Connection = {
  state: 'none',

  set(state, text) {
    this.state = state;
    const pill = $('connPill'), top = $('aiStatusTop');
    [pill, top].forEach((el) => { el.classList.remove('ok', 'error', 'checking'); if (state !== 'none') el.classList.add(state); });
    pill.textContent = `● ${text}`;
    top.textContent = { none: '🤖 AI: chưa kết nối', checking: '🤖 AI: đang kết nối…', ok: `🤖 AI: ${App.model()}`, error: '🤖 AI: lỗi kết nối' }[state];
    top.title = text;
  },

  /* Đổ danh sách model của key vào ô chọn, giữ lựa chọn cũ nếu còn hợp lệ */
  fillModels(preferId) {
    const list = AIService.models;
    if (!list.length) return;
    const sel = $('selModel');
    const current = preferId || (sel.value !== 'custom' ? sel.value : '') || localStorage.getItem('dh_model');
    sel.innerHTML = list.map((m, i) => `<option value="${esc(m.id)}">${esc(m.label || m.id)}${i === 0 ? ' – khuyên dùng' : ''} (${esc(m.id)})</option>`).join('')
      + '<option value="custom">Model tùy chỉnh…</option>';
    sel.value = list.some((m) => m.id === current) ? current : list[0].id;
    $('inpCustomModel').hidden = true;
    localStorage.setItem('dh_model', sel.value);
    $('modelHint').textContent = `(${list.length} model khả dụng với key này)`;
  },

  async connect({ silent = false } = {}) {
    const key = App.apiKey();
    if (!key) {
      this.set('none', 'Chưa kết nối');
      if (!silent) toast('Hãy dán Gemini API Key trước.', true);
      return false;
    }
    localStorage.setItem('dh_api_key', key);
    const b = $('btnTestKey');
    b.disabled = true;
    this.set('checking', 'Đang kết nối…');
    try {
      await AIService.listModels(key);
      if (!AIService.models.length) throw new Error('Key hợp lệ nhưng không có model Gemini nào khả dụng.');
      this.fillModels();
      await AIService.test();
      this.set('ok', `Đã kết nối · ${App.model()}`);
      if (!silent) toast(`✅ Kết nối Gemini thành công (${App.model()})`);
      return true;
    } catch (e) {
      this.set('error', 'Lỗi kết nối');
      if (!silent) toast(e.message, true);
      return false;
    } finally {
      b.disabled = false;
    }
  },
};

/* ───────── MÀN NẠP VĂN BẢN ───────── */
const Setup = {
  init() {
    const s = App.settings;
    $('selGrade').value = s.grade;
    $('selCount').value = String(s.count);
    $('inpApiKey').value = localStorage.getItem('dh_api_key') || localStorage.getItem('toan_ai_gemini_api_key') || '';
    const savedModel = localStorage.getItem('dh_model') || 'gemini-3.8-flash';
    if ([...$('selModel').options].some((o) => o.value === savedModel)) $('selModel').value = savedModel;
    $('inpCustomModel').value = localStorage.getItem('dh_custom_model') || '';
    $('inpCustomModel').hidden = $('selModel').value !== 'custom';
    $('btnRestore').hidden = !localStorage.getItem('dh_last_session');
    $('btnSound').textContent = Sound.enabled ? '🔊' : '🔇';

    $('roundToggles').innerHTML = ROUND_ORDER.map((t) => `
      <label class="round-toggle"><input type="checkbox" value="${t}" ${s.rounds.includes(t) ? 'checked' : ''}> ${ROUNDS[t].icon} ${ROUNDS[t].title}</label>`).join('');

    this.bind();
    this.updateCount();
    if (App.apiKey()) Connection.connect({ silent: true });
  },

  bind() {
    const txt = $('txtSource');
    txt.addEventListener('input', () => this.updateCount());
    $('btnClearText').onclick = () => { txt.value = ''; this.updateCount(); };

    const dz = $('dropzone');
    $('btnPickFile').onclick = (e) => { e.stopPropagation(); $('fileInput').click(); };
    dz.onclick = () => $('fileInput').click();
    $('fileInput').onchange = (e) => e.target.files[0] && this.loadFile(e.target.files[0]);
    dz.ondragover = (e) => { e.preventDefault(); dz.classList.add('dragover'); };
    dz.ondragleave = () => dz.classList.remove('dragover');
    dz.ondrop = (e) => {
      e.preventDefault();
      dz.classList.remove('dragover');
      if (e.dataTransfer.files[0]) this.loadFile(e.dataTransfer.files[0]);
    };

    $('selGrade').onchange = (e) => { App.settings.grade = e.target.value; localStorage.setItem('dh_grade', e.target.value); };
    $('selCount').onchange = (e) => { App.settings.count = parseInt(e.target.value, 10); localStorage.setItem('dh_count', e.target.value); };
    $('roundToggles').onchange = () => {
      App.settings.rounds = [...document.querySelectorAll('#roundToggles input:checked')].map((i) => i.value);
      localStorage.setItem('dh_rounds', JSON.stringify(App.settings.rounds));
    };

    $('inpApiKey').onchange = () => Connection.connect({ silent: true });
    $('btnToggleKey').onclick = () => { const i = $('inpApiKey'); i.type = i.type === 'password' ? 'text' : 'password'; };
    $('selModel').onchange = (e) => {
      localStorage.setItem('dh_model', e.target.value);
      $('inpCustomModel').hidden = e.target.value !== 'custom';
      if (Connection.state === 'ok') Connection.set('ok', `Đã kết nối · ${App.model()}`);
    };
    $('inpCustomModel').onchange = (e) => localStorage.setItem('dh_custom_model', e.target.value.trim());
    $('btnTestKey').onclick = () => Connection.connect();

    $('btnAnalyze').onclick = () => this.analyze();
    $('btnSample').onclick = () => this.useSample();
    $('btnRestore').onclick = () => this.restore();
  },

  updateCount() {
    const n = $('txtSource').value.length;
    $('charCount').textContent = `${n.toLocaleString('vi-VN')} ký tự`;
  },

  async loadFile(file) {
    toast(`Đang đọc file "${file.name}"…`);
    try {
      const text = await FileLoader.read(file);
      $('txtSource').value = text;
      this.updateCount();
      toast(`✅ Đã đọc xong "${file.name}"`);
    } catch (e) {
      toast(e.message, true);
    } finally {
      $('fileInput').value = '';
    }
  },

  async analyze() {
    const text = $('txtSource').value.trim();
    if (text.length < 150) return toast('Văn bản quá ngắn. Hãy dán bài văn đầy đủ (ít nhất khoảng 150 ký tự).', true);
    if (!App.settings.rounds.length) return toast('Hãy chọn ít nhất 1 vòng chơi.', true);
    if (!App.apiKey()) return toast('Hãy nhập Gemini API Key, hoặc bấm "Dùng bài mẫu" để chơi thử.', true);
    localStorage.setItem('dh_api_key', App.apiKey());

    showScreen('screenLoading');
    const steps = ['Đang xác định thể loại, chủ đề, nhân vật…', 'Đang tìm các chi tiết và biện pháp nghệ thuật…', 'Đang soạn câu hỏi theo 3 mức độ nhận thức…', 'Đang kiểm tra đáp án và lời giải thích…'];
    let i = 0;
    $('loadingStep').textContent = steps[0];
    const timer = setInterval(() => { i = (i + 1) % steps.length; $('loadingStep').textContent = steps[i]; }, 3500);
    try {
      App.analysis = await AIService.analyze(text, App.settings.grade, App.settings.count, App.settings.rounds);
      App.sourceText = text;
      App.isDemo = false;
      App.saveSession();
      Connection.set('ok', `Đã kết nối · ${App.model()}`);
      Preview.render();
    } catch (e) {
      showScreen('screenSetup');
      if (e.status) Connection.set('error', 'Lỗi kết nối');
      toast(e.message, true);
    } finally {
      clearInterval(timer);
    }
  },

  useSample() {
    App.sourceText = window.SAMPLE_TEXT;
    App.analysis = Normalizer.analysis(JSON.parse(JSON.stringify(window.SAMPLE_ANALYSIS)), window.SAMPLE_TEXT);
    App.isDemo = true;
    $('txtSource').value = window.SAMPLE_TEXT;
    this.updateCount();
    Preview.render();
  },

  restore() {
    try {
      const s = JSON.parse(localStorage.getItem('dh_last_session'));
      App.sourceText = s.text;
      App.analysis = s.analysis;
      App.isDemo = !!s.isDemo;
      $('txtSource').value = s.text;
      this.updateCount();
      Preview.render();
    } catch (e) {
      toast('Không mở được bộ câu hỏi đã lưu.', true);
    }
  },
};

/* ───────── MÀN XEM TRƯỚC & DUYỆT ───────── */
const Preview = {
  render() {
    const a = App.analysis;
    $('pvTitle').textContent = a.title;
    $('pvMeta').textContent = [a.author, a.genre, a.gradeLevel].filter(Boolean).join(' · ');
    $('pvSummary').textContent = a.summary || '(AI chưa tóm tắt)';
    $('pvTheme').textContent = a.theme || '—';
    $('drawerText').textContent = App.sourceText;

    const Q = a.questions;
    const html = App.settings.rounds.filter((t) => ROUND_ORDER.includes(t)).map((t) => {
      const meta = ROUNDS[t];
      let items = [];
      if (t === 'mcq') items = Q.mcq.map((x, i) => this.item(t, i, `${esc(x.q)} ${lvlBadge(x.level)}<br><span class="pv-ans">✓ ${esc(x.options[x.ans])}</span>`));
      if (t === 'trueFalse') items = Q.trueFalse.map((x, i) => this.item(t, i, `${esc(x.statement)} ${lvlBadge(x.level)}<br><span class="pv-ans">✓ ${x.answer ? 'ĐÚNG' : 'SAI'}</span>`));
      if (t === 'fillBlank') items = Q.fillBlank.map((x, i) => this.item(t, i, `${esc(x.sentence)} ${lvlBadge(x.level)}<br><span class="pv-ans">✓ ${esc(x.answer)}</span> <span class="muted small">(lựa chọn: ${x.options.map(esc).join(' / ')})</span>`));
      if (t === 'matching') items = Q.matching.pairs.map((p, i) => this.item(t, i, `${esc(p.left)} <strong>⟶</strong> ${esc(p.right)}`));
      if (t === 'ordering') items = Q.ordering.items.map((s, i) => this.item(t, i, `<strong>${i + 1}.</strong> ${esc(s)}`));
      if (t === 'openEnded') items = Q.openEnded.map((x, i) => this.item(t, i, `${esc(x.q)}<br><span class="muted small">Tiêu chí: ${esc(x.rubric)}</span>`));
      const count = items.length;
      return `<div class="card pv-round">
        <h3 class="card-title">${meta.icon} ${meta.title} <span class="pv-count">${count} ${t === 'matching' ? 'cặp' : t === 'ordering' ? 'mục' : 'câu'}</span></h3>
        ${count ? items.join('') : '<p class="muted">Không có câu hỏi – vòng này sẽ được bỏ qua.</p>'}
      </div>`;
    }).join('');
    $('pvRounds').innerHTML = html;
    showScreen('screenPreview');
  },

  item(type, idx, body) {
    return `<div class="pv-item"><div class="pv-item-body">${body}</div>
      <button class="btn small danger" onclick="Preview.remove('${type}', ${idx})" title="Xóa">🗑</button></div>`;
  },

  remove(type, idx) {
    const Q = App.analysis.questions;
    if (type === 'matching') {
      Q.matching.pairs.splice(idx, 1);
      if (Q.matching.pairs.length < 2) Q.matching.pairs = [];
    } else if (type === 'ordering') {
      Q.ordering.items.splice(idx, 1);
      if (Q.ordering.items.length < 3) Q.ordering.items = [];
    } else {
      Q[type].splice(idx, 1);
    }
    App.saveSession();
    this.render();
  },
};

/* ───────── ENGINE TRÒ CHƠI ───────── */
const Game = {
  rounds: [],
  rIdx: 0,
  iIdx: 0,
  done: 0,
  totalSteps: 0,
  score: 0,
  stats: {},
  levels: {},
  review: [],
  keys: null,
  locked: false,

  start() {
    const Q = App.analysis.questions;
    this.rounds = App.settings.rounds.filter((t) => ROUND_ORDER.includes(t)).sort((a, b) => ROUND_ORDER.indexOf(a) - ROUND_ORDER.indexOf(b)).map((t) => {
      if (t === 'matching') return { type: t, items: Q.matching.pairs.length >= 2 ? [Q.matching] : [] };
      if (t === 'ordering') return { type: t, items: Q.ordering.items.length >= 3 ? [Q.ordering] : [] };
      return { type: t, items: Q[t] };
    }).filter((r) => r.items.length);

    if (!this.rounds.length) return toast('Không còn câu hỏi nào để chơi. Hãy nạp lại bài văn.', true);

    Sound.stopAll();
    this.rIdx = 0; this.iIdx = 0; this.done = 0; this.score = 0; this.review = []; this.log = [];
    this.totalSteps = this.rounds.reduce((s, r) => s + r.items.length, 0);
    this.stats = {};
    this.rounds.forEach((r) => { this.stats[r.type] = { points: 0, max: 0, correct: 0, total: 0 }; });
    this.levels = { NB: { c: 0, t: 0 }, TH: { c: 0, t: 0 }, VD: { c: 0, t: 0 } };
    $('drawerText').textContent = App.sourceText;
    showScreen('screenGame');
    this.updateHud();
    this.roundIntro();
  },

  get round() { return this.rounds[this.rIdx]; },
  get item() { return this.round.items[this.iIdx]; },
  stage(html) { $('gameStage').innerHTML = html; },

  updateHud() {
    const r = this.round;
    $('hudRound').textContent = r ? `Vòng ${this.rIdx + 1}/${this.rounds.length} · ${ROUNDS[r.type].title}` : 'Hoàn thành';
    $('hudProgress').style.width = `${(this.done / this.totalSteps) * 100}%`;
    $('hudScore').textContent = this.score;
    const ok = this.log.filter((x) => x.ok).length;
    $('hudOk').textContent = ok;
    $('hudBad').textContent = this.log.length - ok;
  },

  roundIntro() {
    const m = ROUNDS[this.round.type];
    Sound.play('round');
    this.stage(`<div class="round-intro">
      <div class="ri-icon">${m.icon}</div>
      <div class="ri-step">Vòng ${this.rIdx + 1} / ${this.rounds.length}</div>
      <h2>${m.title}</h2>
      <p>${m.desc}</p>
      <button class="btn primary big" id="btnGo">Bắt đầu vòng ${this.rIdx + 1} ➜</button>
    </div>`);
    this.keys = { next: () => this.renderItem() };
    $('btnGo').onclick = () => this.renderItem();
    $('btnGo').focus();
  },

  renderItem() {
    this.locked = false;
    this.updateHud();
    const t = this.round.type;
    if (t === 'mcq') return this.renderChoice('mcq');
    if (t === 'trueFalse') return this.renderTrueFalse();
    if (t === 'fillBlank') return this.renderChoice('fillBlank');
    if (t === 'matching') return this.renderMatching();
    if (t === 'ordering') return this.renderOrdering();
    if (t === 'openEnded') return this.renderOpen();
  },

  qMeta(extra = '') {
    const r = this.round;
    return `<div class="q-meta">Câu ${this.iIdx + 1}/${r.items.length} ${extra}</div>`;
  },

  /* Ghi nhận kết quả 1 lượt. entries: [{ q, chosen, correct, ok }] – dùng cho bảng thống kê đúng/sai */
  record(points, max, correct, total, level, reviewText, entries = []) {
    const s = this.stats[this.round.type];
    s.points += points; s.max += max; s.correct += correct; s.total += total;
    const L = this.levels[levelKey(level)];
    L.c += correct; L.t += total;
    this.score += points;
    if (reviewText && correct < total) this.review.push(reviewText);
    entries.forEach((e) => this.log.push({ ...e, type: this.round.type, level: LEVEL_NAMES[levelKey(level)] }));
    this.done++;
    this.updateHud();
  },

  feedback(kind, title, body) {
    const icon = { ok: '🎉', bad: '💡', info: '📝' }[kind];
    return `<div class="feedback ${kind}"><div class="fb-icon">${icon}</div><div><div class="fb-title">${title}</div>${body ? `<div>${body}</div>` : ''}</div></div>
      <div class="action-row"><button class="btn primary big" id="btnNext">Tiếp tục ➜</button></div>`;
  },

  showNext(html) {
    $('fbArea').innerHTML = html;
    this.keys = { next: () => this.next() };
    $('btnNext').onclick = () => this.next();
    $('btnNext').focus({ preventScroll: true });
    $('fbArea').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  next() {
    this.iIdx++;
    if (this.iIdx < this.round.items.length) return this.renderItem();
    this.roundSummary();
  },

  roundSummary() {
    const s = this.stats[this.round.type];
    const pct = s.max ? Math.round((s.points / s.max) * 100) : 0;
    const last = this.rIdx === this.rounds.length - 1;
    const msg = pct >= 80 ? 'Xuất sắc! Cả lớp đọc hiểu rất tốt 👏' : pct >= 50 ? 'Khá tốt! Cố gắng thêm ở vòng sau nhé 💪' : 'Cần đọc lại văn bản kĩ hơn một chút 📖';
    Sound.play('round');
    this.stage(`<div class="round-summary">
      <div style="font-size:60px">${pct >= 80 ? '🏆' : pct >= 50 ? '⭐' : '📖'}</div>
      <h2>Hoàn thành vòng ${this.rIdx + 1}: ${ROUNDS[this.round.type].title}</h2>
      <div class="big-num">${pct}%</div>
      <p style="font-size:20px;color:#cbd5e1;margin-bottom:26px">${msg}</p>
      <button class="btn primary big" id="btnGo">${last ? '📊 Xem Infographic chốt kiến thức' : `Sang vòng ${this.rIdx + 2} ➜`}</button>
    </div>`);
    const go = () => {
      if (last) return this.finish();
      this.rIdx++; this.iIdx = 0;
      this.updateHud();
      this.roundIntro();
    };
    this.keys = { next: go };
    $('btnGo').onclick = go;
    $('btnGo').focus();
  },

  /* ── Vòng trắc nghiệm & điền từ (chọn 1, rồi chốt) ── */
  renderChoice(type) {
    const it = this.item;
    const isFill = type === 'fillBlank';
    const qHtml = isFill
      ? esc(it.sentence).replace('____', '<span class="blank" id="blank">?</span>')
      : esc(it.q);
    const optsHtml = isFill
      ? `<div class="chips">${it.options.map((o, i) => `<button class="chip" data-i="${i}">${esc(o)}</button>`).join('')}</div>`
      : `<div class="options">${it.options.map((o, i) => `<button class="opt c${i}" data-i="${i}"><span class="opt-key">${'ABCD'[i]}</span><span>${esc(o)}</span></button>`).join('')}</div>`;

    this.stage(`<div class="q-card">${this.qMeta(lvlBadge(it.level))}<div class="q-text">${qHtml}</div>
      ${isFill ? '<div class="q-hint">Chọn từ ngữ phù hợp điền vào chỗ trống:</div>' : ''}</div>
      ${optsHtml}
      <div class="action-row"><button class="btn primary big" id="btnConfirm" disabled>🔒 Chốt đáp án</button></div>
      <div id="fbArea"></div>`);

    let sel = -1;
    const btns = [...document.querySelectorAll('#gameStage [data-i]')];
    const select = (i) => {
      if (this.locked || i >= btns.length) return;
      sel = i;
      Sound.play('click');
      btns.forEach((b, j) => b.classList.toggle('selected', j === i));
      if (isFill) $('blank').textContent = it.options[i];
      $('btnConfirm').disabled = false;
    };
    const confirm = () => {
      if (this.locked || sel < 0) return;
      this.locked = true;
      const ok = sel === it.ans;
      btns.forEach((b, j) => {
        b.disabled = true;
        b.classList.remove('selected');
        if (j === it.ans) b.classList.add('right');
        else if (j === sel) b.classList.add('wrong');
        else if (!isFill) b.classList.add('dim');
      });
      if (isFill) {
        $('blank').textContent = it.answer;
        $('blank').classList.add(ok ? 'filled-ok' : 'filled-bad');
      }
      $('btnConfirm').parentElement.remove();
      Sound.play(ok ? 'correct' : 'wrong');
      const ansText = isFill ? it.answer : `${'ABCD'[it.ans]}. ${it.options[it.ans]}`;
      const chosenText = isFill ? it.options[sel] : `${'ABCD'[sel]}. ${it.options[sel]}`;
      this.record(ok ? 10 : 0, 10, ok ? 1 : 0, 1, it.level, `${isFill ? it.sentence.replace('____', `[${it.answer}]`) : it.q} → ${isFill ? '' : ansText}`.replace(/ → $/, ''),
        [{ q: isFill ? it.sentence : it.q, chosen: chosenText, correct: ansText, ok }]);
      this.showNext(this.feedback(ok ? 'ok' : 'bad', ok ? 'Chính xác! +10 điểm' : `Chưa đúng. Đáp án: ${esc(ansText)}`, esc(it.explain)));
    };
    btns.forEach((b) => (b.onclick = () => select(+b.dataset.i)));
    $('btnConfirm').onclick = confirm;
    this.keys = { select, confirm };
  },

  /* ── Vòng Đúng / Sai ── */
  renderTrueFalse() {
    const it = this.item;
    this.stage(`<div class="q-card">${this.qMeta(lvlBadge(it.level))}<div class="q-text">“${esc(it.statement)}”</div></div>
      <div class="tf-options">
        <button class="opt tf-true" data-i="0"><span class="opt-key">1</span>✔ ĐÚNG</button>
        <button class="opt tf-false" data-i="1"><span class="opt-key">2</span>✘ SAI</button>
      </div>
      <div class="action-row"><button class="btn primary big" id="btnConfirm" disabled>🔒 Chốt đáp án</button></div>
      <div id="fbArea"></div>`);
    let sel = -1;
    const btns = [...document.querySelectorAll('#gameStage [data-i]')];
    const correctIdx = it.answer ? 0 : 1;
    const select = (i) => {
      if (this.locked || i > 1) return;
      sel = i;
      Sound.play('click');
      btns.forEach((b, j) => b.classList.toggle('selected', j === i));
      $('btnConfirm').disabled = false;
    };
    const confirm = () => {
      if (this.locked || sel < 0) return;
      this.locked = true;
      const ok = sel === correctIdx;
      btns.forEach((b, j) => {
        b.disabled = true;
        b.classList.remove('selected');
        b.classList.add(j === correctIdx ? 'right' : (j === sel ? 'wrong' : 'dim'));
      });
      $('btnConfirm').parentElement.remove();
      Sound.play(ok ? 'correct' : 'wrong');
      this.record(ok ? 10 : 0, 10, ok ? 1 : 0, 1, it.level, `“${it.statement}” → ${it.answer ? 'ĐÚNG' : 'SAI'}`,
        [{ q: it.statement, chosen: sel === 0 ? 'ĐÚNG' : 'SAI', correct: it.answer ? 'ĐÚNG' : 'SAI', ok }]);
      this.showNext(this.feedback(ok ? 'ok' : 'bad', ok ? 'Chính xác! +10 điểm' : `Chưa đúng. Nhận định này ${it.answer ? 'ĐÚNG' : 'SAI'}.`, esc(it.explain)));
    };
    btns.forEach((b) => (b.onclick = () => select(+b.dataset.i)));
    $('btnConfirm').onclick = confirm;
    this.keys = { select, confirm };
  },

  /* ── Vòng Nối cặp ── */
  renderMatching() {
    const m = this.item;
    const n = m.pairs.length;
    const rightOrder = shuffle([...Array(n).keys()]);
    const colors = ['#e11d48', '#2563eb', '#d97706', '#16a34a', '#7c3aed', '#0891b2'];
    const links = {}; // leftIdx -> rightIdx
    let activeL = null, activeR = null;

    this.stage(`<div class="q-card"><div class="q-meta">${n} cặp · Bấm 1 ý bên trái rồi bấm ý tương ứng bên phải (bấm lại để gỡ)</div>
      <div class="q-text" style="font-size:24px">${esc(m.instruction)}</div></div>
      <div class="match-board">
        <div class="match-col">${m.pairs.map((p, i) => `<button class="match-item" data-side="L" data-i="${i}">${esc(p.left)}</button>`).join('')}</div>
        <div class="match-col">${rightOrder.map((ri) => `<button class="match-item" data-side="R" data-i="${ri}">${esc(m.pairs[ri].right)}</button>`).join('')}</div>
      </div>
      <div class="action-row"><button class="btn primary big" id="btnConfirm" disabled>✅ Kiểm tra</button></div>
      <div id="fbArea"></div>`);

    const el = (side, i) => document.querySelector(`.match-item[data-side="${side}"][data-i="${i}"]`);
    const paint = () => {
      document.querySelectorAll('.match-item').forEach((b) => { b.classList.remove('active'); b.querySelector('.pair-tag')?.remove(); b.style.borderColor = ''; });
      Object.entries(links).forEach(([l, r], k) => {
        const c = colors[k % colors.length];
        [el('L', l), el('R', r)].forEach((b) => {
          b.style.borderColor = c;
          b.insertAdjacentHTML('beforeend', `<span class="pair-tag" style="background:${c}">${k + 1}</span>`);
        });
      });
      if (activeL !== null) el('L', activeL).classList.add('active');
      if (activeR !== null) el('R', activeR).classList.add('active');
      $('btnConfirm').disabled = Object.keys(links).length !== n;
    };
    const tryLink = () => {
      if (activeL === null || activeR === null) return;
      links[activeL] = activeR;
      activeL = activeR = null;
      Sound.play('click');
    };
    document.querySelectorAll('.match-item').forEach((b) => {
      b.onclick = () => {
        if (this.locked) return;
        const i = +b.dataset.i;
        if (b.dataset.side === 'L') {
          if (i in links) { delete links[i]; activeL = null; }
          else activeL = activeL === i ? null : i;
        } else {
          const owner = Object.keys(links).find((l) => links[l] === i);
          if (owner !== undefined) { delete links[owner]; activeR = null; }
          else activeR = activeR === i ? null : i;
        }
        tryLink();
        paint();
      };
    });

    const confirm = () => {
      if (this.locked || Object.keys(links).length !== n) return;
      this.locked = true;
      let correct = 0;
      m.pairs.forEach((p, i) => {
        const ok = links[i] === i;
        if (ok) correct++;
        const L = el('L', i), R = el('R', links[i]);
        L.classList.add(ok ? 'right' : 'wrong');
        R.classList.add(ok ? 'right' : 'wrong');
        if (!ok) {
          L.insertAdjacentHTML('beforeend', `<div class="match-fix">✓ Đúng: ${esc(p.right)}</div>`);
          this.review.push(`Nối cặp: ${p.left} ⟶ ${p.right}`);
        }
      });
      document.querySelectorAll('.match-item').forEach((b) => (b.disabled = true));
      $('btnConfirm').parentElement.remove();
      const all = correct === n;
      Sound.play(correct >= n / 2 ? 'correct' : 'wrong');
      this.record(correct * 5, n * 5, correct, n, 'Thông hiểu', null,
        m.pairs.map((p, i) => ({ q: `Nối: ${p.left}`, chosen: m.pairs[links[i]].right, correct: p.right, ok: links[i] === i })));
      this.showNext(this.feedback(all ? 'ok' : 'bad', `Nối đúng ${correct}/${n} cặp · +${correct * 5} điểm`, all ? 'Tuyệt vời, nối đúng tất cả!' : 'Xem các cặp đúng được ghi dưới mỗi ô màu đỏ.'));
    };
    $('btnConfirm').onclick = confirm;
    this.keys = { confirm };
  },

  /* ── Vòng Sắp xếp trình tự ── */
  renderOrdering() {
    const o = this.item;
    const n = o.items.length;
    let order = shuffle([...Array(n).keys()]);
    for (let t = 0; t < 10 && order.every((v, i) => v === i); t++) order = shuffle(order);

    this.stage(`<div class="q-card"><div class="q-meta">${n} mục · Kéo thả hoặc dùng nút ▲▼ để sắp xếp</div>
      <div class="q-text" style="font-size:24px">${esc(o.instruction)}</div></div>
      <div class="order-list" id="orderList"></div>
      <div class="action-row"><button class="btn primary big" id="btnConfirm">✅ Kiểm tra thứ tự</button></div>
      <div id="fbArea"></div>`);

    let dragFrom = null;
    const draw = (checked = false) => {
      $('orderList').innerHTML = order.map((v, p) => {
        const cls = checked ? (v === p ? 'right' : 'wrong') : '';
        return `<div class="order-item ${cls}" draggable="${!checked}" data-p="${p}">
          <div class="order-num">${p + 1}</div>
          <div class="order-text">${esc(o.items[v])}${checked && v !== p ? `<div class="order-correct">✓ Vị trí đúng: số ${v + 1}</div>` : ''}</div>
          ${checked ? '' : `<div class="order-btns"><button data-mv="-1" data-p="${p}" ${p === 0 ? 'disabled' : ''}>▲</button><button data-mv="1" data-p="${p}" ${p === n - 1 ? 'disabled' : ''}>▼</button></div>`}
        </div>`;
      }).join('');
      if (checked) return;
      $('orderList').querySelectorAll('[data-mv]').forEach((b) => {
        b.onclick = () => {
          const p = +b.dataset.p, q = p + +b.dataset.mv;
          [order[p], order[q]] = [order[q], order[p]];
          Sound.play('click');
          draw();
        };
      });
      $('orderList').querySelectorAll('.order-item').forEach((row) => {
        row.ondragstart = () => { dragFrom = +row.dataset.p; row.classList.add('dragging'); };
        row.ondragend = () => row.classList.remove('dragging');
        row.ondragover = (e) => { e.preventDefault(); row.classList.add('drag-over'); };
        row.ondragleave = () => row.classList.remove('drag-over');
        row.ondrop = (e) => {
          e.preventDefault();
          const to = +row.dataset.p;
          if (dragFrom === null || dragFrom === to) return;
          const [moved] = order.splice(dragFrom, 1);
          order.splice(to, 0, moved);
          dragFrom = null;
          Sound.play('click');
          draw();
        };
      });
    };
    draw();

    const confirm = () => {
      if (this.locked) return;
      this.locked = true;
      const correct = order.filter((v, p) => v === p).length;
      draw(true);
      $('btnConfirm').parentElement.remove();
      const all = correct === n;
      Sound.play(correct >= n / 2 ? 'correct' : 'wrong');
      this.record(correct * 4, n * 4, correct, n, 'Thông hiểu', all ? null : `Trình tự đúng: ${o.items.map((s, i) => `(${i + 1}) ${s}`).join(' → ')}`,
        order.map((v, p) => ({ q: `Sắp xếp: ${o.items[v]}`, chosen: `Vị trí ${p + 1}`, correct: `Vị trí ${v + 1}`, ok: v === p })));
      this.showNext(this.feedback(all ? 'ok' : 'bad', `Đúng vị trí ${correct}/${n} mục · +${correct * 4} điểm`, all ? 'Hoàn hảo! Nắm rất chắc diễn biến văn bản.' : 'Các mục màu đỏ có ghi vị trí đúng bên dưới.'));
    };
    $('btnConfirm').onclick = confirm;
    this.keys = { confirm };
  },

  /* ── Vòng Tự luận ngắn ── */
  renderOpen() {
    const it = this.item;
    const hasKey = !!App.apiKey();
    this.stage(`<div class="q-card">${this.qMeta(lvlBadge('Vận dụng'))}<div class="q-text">${esc(it.q)}</div></div>
      <div class="card">
        <label class="field-label" for="openAns">✍️ Câu trả lời của học sinh / của lớp:</label>
        <textarea id="openAns" class="open-answer" placeholder="Giáo viên nhập câu trả lời của học sinh vào đây…"></textarea>
        <div class="action-row">
          ${hasKey ? '<button class="btn primary big" id="btnAIGrade">🤖 AI chấm điểm</button>' : ''}
          <button class="btn ${hasKey ? 'ghost' : 'primary big'}" id="btnSelfGrade">👁 Xem gợi ý &amp; giáo viên tự chấm</button>
        </div>
        <div id="gradeArea"></div>
      </div>
      <div id="fbArea"></div>`);

    const finish = (score, title, body, grader) => {
      if (this.locked) return;
      this.locked = true;
      const ans = $('openAns').value.trim();
      $('openAns').disabled = true;
      document.querySelectorAll('#btnAIGrade, #btnSelfGrade, .grade-row button').forEach((b) => (b.disabled = true));
      Sound.play(score >= 5 ? 'correct' : 'wrong');
      this.record(score * 2, 20, score / 10, 1, 'Vận dụng', score >= 5 ? null : `Tự luận: ${it.q}`,
        [{ q: it.q, chosen: ans || '(không ghi câu trả lời)', correct: `${grader} chấm ${score}/10 (đạt từ 5)`, ok: score >= 5 }]);
      this.showNext(this.feedback(score >= 5 ? 'ok' : 'info', title, body));
    };

    const sampleHtml = () => `<div class="sample-box"><strong>📌 Gợi ý đáp án:</strong> ${esc(it.sampleAnswer || '—')}<br><strong>🎯 Tiêu chí:</strong> ${esc(it.rubric || '—')}</div>`;

    $('btnSelfGrade').onclick = () => {
      $('gradeArea').innerHTML = `${sampleHtml()}
        <div class="field-label" style="text-align:center;margin-top:14px">Giáo viên chấm:</div>
        <div class="grade-row">
          <button class="btn ghost" data-s="0">Chưa trả lời (0)</button>
          <button class="btn ghost" data-s="4">Chưa đạt (4)</button>
          <button class="btn ghost" data-s="7">Đạt (7)</button>
          <button class="btn" data-s="10">Tốt (10)</button>
        </div>`;
      $('gradeArea').querySelectorAll('[data-s]').forEach((b) => {
        b.onclick = () => finish(+b.dataset.s, `Giáo viên chấm: ${b.dataset.s}/10 · +${b.dataset.s * 2} điểm`, '', 'Giáo viên');
      });
    };

    if (hasKey) {
      $('btnAIGrade').onclick = async () => {
        const ans = $('openAns').value.trim();
        if (ans.length < 10) return toast('Hãy nhập câu trả lời (ít nhất vài từ) trước khi nhờ AI chấm.', true);
        const b = $('btnAIGrade');
        b.disabled = true; b.textContent = '🤖 AI đang chấm…';
        try {
          const g = await AIService.grade(App.sourceText, it.q, it.rubric, ans);
          $('gradeArea').innerHTML = sampleHtml();
          finish(g.score, `AI chấm: ${g.score}/10 · +${g.score * 2} điểm`,
            `${esc(g.verdict)}${g.strengths ? `<br>👍 <strong>Điểm tốt:</strong> ${esc(g.strengths)}` : ''}${g.improve ? `<br>🔧 <strong>Cần bổ sung:</strong> ${esc(g.improve)}` : ''}<br><span class="small">Giáo viên có thể điều chỉnh nhận xét nếu cần.</span>`, 'AI');
        } catch (e) {
          toast(`${e.message} – Chuyển sang giáo viên tự chấm.`, true);
          b.disabled = false; b.textContent = '🤖 AI chấm điểm';
          $('btnSelfGrade').click();
        }
      };
    }
    this.keys = {};
  },

  finish() {
    $('hudProgress').style.width = '100%';
    Sound.play('end');
    Result.render();
  },
};

/* ───────── INFOGRAPHIC CHỐT KIẾN THỨC ───────── */
const Result = {
  render() {
    const a = App.analysis;
    const G = Game;
    const max = Object.values(G.stats).reduce((s, x) => s + x.max, 0);
    const pct = max ? Math.round((G.score / max) * 100) : 0;
    const rating = pct >= 85 ? 'Xuất sắc' : pct >= 70 ? 'Tốt' : pct >= 50 ? 'Đạt' : 'Cần ôn thêm';
    const ringColor = pct >= 70 ? '#14b8a6' : pct >= 50 ? '#f59e0b' : '#dc2626';
    const bar = (label, v) => `<div class="bar-row"><span>${label}</span><div class="bar-track"><div class="bar-fill" style="width:${v}%"></div></div><span class="bar-val">${v}%</span></div>`;

    const roundBars = G.rounds.map((r) => {
      const s = G.stats[r.type];
      return bar(`${ROUNDS[r.type].icon} ${ROUNDS[r.type].title}`, s.max ? Math.round((s.points / s.max) * 100) : 0);
    }).join('');
    const levelBars = ['NB', 'TH', 'VD'].filter((k) => G.levels[k].t > 0)
      .map((k) => bar(LEVEL_NAMES[k], Math.round((G.levels[k].c / G.levels[k].t) * 100))).join('');

    const box = (cls, span, title, body) => (body ? `<div class="ig-box ${cls} span-${span}"><h4>${title}</h4>${body}</div>` : '');
    const tags = [a.author, a.genre, a.gradeLevel].filter(Boolean).map((t) => `<span class="ig-tag">${esc(t)}</span>`).join('');

    const timeline = a.timeline.length ? `<div class="ig-timeline">${a.timeline.map((s, i) => `<div class="ig-step"><div class="ig-step-num">${i + 1}</div><div class="ig-step-text">${esc(s)}</div></div>`).join('')}</div>` : '';
    const chars = a.characters.length ? `<div class="ig-chars">${a.characters.map((c) => `<div class="ig-char"><strong>${esc(c.name)}</strong><span>${esc(c.traits)}</span></div>`).join('')}</div>` : '';
    const techs = a.artTechniques.map((t) => `<div class="ig-tech"><strong>${esc(t.name)}</strong>${t.example ? ` – <em>“${esc(t.example)}”</em>` : ''}${t.effect ? `<br>➜ ${esc(t.effect)}` : ''}</div>`).join('');
    const ideas = a.mainIdeas.length ? `<ol class="ig-ideas">${a.mainIdeas.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>` : '';
    const vocab = a.vocabulary.length ? `<div class="ig-vocab">${a.vocabulary.map((v) => `<span><strong>${esc(v.word)}</strong>: ${esc(v.meaning)}</span>`).join('')}</div>` : '';
    const review = G.review.length
      ? `<ul class="ig-review">${G.review.slice(0, 8).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`
      : '<p>🎉 Lớp đã trả lời đúng tất cả các câu hỏi. Tuyệt vời!</p>';

    $('infographic').innerHTML = `<div class="ig">
      <div class="ig-head">
        <div>
          <div class="ig-kicker">Infographic chốt kiến thức · Đọc hiểu văn bản</div>
          <div class="ig-title">${esc(a.title)}</div>
          <div class="ig-tags">${tags}</div>
        </div>
        <div class="ig-score" style="background:conic-gradient(${ringColor} ${pct * 3.6}deg, #e2e8f0 0)">
          <div class="ig-score-inner"><div class="ig-score-num">${pct}%</div><div class="ig-score-lbl">${rating}<br>${G.score}/${max} điểm</div></div>
        </div>
      </div>
      <div class="ig-grid">
        ${box('teal', a.theme ? 8 : 12, '📌 Tóm tắt văn bản', a.summary ? `<p>${esc(a.summary)}</p>` : '')}
        ${box('dark', 4, '🎯 Chủ đề', a.theme ? `<p class="ig-message">${esc(a.theme)}</p>` : '')}
        ${box('', 12, '🧭 Trình tự sự việc / mạch ý', timeline)}
        ${box('pink', techs ? 6 : 12, '👥 Nhân vật', chars)}
        ${box('violet', chars ? 6 : 12, '🎨 Đặc sắc nghệ thuật', techs)}
        ${box('blue', a.message ? 7 : 12, '🗂 Ý chính / Bố cục', ideas)}
        ${box('amber', ideas ? 5 : 12, '💡 Thông điệp – Bài học', a.message ? `<p class="ig-message">${esc(a.message)}</p>` : '')}
        ${box('blue', 5, '📚 Từ ngữ cần nhớ', vocab)}
        ${box('', vocab ? 7 : 12, '📊 Kết quả đọc hiểu của lớp', `${this.tallyLine()}${roundBars}${levelBars ? `<div style="margin-top:10px;font-weight:800;font-size:13px;color:#64748b">THEO MỨC ĐỘ NHẬN THỨC</div>${levelBars}` : ''}`)}
        ${box('pink', 12, '🔁 Nội dung cần ôn lại', review)}
      </div>
      <div class="ig-foot">Tạo bởi “Đọc Hiểu Cùng AI” · Gemini + Antigravity · ${new Date().toLocaleDateString('vi-VN')}${App.isDemo ? ' · Bài mẫu' : ''}</div>
    </div>`;
    this.renderStats();
    showScreen('screenResult');
  },

  counts(list) {
    const ok = list.filter((x) => x.ok).length;
    return { total: list.length, ok, bad: list.length - ok, pct: list.length ? Math.round((ok / list.length) * 100) : 0 };
  },

  tallyLine() {
    const c = this.counts(Game.log);
    return `<div class="tally-line"><span class="t-ok">✓ Đúng ${c.ok}</span><span class="t-bad">✗ Sai ${c.bad}</span><span>/ ${c.total} câu</span></div>`;
  },

  /* ── BẢNG THỐNG KÊ CÂU ĐÚNG / SAI ── */
  renderStats(filter = 'all') {
    const log = Game.log;
    const c = this.counts(log);
    const byRound = Game.rounds.map((r) => ({ r, ...this.counts(log.filter((x) => x.type === r.type)) }));
    const byLevel = ['Nhận biết', 'Thông hiểu', 'Vận dụng'].map((lv) => ({ lv, ...this.counts(log.filter((x) => x.level === lv)) })).filter((x) => x.total);
    const rows = log.map((x, i) => ({ ...x, n: i + 1 })).filter((x) => filter === 'all' || (filter === 'bad' ? !x.ok : x.ok));

    $('statsPanel').innerHTML = `<div class="stats" id="statsSection">
      <h2 class="stats-title">📋 Thống kê câu đúng / sai</h2>
      <div class="stat-cards">
        <div class="stat-card"><div class="sc-num">${c.total}</div><div class="sc-lbl">Tổng số câu</div></div>
        <div class="stat-card ok"><div class="sc-num">${c.ok}</div><div class="sc-lbl">✓ Câu đúng</div></div>
        <div class="stat-card bad"><div class="sc-num">${c.bad}</div><div class="sc-lbl">✗ Câu sai</div></div>
        <div class="stat-card rate"><div class="sc-num">${c.pct}%</div><div class="sc-lbl">Tỉ lệ đúng</div></div>
      </div>

      <div class="stats-grid">
        <table class="stbl">
          <thead><tr><th>Vòng chơi</th><th>Số câu</th><th>Đúng</th><th>Sai</th><th>Tỉ lệ đúng</th></tr></thead>
          <tbody>${byRound.map((x) => `<tr><td>${ROUNDS[x.r.type].icon} ${ROUNDS[x.r.type].title}</td><td>${x.total}</td><td class="c-ok">${x.ok}</td><td class="c-bad">${x.bad}</td>
            <td class="rate-cell"><div class="mini-bar"><div style="width:${x.pct}%"></div></div> ${x.pct}%</td></tr>`).join('')}</tbody>
        </table>
        <table class="stbl">
          <thead><tr><th>Mức độ</th><th>Số câu</th><th>Đúng</th><th>Sai</th><th>Tỉ lệ đúng</th></tr></thead>
          <tbody>${byLevel.map((x) => `<tr><td>${x.lv}</td><td>${x.total}</td><td class="c-ok">${x.ok}</td><td class="c-bad">${x.bad}</td>
            <td class="rate-cell"><div class="mini-bar"><div style="width:${x.pct}%"></div></div> ${x.pct}%</td></tr>`).join('')}</tbody>
        </table>
      </div>

      <div class="stats-filter no-print">
        <span>Chi tiết từng câu:</span>
        <button class="btn small ${filter === 'all' ? '' : 'ghost'}" data-f="all">Tất cả (${c.total})</button>
        <button class="btn small ${filter === 'ok' ? '' : 'ghost'}" data-f="ok">✓ Câu đúng (${c.ok})</button>
        <button class="btn small ${filter === 'bad' ? '' : 'ghost'}" data-f="bad">✗ Câu sai (${c.bad})</button>
      </div>
      <table class="stbl detail">
        <thead><tr><th>#</th><th>Vòng</th><th>Câu hỏi</th><th>Lớp trả lời</th><th>Đáp án đúng</th><th>Kết quả</th></tr></thead>
        <tbody>${rows.length ? rows.map((x) => `<tr class="${x.ok ? 'r-ok' : 'r-bad'}">
          <td>${x.n}</td><td class="nowrap">${ROUNDS[x.type].icon} ${ROUNDS[x.type].title}<br><span class="muted small">${x.level}</span></td>
          <td>${esc(x.q)}</td><td>${esc(x.chosen)}</td><td>${esc(x.correct)}</td>
          <td class="res">${x.ok ? '<span class="badge-ok">✓ Đúng</span>' : '<span class="badge-bad">✗ Sai</span>'}</td></tr>`).join('')
          : '<tr><td colspan="6" class="muted" style="text-align:center">Không có câu nào.</td></tr>'}</tbody>
      </table>
    </div>`;
    $('statsPanel').querySelectorAll('[data-f]').forEach((b) => (b.onclick = () => this.renderStats(b.dataset.f)));
  },

  /* Xuất thống kê ra file CSV (mở được bằng Excel, giữ dấu tiếng Việt) */
  exportCsv() {
    const log = Game.log;
    if (!log.length) return toast('Chưa có dữ liệu thống kê.', true);
    const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const c = this.counts(log);
    const lines = [
      ['Văn bản', App.analysis.title], ['Ngày', new Date().toLocaleString('vi-VN')],
      ['Tổng số câu', c.total], ['Câu đúng', c.ok], ['Câu sai', c.bad], ['Tỉ lệ đúng (%)', c.pct], [],
      ['STT', 'Vòng', 'Mức độ', 'Câu hỏi', 'Lớp trả lời', 'Đáp án đúng', 'Kết quả'],
      ...log.map((x, i) => [i + 1, ROUNDS[x.type].title, x.level, x.q, x.chosen, x.correct, x.ok ? 'Đúng' : 'Sai']),
    ];
    const csv = '\uFEFF' + lines.map((r) => r.map(cell).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const slug = App.analysis.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').replace(/[^a-z0-9]+/gi, '-').toLowerCase().replace(/^-|-$/g, '');
    a.download = `thong-ke-doc-hieu-${slug || 'van-ban'}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('✅ Đã tải file thống kê (mở bằng Excel)');
  },
};

/* ───────── ĐIỀU KHIỂN CHUNG ───────── */
const Drawer = {
  open() { $('textDrawer').classList.add('open'); $('drawerBackdrop').classList.add('open'); },
  close() { $('textDrawer').classList.remove('open'); $('drawerBackdrop').classList.remove('open'); },
  toggle() { $('textDrawer').classList.contains('open') ? this.close() : this.open(); },
};

function bindGlobal() {
  $('btnShowText').onclick = () => Drawer.toggle();
  $('btnCloseDrawer').onclick = () => Drawer.close();
  $('drawerBackdrop').onclick = () => Drawer.close();
  $('btnSound').onclick = () => Sound.toggle();
  $('btnFullscreen').onclick = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {}));
  $('btnHome').onclick = () => {
    if ($('screenGame').classList.contains('active') && !confirm('Thoát trò chơi và quay về màn hình nạp bài?')) return;
    Sound.stopAll();
    $('btnRestore').hidden = !localStorage.getItem('dh_last_session');
    showScreen('screenSetup');
  };
  $('btnBackSetup').onclick = () => showScreen('screenSetup');
  $('btnStart').onclick = () => Game.start();
  $('btnPrint').onclick = () => window.print();
  $('btnStatsJump').onclick = () => $('statsSection')?.scrollIntoView({ behavior: 'smooth' });
  $('btnExportCsv').onclick = () => Result.exportCsv();
  $('btnReplay').onclick = () => Game.start();
  $('btnNewText').onclick = () => { Sound.stopAll(); showScreen('screenSetup'); };

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') return Drawer.close();
    const typing = ['TEXTAREA', 'INPUT', 'SELECT'].includes(document.activeElement?.tagName);
    if (typing || !$('screenGame').classList.contains('active')) return;
    const k = Game.keys || {};
    const key = e.key.toLowerCase();
    if (key === 't') { e.preventDefault(); return Drawer.toggle(); }
    const map = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 };
    if (k.select && key in map) { e.preventDefault(); return k.select(map[key]); }
    if (e.key === 'Enter' || e.key === ' ') {
      if (document.activeElement?.tagName === 'BUTTON' && e.key === ' ') return;
      e.preventDefault();
      if (k.next) return k.next();
      if (k.confirm) return k.confirm();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  Setup.init();
  bindGlobal();
});

