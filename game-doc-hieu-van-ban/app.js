/* ═══════════════════════════════════════════════════════════
   ĐỌC HIỂU CÙNG AI (THPT) – Hệ thống đánh giá năng lực đọc hiểu
   Hỗ trợ: Copy/Dán kí tự · Đẩy file PDF (chữ & scan) · Gửi ảnh vào
   Luồng: Nạp ngữ liệu → Gemini phân tích → Giáo viên duyệt
          → 6 vòng chơi → Infographic chốt kiến thức + Thống kê
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
  toastTimer = setTimeout(() => el.classList.remove('show'), isError ? 6000 : 3200);
}

async function copyToClipboard(text, label = 'văn bản') {
  const content = String(text ?? '').trim();
  if (!content) return toast(`Chưa có ${label} để copy.`, true);
  try {
    await navigator.clipboard.writeText(content);
    toast(`✅ Đã copy ${label} (${content.length.toLocaleString('vi-VN')} ký tự) vào bộ nhớ tạm!`);
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = content;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    toast(`✅ Đã copy ${label} (${content.length.toLocaleString('vi-VN')} ký tự) vào bộ nhớ tạm!`);
  }
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

/* ───────── ÂM THANH (CHỈ DÙNG ÂM THANH ĐÚNG / SAI) ───────── */
const Sound = {
  enabled: localStorage.getItem('dh_sound') !== 'off',
  ctx: null,
  files: {
    correct: new Audio('assets/sounds/amthanhdung.mp3'),
    wrong: new Audio('assets/sounds/amthanhsai.mp3'),
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
    if (name === 'round' || name === 'end') return this.beep([523, 659, 784, 1047], 0.13, 'triangle', 0.12);
    const a = this.files[name];
    if (!a) return;
    a.currentTime = 0;
    a.volume = 0.9;
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
  mcq:       { icon: '🅰️', title: 'Trắc nghiệm đọc hiểu',  desc: 'Chọn 1 phương án đúng nhất trong 4 phương án A, B, C, D' },
  trueFalse: { icon: '⚖️', title: 'Đúng hay Sai?',          desc: 'Xác định nhận định sau đây đúng hay sai so với ngữ liệu' },
  fillBlank: { icon: '✍️', title: 'Điền từ / Thuật ngữ',    desc: 'Chọn từ ngữ, hình ảnh hoặc khái niệm phù hợp điền vào chỗ trống' },
  matching:  { icon: '🔗', title: 'Nối cặp nghệ thuật – ý nghĩa', desc: 'Nối mỗi chi tiết, hình ảnh, luận điểm ở cột trái với ý nghĩa ở cột phải' },
  ordering:  { icon: '🔢', title: 'Sắp xếp mạch văn bản',   desc: 'Sắp xếp các sự việc / khổ thơ / luận điểm theo đúng trình tự ngữ liệu' },
  openEnded: { icon: '💬', title: 'Tự luận & Vận dụng THPT', desc: 'Phân tích, nhận xét hoặc bày tỏ quan điểm cá nhân từ ngữ liệu' },
};
const ROUND_ORDER = ['mcq', 'trueFalse', 'fillBlank', 'matching', 'ordering', 'openEnded'];

/* ───────── TRẠNG THÁI ỨNG DỤNG ───────── */
const App = {
  sourceText: '',
  media: [], // [{ id, name, mimeType, dataUrl, base64 }] – ảnh chụp trang sách / trang PDF scan
  analysis: null,
  isDemo: false,
  settings: {
    grade: (() => {
      const saved = localStorage.getItem('dh_grade');
      return (!saved || saved === 'Lớp 8') ? 'Lớp 11' : saved;
    })(),
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

/* ───────── XỬ LÝ FILE (PDF CHỮ & SCAN / DOCX / TXT / ẢNH) ───────── */
const FileLoader = {
  async readPdf(file) {
    if (!window.pdfjsLib) throw new Error('Thư viện PDF.js chưa sẵn sàng.');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/vendor/pdf.worker.min.js';
    const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    let out = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      let line = '';
      let lastY = null;
      content.items.forEach((it) => {
        const y = it.transform ? it.transform[5] : null;
        if (lastY !== null && y !== null && Math.abs(y - lastY) > 5 && line.trim()) {
          out += line.trimEnd() + '\n';
          line = '';
        }
        line += it.str;
        lastY = y;
        if (it.hasEOL) {
          out += line.trimEnd() + '\n';
          line = '';
          lastY = null;
        }
      });
      if (line.trim()) out += line.trimEnd();
      out += '\n\n';
    }
    const cleanText = out.normalize('NFC').replace(/\n{3,}/g, '\n\n').trim();

    // Nếu PDF là bản scan (không có lớp chữ hoặc quá ít chữ), tự động kết xuất các trang thành ảnh để gửi cho AI
    const maxPagesToRender = Math.min(pdf.numPages, 8);
    const renderedImages = [];
    if (cleanText.length < 80) {
      for (let i = 1; i <= maxPagesToRender; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.65 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        renderedImages.push({
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: `${file.name} (Trang ${i}/${pdf.numPages})`,
          mimeType: 'image/jpeg',
          dataUrl,
          base64: dataUrl.split(',')[1],
        });
      }
    }
    return { text: cleanText, images: renderedImages, numPages: pdf.numPages };
  },

  async readDocx(file) {
    if (!window.mammoth) throw new Error('Chưa tải được thư viện đọc Word (cần Internet). Hãy copy & dán nội dung hoặc dùng file PDF.');
    const res = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return res.value.normalize('NFC').trim();
  },

  async readImage(file, customName) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error(`Không đọc được ảnh "${file.name}"`));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error(`Định dạng ảnh "${file.name}" không hợp lệ.`));
        img.onload = () => {
          const maxDim = 1800;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            const ratio = Math.min(maxDim / width, maxDim / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
          resolve({
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name: customName || file.name || 'Ảnh chụp ngữ liệu',
            mimeType: 'image/jpeg',
            dataUrl,
            base64: dataUrl.split(',')[1],
          });
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  },
};

/* ───────── DỊCH VỤ GEMINI AI (ĐA PHƯƠNG THỨC – CHƯƠNG TRÌNH THPT) ───────── */
const AIService = {
  base: 'https://generativelanguage.googleapis.com/v1beta',
  models: [],

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

  async call(prompt, { json = true, temperature = 0.35, maxTokens = 32768, model, images = [] } = {}) {
    const key = App.apiKey();
    if (!key) throw new Error('Chưa nhập Gemini API Key.');
    const useModel = model || App.model();
    const parts = [{ text: prompt }];
    arr(images).forEach((img) => {
      if (img && img.base64) {
        parts.push({ inlineData: { mimeType: img.mimeType || 'image/jpeg', data: img.base64 } });
      }
    });
    const data = await this.request(`models/${encodeURIComponent(useModel)}:generateContent`, key, {
      contents: [{ role: 'user', parts }],
      generationConfig: { temperature, maxOutputTokens: maxTokens, ...(json ? { responseMimeType: 'application/json' } : {}) },
    });
    if (data.promptFeedback?.blockReason) throw new Error(`Gemini từ chối xử lý nội dung này (${data.promptFeedback.blockReason}).`);
    const cand = data.candidates?.[0];
    const allParts = cand?.content?.parts || [];
    const nonThought = allParts.filter((p) => !p.thought);
    const useParts = nonThought.length ? nonThought : allParts;
    const text = useParts.map((p) => p.text || '').join('') || '';
    if (!text) throw new Error('Gemini không trả về nội dung. Hãy thử lại.');
    if (!json) return text;
    try {
      return this.parseJSON(text);
    } catch (e) {
      if (cand?.finishReason === 'MAX_TOKENS') throw new Error('Câu trả lời của AI bị cắt ngắn vì quá dài. Hãy giảm "Số câu mỗi vòng" rồi thử lại.');
      throw e;
    }
  },

  async callWithFallback(prompt, opts = {}) {
    try {
      return await this.call(prompt, opts);
    } catch (e) {
      if (e.status === 404) {
        if (!this.models.length) await this.listModels(App.apiKey()).catch(() => {});
        const alt = this.models.find((m) => m.id !== App.model() && /flash/.test(m.id)) || this.models.find((m) => m.id !== App.model());
        if (!alt) throw e;
        Connection.fillModels(alt.id);
        toast(`Model cũ không khả dụng – đã tự chuyển sang ${alt.id}`);
        return this.call(prompt, opts);
      }
      if (e.isJsonError && !opts._retried) {
        return this.call(prompt, { ...opts, temperature: 0.2, _retried: true });
      }
      throw e;
    }
  },

  repairJSON(input) {
    let t = String(input || '').trim();
    // Nếu có code block ```json ... ``` thì ưu tiên lấy nội dung trong code block
    const fenceMatch = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch && fenceMatch[1].includes('{')) {
      t = fenceMatch[1].trim();
    }
    const s = t.indexOf('{');
    const e = t.lastIndexOf('}');
    if (s >= 0 && e > s) t = t.slice(s, e + 1);
    else if (s >= 0) t = t.slice(s);

    // Chuẩn hóa các dấu ngoặc kép thông minh ở vị trí cú pháp JSON nếu AI lỡ dùng
    let out = '';
    let inStr = false;
    let isKey = false;
    const stack = []; // '{' hoặc '['

    for (let i = 0; i < t.length; i++) {
      const ch = t[i];
      if (!inStr) {
        if (ch === '{') {
          stack.push('{');
          isKey = true;
          out += ch;
        } else if (ch === '[') {
          stack.push('[');
          isKey = false;
          out += ch;
        } else if (ch === '}' || ch === ']') {
          stack.pop();
          isKey = false;
          out += ch;
        } else if (ch === ':') {
          isKey = false;
          out += ch;
        } else if (ch === ',') {
          isKey = stack[stack.length - 1] === '{';
          out += ch;
        } else if (ch === '"') {
          inStr = true;
          out += '"';
        } else {
          out += ch;
        }
      } else {
        if (ch === '\\') {
          const next = t[i + 1];
          if (next === undefined) {
            out += '\\\\';
          } else if ('"\\/bfnrtu'.includes(next)) {
            out += '\\' + next;
            i++;
          } else {
            out += '\\\\';
          }
        } else if (ch === '\n') {
          out += '\\n';
        } else if (ch === '\r') {
          out += '\\r';
        } else if (ch === '\t') {
          out += '\\t';
        } else if (ch === '"') {
          const rest = t.slice(i + 1).trimStart();
          const top = stack[stack.length - 1];
          let isClosing = false;
          if (!rest) {
            isClosing = true;
          } else if (isKey) {
            isClosing = rest.startsWith(':');
          } else if (top === '{') {
            if (rest.startsWith('}')) isClosing = true;
            else if (rest.startsWith(',')) {
              const afterComma = rest.slice(1).trimStart();
              isClosing = /^"[^"\\\r\n]{1,64}"\s*:/.test(afterComma) || afterComma.startsWith('}');
            }
          } else if (top === '[') {
            if (rest.startsWith(']')) isClosing = true;
            else if (rest.startsWith(',')) {
              const afterComma = rest.slice(1).trimStart();
              isClosing = afterComma.startsWith('{') || afterComma.startsWith('[') || afterComma.startsWith(']') ||
                /^(?:true|false|null|-?\d)/.test(afterComma) ||
                /^"(?:[^"\\]|\\.)*"\s*(?:,|])/.test(afterComma);
            }
          } else {
            isClosing = /^[,}\]:]/.test(rest);
          }

          if (isClosing) {
            inStr = false;
            out += '"';
          } else {
            out += '\\"';
          }
        } else {
          out += ch;
        }
      }
    }

    if (inStr) out += '"';
    // Xóa dấu phẩy thừa trước } hoặc ]
    out = out.replace(/,\s*([}\]])/g, '$1');
    // Tự động đóng các ngoặc còn mở nếu JSON bị cắt nhẹ ở cuối
    while (stack.length) {
      const top = stack.pop();
      out += top === '{' ? '}' : ']';
    }
    out = out.replace(/,\s*([}\]])/g, '$1');
    return out;
  },

  parseJSON(text) {
    let clean = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const s = clean.indexOf('{');
    const e = clean.lastIndexOf('}');
    if (s >= 0 && e > s) clean = clean.slice(s, e + 1);
    try {
      return JSON.parse(clean);
    } catch (_) {
      try {
        const repaired = this.repairJSON(text);
        return JSON.parse(repaired);
      } catch (err) {
        console.warn('JSON Parse Error:', err, '\nRaw AI text:', text);
        const eObj = new Error('Dữ liệu AI trả về bị lỗi định dạng. Hãy bấm phân tích lại.');
        eObj.isJsonError = true;
        throw eObj;
      }
    }
  },

  async test() {
    await this.callWithFallback('Trả lời đúng một từ: OK', { json: false, maxTokens: 50 });
  },

  /* Đọc chữ (OCR) từ danh sách ảnh / trang PDF scan */
  async extractTextFromImages(images) {
    const prompt = `Bạn là trợ lý số hóa ngữ liệu Ngữ văn THPT chính xác tuyệt đối.
Hãy đọc toàn bộ chữ tiếng Việt trong các trang ảnh đính kèm và trích xuất nguyên văn.
YÊU CẦU:
- Giữ nguyên cấu trúc đoạn văn, khổ thơ, dấu câu, chú thích, tên tác giả và nguồn trích dẫn.
- Không thêm lời bình luận, không tóm tắt, chỉ trả về nguyên văn văn bản đọc được.`;
    const out = await this.callWithFallback(prompt, { json: false, temperature: 0.1, maxTokens: 8192, images });
    return out.trim();
  },

  buildPrompt(text, grade, n, rounds, hasImages = false) {
    const on = (t) => rounds.includes(t);
    const c = {
      mcq: on('mcq') ? n : 0,
      trueFalse: on('trueFalse') ? n : 0,
      fillBlank: on('fillBlank') ? n : 0,
      matching: on('matching') ? clamp(n, 4, 6) : 0,
      ordering: on('ordering') ? clamp(n + 1, 4, 7) : 0,
      openEnded: on('openEnded') ? (n <= 3 ? 1 : 2) : 0,
    };
    return `Bạn là giáo viên Ngữ văn THPT giỏi, chuyên gia khảo thí am hiểu sâu Chương trình GDPT 2018 (cấp THPT: Lớp 10, 11, 12) và cấu trúc Đề thi Tốt nghiệp THPT môn Ngữ văn mới.
Hãy đọc kĩ ngữ liệu ${hasImages ? '(bao gồm cả văn bản và các trang ảnh đính kèm)' : 'ở cuối'}, phân tích học thuật và thiết kế bộ câu hỏi đánh giá NĂNG LỰC ĐỌC HIỂU cho học sinh ${grade}.

YÊU CẦU SƯ PHẠM THPT BẮT BUỘC:
1. Mọi câu hỏi và đáp án phải bám sát ngữ liệu; khai thác sâu đặc trưng thể loại theo CT GDPT 2018 cấp THPT:
   - Nếu là VĂN BẢN VĂN HỌC (thơ trữ tình, truyện ngắn, tiểu thuyết, kí, tùy bút, tản văn, kịch, thần thoại, sử thi): hỏi về chủ thể trữ tình, nhân vật, điểm nhìn trần thuật, ngôi kể, giọng điệu, kết cấu, hình tượng nghệ thuật, mạch cảm xúc, biện pháp tu từ, ngôn ngữ nghệ thuật và giá trị tư tưởng – triết lí nhân sinh.
   - Nếu là VĂN BẢN NGHỊ LUẬN: hỏi về luận đề, hệ thống luận điểm, lí lẽ và bằng chứng, mạch lập luận, thao tác nghị luận, thái độ/quan điểm của người viết.
   - Nếu là VĂN BẢN THÔNG TIN: hỏi về nhan đề, sa-pô, thông tin chính và chi tiết, dữ liệu/số liệu, cách trình bày, phương tiện phi ngôn ngữ và mục đích văn bản.
2. Phân bổ câu hỏi theo 3 mức độ nhận thức chuẩn THPT ("Nhận biết" | "Thông hiểu" | "Vận dụng") theo tỉ lệ khoảng 35% Nhận biết / 45% Thông hiểu / 20% Vận dụng.
3. Phương án nhiễu (distractors) phải có tính học thuật, độ dài tương đương đáp án đúng; tuyệt đối không dùng "Tất cả đều đúng/sai".
4. Mỗi câu có "explain": giải thích tường minh 1–2 câu, trích dẫn trực tiếp từ khóa/dẫn chứng trong ngữ liệu.
5. Câu điền từ ("fillBlank"): trích câu từ văn bản hoặc nhận định khái quát về văn bản, chỗ trống ghi đúng "____", đáp án là từ/cụm từ/thuật ngữ (1–4 tiếng), kèm đúng 4 lựa chọn (gồm đáp án đúng).
6. Nối cặp ("matching"): vế trái là hình ảnh/chi tiết/biện pháp nghệ thuật/luận điểm, vế phải là ý nghĩa/tác dụng/đặc điểm tương ứng; mỗi vế dưới 14 từ.
7. Sắp xếp ("ordering"): liệt kê các sự việc / khổ thơ / luận điểm THEO ĐÚNG TRÌNH TỰ triển khai trong văn bản.
8. Câu tự luận ("openEnded"): thiết kế theo chuẩn câu hỏi Đọc hiểu nâng cao / Vận dụng THPT (phân tích hiệu quả nghệ thuật, rút ra thông điệp, hoặc bày tỏ quan điểm đồng tình/không đồng tình có lí giải 5–7 dòng).
9. QUY TẮC ĐỊNH DẠNG JSON BẮT BUỘC: Khi trích dẫn câu thơ, câu văn hoặc từ ngữ bên trong chuỗi JSON, BẮT BUỘC dùng dấu nháy đơn ('...') hoặc ngoặc kép cong (“...”), TUYỆT ĐỐI KHÔNG dùng dấu ngoặc kép thẳng (") bên trong nội dung chuỗi. Không xuống dòng trực tiếp trong chuỗi JSON (dùng \\n nếu cần).

SỐ LƯỢNG YÊU CẦU: mcq ${c.mcq} câu; trueFalse ${c.trueFalse} câu; fillBlank ${c.fillBlank} câu; matching ${c.matching} cặp; ordering ${c.ordering} mục; openEnded ${c.openEnded} câu. (Nếu phần nào bằng 0 thì trả về mảng rỗng).

CHỈ TRẢ VỀ JSON HỢP LỆ theo đúng cấu trúc sau:
{
  "title": "Tên văn bản / đoạn trích", "author": "Tác giả / Nguồn", "genre": "Thể loại (VD: Thơ trữ tình hiện đại / Truyện ngắn / Văn bản nghị luận...)", "gradeLevel": "${grade}",
  "summary": "Tóm tắt nội dung và giá trị nghệ thuật chính (3–4 câu)", "theme": "Chủ đề & Cảm hứng chủ đạo", "mainIdeas": ["Bố cục / Luận điểm / Mạch ý chính"],
  "characters": [{"name": "Nhân vật / Chủ thể trữ tình / Đối tượng trung tâm", "traits": "Đặc điểm, tâm trạng, vẻ đẹp hoặc vai trò"}],
  "timeline": ["Mạch cảm xúc / Trình tự sự việc / Hệ thống luận điểm theo thứ tự"],
  "artTechniques": [{"name": "Biện pháp tu từ / Đặc sắc thi pháp / Nghệ thuật lập luận", "example": "Dẫn chứng trong văn bản (dùng nháy đơn '...')", "effect": "Tác dụng biểu đạt"}],
  "message": "Thông điệp tư tưởng, giá trị nhân sinh", "vocabulary": [{"word": "Từ ngữ / Khái niệm học thuật", "meaning": "Giải nghĩa ngắn gọn"}],
  "questions": {
    "mcq": [{"q": "", "options": ["", "", "", ""], "ans": 0, "level": "Nhận biết", "explain": ""}],
    "trueFalse": [{"statement": "", "answer": true, "level": "Nhận biết", "explain": ""}],
    "fillBlank": [{"sentence": "... ____ ...", "answer": "", "options": ["", "", "", ""], "level": "Nhận biết", "explain": ""}],
    "matching": {"instruction": "", "pairs": [{"left": "", "right": ""}]},
    "ordering": {"instruction": "", "items": ["mục 1", "mục 2"]},
    "openEnded": [{"q": "", "rubric": "Tiêu chí chấm theo chuẩn Đọc hiểu THPT", "sampleAnswer": "Đáp án gợi ý hoàn chỉnh"}]
  }
}

${text.trim() ? `NGỮ LIỆU VĂN BẢN:\n"""\n${text.slice(0, 28000)}\n"""` : 'NGỮ LIỆU: Hãy đọc toàn bộ nội dung văn bản trong các trang ảnh đính kèm.'}`;
  },

  async analyze(text, grade, n, rounds, images = []) {
    const hasImages = images && images.length > 0;
    let sourceText = str(text);
    let extractedText = '';
    if (hasImages && sourceText.length < 40) {
      try {
        extractedText = await this.extractTextFromImages(images);
        if (extractedText) sourceText = extractedText;
      } catch (_) {}
    }
    const raw = await this.callWithFallback(this.buildPrompt(sourceText, grade, n, rounds, hasImages), { images: sourceText.length >= 40 ? [] : images });
    const fullText = sourceText || str(raw.extractedText) || '';
    return {
      analysis: Normalizer.analysis(raw, fullText),
      extractedText: extractedText || str(raw.extractedText),
    };
  },

  async grade(text, q, rubric, answer) {
    const prompt = `Bạn là giám khảo Ngữ văn THPT chấm câu trả lời tự luận đọc hiểu theo hướng dẫn chấm của Bộ GD&ĐT, nhận xét khích lệ, chuẩn xác, ngắn gọn.
NGỮ LIỆU (trích): """${text.slice(0, 9000)}"""
CÂU HỎI: ${q}
HƯỚNG DẪN CHẤM (RUBRIC): ${rubric}
BÀI LÀM CỦA HỌC SINH: """${answer.slice(0, 2500)}"""
Chấm thang điểm 0–10. Chỉ trả về JSON: {"score": 0, "verdict": "Nhận xét chung 1 câu", "strengths": "Ý đúng, diễn đạt tốt", "improve": "Ý cần bổ sung hoặc sâu sắc hơn"}`;
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
    const firstLine = str(text).split('\n').find((l) => l.trim()) || 'Ngữ liệu đọc hiểu THPT';
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
    return { instruction: str(m?.instruction) || 'Nối mỗi chi tiết / hình ảnh ở cột trái với ý nghĩa phù hợp ở cột phải.', pairs: pairs.length >= 2 ? pairs : [] };
  },

  ordering(o, timeline) {
    let items = arr(o?.items).map(str).filter(Boolean).slice(0, 8);
    if (items.length < 3) items = arr(timeline).map(str).filter(Boolean).slice(0, 7);
    return { instruction: str(o?.instruction) || 'Sắp xếp theo đúng mạch triển khai của văn bản.', items: items.length >= 3 ? items : [] };
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

/* ───────── LIGHTBOX XEM ẢNH PHÓNG TO ───────── */
const Lightbox = {
  open(src) {
    if (!src) return;
    $('imgModalTarget').src = src;
    $('imgModal').hidden = false;
  },
  close() {
    $('imgModal').hidden = true;
    $('imgModalTarget').src = '';
  },
};

/* ───────── MÀN NẠP NGỮ LIỆU (COPY KÍ TỰ · ĐẨY PDF · GỬI ẢNH) ───────── */
const Setup = {
  init() {
    const s = App.settings;
    if ([...$('selGrade').options].some((o) => o.value === s.grade)) $('selGrade').value = s.grade;
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
    this.renderMedia();
    if (App.apiKey()) Connection.connect({ silent: true });
  },

  bind() {
    const txt = $('txtSource');
    txt.addEventListener('input', () => this.updateCount());
    $('btnClearText').onclick = () => { txt.value = ''; this.updateCount(); };

    // Công cụ Copy / Dán / Chuẩn hóa kí tự
    $('btnPasteText').onclick = async () => {
      try {
        const clip = await navigator.clipboard.readText();
        if (!clip) return toast('Bộ nhớ tạm chưa có văn bản.', true);
        const start = txt.selectionStart ?? txt.value.length;
        const end = txt.selectionEnd ?? txt.value.length;
        txt.value = txt.value.slice(0, start) + clip.normalize('NFC') + txt.value.slice(end);
        this.updateCount();
        txt.focus();
        toast(`✅ Đã dán ${clip.length.toLocaleString('vi-VN')} ký tự từ Clipboard!`);
      } catch (e) {
        txt.focus();
        toast('Hãy nhấn Ctrl+V trực tiếp vào ô văn bản để dán.');
      }
    };
    $('btnCopyText').onclick = () => copyToClipboard(txt.value, 'ngữ liệu văn bản');
    $('btnCleanText').onclick = () => {
      if (!txt.value.trim()) return toast('Chưa có văn bản để chuẩn hóa.', true);
      txt.value = this.cleanPdfLineBreaks(txt.value);
      this.updateCount();
      toast('✨ Đã chuẩn hóa kí tự và gộp các dòng PDF bị ngắt vụn!');
    };

    // Thanh chèn nhanh kí tự đặc biệt
    $('symbolBar').querySelectorAll('.sym-btn').forEach((btn) => {
      btn.onclick = () => {
        const sym = btn.dataset.sym;
        const start = txt.selectionStart ?? txt.value.length;
        const end = txt.selectionEnd ?? txt.value.length;
        const selected = txt.value.slice(start, end);
        let insert = sym;
        let cursorOffset = sym.length;
        if ((sym === '“”' || sym === '‘’') && selected) {
          insert = sym[0] + selected + sym[1];
          cursorOffset = insert.length;
        } else if (sym === '“”' || sym === '‘’') {
          cursorOffset = 1;
        }
        txt.value = txt.value.slice(0, start) + insert + txt.value.slice(end);
        this.updateCount();
        txt.focus();
        txt.setSelectionRange(start + cursorOffset, start + cursorOffset);
      };
    });

    // Dropzone & chọn file PDF / Word / TXT / Ảnh
    const dz = $('dropzone');
    $('btnPickFile').onclick = (e) => { e.stopPropagation(); $('fileInput').click(); };
    $('btnPickImg').onclick = (e) => { e.stopPropagation(); $('imgInput').click(); };
    dz.onclick = (e) => {
      if (e.target.closest('button')) return;
      $('fileInput').click();
    };
    $('fileInput').onchange = (e) => e.target.files.length && this.handleFiles([...e.target.files]);
    $('imgInput').onchange = (e) => e.target.files.length && this.handleFiles([...e.target.files]);

    dz.ondragover = (e) => { e.preventDefault(); dz.classList.add('dragover'); };
    dz.ondragleave = () => dz.classList.remove('dragover');
    dz.ondrop = (e) => {
      e.preventDefault();
      dz.classList.remove('dragover');
      if (e.dataTransfer.files?.length) this.handleFiles([...e.dataTransfer.files]);
    };

    // Hỗ trợ nhấn Ctrl+V để dán ảnh chụp màn hình ở bất kỳ đâu trên màn hình nạp bài
    document.addEventListener('paste', (e) => {
      if (!$('screenSetup').classList.contains('active')) return;
      const items = [...(e.clipboardData?.items || [])];
      const imgItems = items.filter((it) => it.type.startsWith('image/'));
      if (imgItems.length) {
        e.preventDefault();
        const files = imgItems.map((it, idx) => {
          const f = it.getAsFile();
          return new File([f], `Anh-dan-clipboard-${idx + 1}.png`, { type: f.type });
        });
        this.handleFiles(files);
      }
    });

    // Khung quản lý ảnh đính kèm
    $('btnClearMedia').onclick = () => {
      App.media = [];
      this.renderMedia();
      toast('Đã xóa tất cả ảnh đính kèm.');
    };
    $('btnOcr').onclick = () => this.ocrImages();

    // Tùy chọn trò chơi & kết nối AI
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

  cleanPdfLineBreaks(raw) {
    return raw
      .normalize('NFC')
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/([a-zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ,])\n([a-zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ])/g, '$1 $2')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  },

  updateCount() {
    const val = $('txtSource').value;
    const chars = val.length;
    const words = val.trim() ? val.trim().split(/\s+/).length : 0;
    $('charCount').textContent = `${chars.toLocaleString('vi-VN')} ký tự · ${words.toLocaleString('vi-VN')} từ`;
  },

  renderMedia() {
    const box = $('mediaBox');
    const list = $('mediaList');
    const items = App.media;
    box.hidden = items.length === 0;
    $('mediaCount').textContent = `🖼️ ${items.length} ảnh / trang tài liệu đính kèm`;
    list.innerHTML = items.map((m, idx) => `
      <div class="media-item">
        <img class="media-thumb" src="${m.dataUrl}" alt="${esc(m.name)}" data-idx="${idx}" title="Bấm để phóng to">
        <div class="media-name" title="${esc(m.name)}">${esc(m.name)}</div>
        <button type="button" class="media-del" data-del="${idx}" title="Xóa ảnh này">✕</button>
      </div>`).join('');
    list.querySelectorAll('.media-thumb').forEach((img) => {
      img.onclick = () => Lightbox.open(items[+img.dataset.idx]?.dataUrl);
    });
    list.querySelectorAll('[data-del]').forEach((btn) => {
      btn.onclick = () => {
        App.media.splice(+btn.dataset.del, 1);
        this.renderMedia();
      };
    });
  },

  async handleFiles(files) {
    let addedImages = 0;
    let loadedTextFiles = 0;
    for (const file of files) {
      const lower = file.name.toLowerCase();
      try {
        if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp)$/i.test(lower)) {
          const imgObj = await FileLoader.readImage(file);
          App.media.push(imgObj);
          addedImages++;
        } else if (lower.endsWith('.pdf')) {
          toast(`📄 Đang đọc file PDF "${file.name}"…`);
          const res = await FileLoader.readPdf(file);
          if (res.text && res.text.length >= 80) {
            $('txtSource').value = ($('txtSource').value ? $('txtSource').value + '\n\n' : '') + res.text;
            loadedTextFiles++;
            toast(`✅ Đã trích xuất ${res.text.length.toLocaleString('vi-VN')} ký tự từ "${file.name}" (${res.numPages} trang)`);
          } else if (res.images.length) {
            App.media.push(...res.images);
            addedImages += res.images.length;
            if (res.text) $('txtSource').value = ($('txtSource').value ? $('txtSource').value + '\n\n' : '') + res.text;
            toast(`📄 PDF "${file.name}" là bản scan – đã nạp ${res.images.length} trang ảnh để AI đọc!`);
          }
        } else if (lower.endsWith('.docx')) {
          toast(`📝 Đang đọc file Word "${file.name}"…`);
          const t = await FileLoader.readDocx(file);
          $('txtSource').value = ($('txtSource').value ? $('txtSource').value + '\n\n' : '') + t;
          loadedTextFiles++;
          toast(`✅ Đã đọc xong "${file.name}"`);
        } else if (lower.endsWith('.txt')) {
          const t = (await file.text()).normalize('NFC').trim();
          $('txtSource').value = ($('txtSource').value ? $('txtSource').value + '\n\n' : '') + t;
          loadedTextFiles++;
          toast(`✅ Đã đọc xong "${file.name}"`);
        } else {
          toast(`Định dạng "${file.name}" chưa hỗ trợ. Hãy dùng PDF, DOCX, TXT hoặc Ảnh.`, true);
        }
      } catch (e) {
        toast(e.message, true);
      }
    }
    $('fileInput').value = '';
    $('imgInput').value = '';
    this.updateCount();
    this.renderMedia();
    if (addedImages > 0 && !loadedTextFiles) {
      toast(`🖼️ Đã thêm ${addedImages} ảnh ngữ liệu. Bạn có thể bấm "🔍 Trích xuất kí tự từ ảnh" hoặc "✨ Phân tích ngữ liệu bằng AI".`);
    }
  },

  async ocrImages() {
    if (!App.media.length) return toast('Chưa có ảnh nào để trích xuất chữ.', true);
    if (!App.apiKey()) return toast('Hãy nhập Gemini API Key ở mục ③ để AI đọc chữ từ ảnh.', true);
    const btn = $('btnOcr');
    btn.disabled = true;
    const oldText = btn.textContent;
    btn.textContent = '⏳ AI đang đọc chữ từ ảnh…';
    try {
      const extracted = await AIService.extractTextFromImages(App.media);
      if (!extracted) throw new Error('Không tìm thấy văn bản trong ảnh.');
      $('txtSource').value = ($('txtSource').value.trim() ? $('txtSource').value.trim() + '\n\n' : '') + extracted;
      this.updateCount();
      Connection.set('ok', `Đã kết nối · ${App.model()}`);
      toast(`✅ Đã trích xuất ${extracted.length.toLocaleString('vi-VN')} ký tự từ ảnh vào ô văn bản!`);
    } catch (e) {
      toast(e.message, true);
    } finally {
      btn.disabled = false;
      btn.textContent = oldText;
    }
  },

  async analyze() {
    const text = $('txtSource').value.trim();
    const hasImages = App.media.length > 0;
    if (text.length < 80 && !hasImages) {
      return toast('Hãy dán ngữ liệu (ít nhất 80 ký tự), đẩy file PDF hoặc gửi ảnh bài văn vào trước.', true);
    }
    if (!App.settings.rounds.length) return toast('Hãy chọn ít nhất 1 vòng chơi.', true);
    if (!App.apiKey()) return toast('Hãy nhập Gemini API Key, hoặc bấm "📚 Dùng ngữ liệu mẫu THPT" để chơi thử.', true);
    localStorage.setItem('dh_api_key', App.apiKey());

    showScreen('screenLoading');
    const steps = [
      hasImages ? 'Đang đọc văn bản từ trang ảnh / PDF và xác định thể loại…' : 'Đang xác định thể loại, chủ đề, cảm hứng chủ đạo…',
      'Đang phân tích thi pháp, hệ thống luận điểm và biện pháp tu từ…',
      `Đang thiết kế câu hỏi Đọc hiểu chuẩn ${App.settings.grade} theo 3 mức độ nhận thức…`,
      'Đang kiểm tra đáp án, lời giải thích và hướng dẫn chấm tự luận…',
    ];
    let i = 0;
    $('loadingStep').textContent = steps[0];
    const timer = setInterval(() => { i = (i + 1) % steps.length; $('loadingStep').textContent = steps[i]; }, 3500);
    try {
      const res = await AIService.analyze(text, App.settings.grade, App.settings.count, App.settings.rounds, App.media);
      App.analysis = res.analysis;
      if (!text && res.extractedText) {
        $('txtSource').value = res.extractedText;
        this.updateCount();
      }
      App.sourceText = $('txtSource').value.trim() || res.extractedText || '(Ngữ liệu từ ảnh đính kèm)';
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
      $('txtSource').value = s.text || '';
      this.updateCount();
      Preview.render();
    } catch (e) {
      toast('Không mở được bộ câu hỏi đã lưu.', true);
    }
  },
};

/* ───────── MÀN XEM TRƯỚC, CHỈNH SỬA TRỰC TIẾP & DUYỆT ───────── */
const Preview = {
  editingKey: null, // VD: "mcq_0", "trueFalse_1"

  render() {
    const a = App.analysis;
    $('pvTitle').textContent = a.title;
    $('pvMeta').textContent = [a.author, a.genre, a.gradeLevel].filter(Boolean).join(' · ');
    $('pvSummary').textContent = a.summary || '(AI chưa tóm tắt)';
    $('pvTheme').textContent = a.theme || '—';
    $('pvOverviewEditor').hidden = true;
    $('pvOverviewDisplay').hidden = false;
    Drawer.syncContent();

    const Q = a.questions;
    const html = App.settings.rounds.filter((t) => ROUND_ORDER.includes(t)).map((t) => {
      const meta = ROUNDS[t];
      let items = [];
      if (t === 'mcq') {
        items = Q.mcq.map((x, i) => {
          const optsHtml = `<div class="pv-opts-grid">${x.options.map((o, k) => `<div class="pv-opt-line ${k === x.ans ? 'correct' : ''}">${k === x.ans ? '✓' : 'ABCD'[k] + '.'} ${esc(o)}</div>`).join('')}</div>`;
          const expHtml = x.explain ? `<div class="pv-explain-line">💡 ${esc(x.explain)}</div>` : '';
          return this.item(t, i, `<strong>Câu ${i + 1}:</strong> ${esc(x.q)} ${lvlBadge(x.level)}${optsHtml}${expHtml}`);
        });
      }
      if (t === 'trueFalse') {
        items = Q.trueFalse.map((x, i) => {
          const expHtml = x.explain ? `<div class="pv-explain-line">💡 ${esc(x.explain)}</div>` : '';
          return this.item(t, i, `<strong>Câu ${i + 1}:</strong> “${esc(x.statement)}” ${lvlBadge(x.level)}<br><span class="pv-ans">✓ Đáp án: ${x.answer ? 'ĐÚNG' : 'SAI'}</span>${expHtml}`);
        });
      }
      if (t === 'fillBlank') {
        items = Q.fillBlank.map((x, i) => {
          const expHtml = x.explain ? `<div class="pv-explain-line">💡 ${esc(x.explain)}</div>` : '';
          return this.item(t, i, `<strong>Câu ${i + 1}:</strong> ${esc(x.sentence)} ${lvlBadge(x.level)}<br><span class="pv-ans">✓ ${esc(x.answer)}</span> <span class="muted small">(Lựa chọn: ${x.options.map(esc).join(' / ')})</span>${expHtml}`);
        });
      }
      if (t === 'matching') {
        items = Q.matching.pairs.map((p, i) => this.item(t, i, `<strong>Cặp ${i + 1}:</strong> ${esc(p.left)} <strong>⟶</strong> <span class="pv-ans">${esc(p.right)}</span>`));
      }
      if (t === 'ordering') {
        items = Q.ordering.items.map((s, i) => this.item(t, i, `<strong>Thứ tự ${i + 1}:</strong> ${esc(s)}`));
      }
      if (t === 'openEnded') {
        items = Q.openEnded.map((x, i) => this.item(t, i, `<strong>Câu ${i + 1}:</strong> ${esc(x.q)} ${lvlBadge('Vận dụng')}<br><span class="muted small">🎯 Tiêu chí chấm: ${esc(x.rubric || '—')}</span>${x.sampleAnswer ? `<br><span class="muted small">📌 Gợi ý: ${esc(x.sampleAnswer)}</span>` : ''}`));
      }
      const count = items.length;
      const unitLabel = t === 'matching' ? 'cặp' : t === 'ordering' ? 'mục' : 'câu';
      return `<div class="card pv-round">
        <div class="pv-round-head">
          <h3 class="card-title">${meta.icon} ${meta.title} <span class="pv-count">${count} ${unitLabel}</span></h3>
          <button type="button" class="btn small ghost" onclick="Preview.add('${t}')">➕ Thêm ${unitLabel}</button>
        </div>
        ${count ? items.join('') : '<p class="muted">Không có câu hỏi – vòng này sẽ được bỏ qua (hoặc bấm "➕ Thêm" để tạo mới).</p>'}
      </div>`;
    }).join('');
    $('pvRounds').innerHTML = html;
    showScreen('screenPreview');
  },

  item(type, idx, body) {
    const key = `${type}_${idx}`;
    const isEditing = this.editingKey === key;
    return `<div class="pv-item" id="pv_${key}">
      <div class="pv-item-row">
        <div class="pv-item-body selectable-text" onclick="Preview.toggleEdit('${type}', ${idx})" title="Bấm để chỉnh sửa câu này">${body}</div>
        <div class="pv-item-actions">
          <button type="button" class="btn small edit-btn" onclick="Preview.toggleEdit('${type}', ${idx})" title="Chỉnh sửa trực tiếp">✏️ Sửa</button>
          <button type="button" class="btn small danger" onclick="Preview.remove('${type}', ${idx})" title="Xóa">🗑</button>
        </div>
      </div>
      ${isEditing ? this.renderEditor(type, idx) : ''}
    </div>`;
  },

  levelSelectHtml(current) {
    const cur = LEVEL_NAMES[levelKey(current)];
    return `<select id="ed_level">
      <option value="Nhận biết" ${cur === 'Nhận biết' ? 'selected' : ''}>Nhận biết</option>
      <option value="Thông hiểu" ${cur === 'Thông hiểu' ? 'selected' : ''}>Thông hiểu</option>
      <option value="Vận dụng" ${cur === 'Vận dụng' ? 'selected' : ''}>Vận dụng</option>
    </select>`;
  },

  renderEditor(type, idx) {
    const Q = App.analysis.questions;
    let fields = '';
    if (type === 'mcq') {
      const x = Q.mcq[idx];
      const opts = [...x.options, '', '', '', ''].slice(0, 4);
      fields = `
        <div class="pv-ed-grid">
          <div><label class="pv-ed-lbl">Nội dung câu hỏi trắc nghiệm</label><textarea id="ed_q" rows="2">${esc(x.q)}</textarea></div>
          <div><label class="pv-ed-lbl">Mức độ nhận thức</label>${this.levelSelectHtml(x.level)}</div>
        </div>
        <label class="pv-ed-lbl">Các phương án A, B, C, D (tích chọn ô tròn ở phương án ĐÚNG)</label>
        <div class="pv-ed-opts">
          ${opts.map((o, k) => `<div class="pv-ed-opt">
            <input type="radio" name="ed_ans" value="${k}" ${k === x.ans ? 'checked' : ''} title="Chọn làm đáp án đúng">
            <strong>${'ABCD'[k]}.</strong>
            <input type="text" id="ed_opt_${k}" value="${esc(o)}" placeholder="Phương án ${'ABCD'[k]}">
          </div>`).join('')}
        </div>
        <div class="pv-ed-row"><label class="pv-ed-lbl">Giải thích / Dẫn chứng trong văn bản</label><input type="text" id="ed_explain" value="${esc(x.explain || '')}" placeholder="Giải thích ngắn gọn vì sao đáp án này đúng…"></div>`;
    } else if (type === 'trueFalse') {
      const x = Q.trueFalse[idx];
      fields = `
        <div class="pv-ed-row"><label class="pv-ed-lbl">Nội dung nhận định Đúng / Sai</label><textarea id="ed_statement" rows="2">${esc(x.statement)}</textarea></div>
        <div class="pv-ed-grid">
          <div>
            <label class="pv-ed-lbl">Đáp án đúng</label>
            <select id="ed_tf_ans">
              <option value="true" ${x.answer ? 'selected' : ''}>✔ ĐÚNG</option>
              <option value="false" ${!x.answer ? 'selected' : ''}>✘ SAI</option>
            </select>
          </div>
          <div><label class="pv-ed-lbl">Mức độ nhận thức</label>${this.levelSelectHtml(x.level)}</div>
        </div>
        <div class="pv-ed-row"><label class="pv-ed-lbl">Giải thích / Dẫn chứng</label><input type="text" id="ed_explain" value="${esc(x.explain || '')}"></div>`;
    } else if (type === 'fillBlank') {
      const x = Q.fillBlank[idx];
      const opts = [...x.options, '', '', '', ''].slice(0, 4);
      const ansIdx = Math.max(0, x.options.indexOf(x.answer));
      fields = `
        <div class="pv-ed-grid">
          <div><label class="pv-ed-lbl">Câu điền từ (dùng đúng 4 gạch dưới ____ cho chỗ trống)</label><textarea id="ed_sentence" rows="2">${esc(x.sentence)}</textarea></div>
          <div><label class="pv-ed-lbl">Mức độ nhận thức</label>${this.levelSelectHtml(x.level)}</div>
        </div>
        <label class="pv-ed-lbl">4 thẻ từ lựa chọn (tích chọn ô tròn ở từ ĐÚNG cần điền)</label>
        <div class="pv-ed-opts">
          ${opts.map((o, k) => `<div class="pv-ed-opt">
            <input type="radio" name="ed_fb_ans" value="${k}" ${k === ansIdx ? 'checked' : ''} title="Chọn làm từ đúng">
            <strong>#${k + 1}</strong>
            <input type="text" id="ed_fb_opt_${k}" value="${esc(o)}" placeholder="Từ lựa chọn ${k + 1}">
          </div>`).join('')}
        </div>
        <div class="pv-ed-row"><label class="pv-ed-lbl">Giải thích</label><input type="text" id="ed_explain" value="${esc(x.explain || '')}"></div>`;
    } else if (type === 'matching') {
      const p = Q.matching.pairs[idx];
      fields = `
        <div class="pv-ed-opts">
          <div><label class="pv-ed-lbl">Vế trái (Chi tiết / Hình ảnh / Luận điểm)</label><input type="text" id="ed_left" value="${esc(p.left)}"></div>
          <div><label class="pv-ed-lbl">Vế phải (Ý nghĩa / Đặc điểm tương ứng)</label><input type="text" id="ed_right" value="${esc(p.right)}"></div>
        </div>`;
    } else if (type === 'ordering') {
      const s = Q.ordering.items[idx];
      const total = Q.ordering.items.length;
      fields = `
        <div class="pv-ed-row"><label class="pv-ed-lbl">Nội dung mục ở vị trí thứ ${idx + 1}</label><input type="text" id="ed_order_item" value="${esc(s)}"></div>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="muted small">Đổi vị trí chuẩn:</span>
          <button type="button" class="btn small ghost" onclick="Preview.moveOrder(${idx}, -1)" ${idx === 0 ? 'disabled' : ''}>▲ Đưa lên trước</button>
          <button type="button" class="btn small ghost" onclick="Preview.moveOrder(${idx}, 1)" ${idx === total - 1 ? 'disabled' : ''}>▼ Đưa xuống dưới</button>
        </div>`;
    } else if (type === 'openEnded') {
      const x = Q.openEnded[idx];
      fields = `
        <div class="pv-ed-row"><label class="pv-ed-lbl">Câu hỏi tự luận / Vận dụng THPT</label><textarea id="ed_open_q" rows="2">${esc(x.q)}</textarea></div>
        <div class="pv-ed-row"><label class="pv-ed-lbl">Tiêu chí chấm (Rubric)</label><textarea id="ed_rubric" rows="2">${esc(x.rubric || '')}</textarea></div>
        <div class="pv-ed-row"><label class="pv-ed-lbl">Đáp án gợi ý</label><textarea id="ed_sample" rows="3">${esc(x.sampleAnswer || '')}</textarea></div>`;
    }
    return `<div class="pv-editor" onclick="event.stopPropagation()">
      ${fields}
      <div class="pv-ed-actions">
        <button type="button" class="btn small ghost" onclick="Preview.cancelEdit()">Hủy</button>
        <button type="button" class="btn small primary" onclick="Preview.saveEdit('${type}', ${idx})">💾 Lưu câu hỏi</button>
      </div>
    </div>`;
  },

  toggleEdit(type, idx) {
    const key = `${type}_${idx}`;
    this.editingKey = this.editingKey === key ? null : key;
    this.render();
    if (this.editingKey) {
      const el = $(`pv_${key}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  },

  cancelEdit() {
    this.editingKey = null;
    this.render();
  },

  saveEdit(type, idx) {
    const Q = App.analysis.questions;
    if (type === 'mcq') {
      const q = $('ed_q').value.trim();
      const opts = [0, 1, 2, 3].map((k) => $(`ed_opt_${k}`).value.trim()).filter(Boolean);
      const ansRadio = document.querySelector('input[name="ed_ans"]:checked');
      const ans = ansRadio ? clamp(+ansRadio.value, 0, opts.length - 1) : 0;
      if (!q || opts.length < 2) return toast('Hãy nhập nội dung câu hỏi và ít nhất 2 phương án trả lời.', true);
      Q.mcq[idx] = { q, options: opts, ans, level: $('ed_level').value, explain: $('ed_explain').value.trim() };
    } else if (type === 'trueFalse') {
      const statement = $('ed_statement').value.trim();
      if (!statement) return toast('Hãy nhập nội dung nhận định.', true);
      Q.trueFalse[idx] = {
        statement,
        answer: $('ed_tf_ans').value === 'true',
        level: $('ed_level').value,
        explain: $('ed_explain').value.trim(),
      };
    } else if (type === 'fillBlank') {
      let sentence = $('ed_sentence').value.trim().replace(/_{2,}/g, '____');
      const opts = [0, 1, 2, 3].map((k) => $(`ed_fb_opt_${k}`).value.trim()).filter(Boolean);
      const ansRadio = document.querySelector('input[name="ed_fb_ans"]:checked');
      const ansIdx = ansRadio ? clamp(+ansRadio.value, 0, opts.length - 1) : 0;
      const answer = opts[ansIdx] || '';
      if (!sentence || !answer || opts.length < 2) return toast('Hãy nhập câu điền từ và ít nhất 2 lựa chọn.', true);
      if (!sentence.includes('____')) sentence += ' ____';
      Q.fillBlank[idx] = {
        sentence,
        answer,
        options: opts,
        ans: ansIdx,
        level: $('ed_level').value,
        explain: $('ed_explain').value.trim(),
      };
    } else if (type === 'matching') {
      const left = $('ed_left').value.trim();
      const right = $('ed_right').value.trim();
      if (!left || !right) return toast('Hãy nhập đủ cả 2 vế của cặp nối.', true);
      Q.matching.pairs[idx] = { left, right };
    } else if (type === 'ordering') {
      const val = $('ed_order_item').value.trim();
      if (!val) return toast('Nội dung mục sắp xếp không được để trống.', true);
      Q.ordering.items[idx] = val;
    } else if (type === 'openEnded') {
      const q = $('ed_open_q').value.trim();
      if (!q) return toast('Hãy nhập câu hỏi tự luận.', true);
      Q.openEnded[idx] = {
        q,
        rubric: $('ed_rubric').value.trim(),
        sampleAnswer: $('ed_sample').value.trim(),
      };
    }
    this.editingKey = null;
    App.saveSession();
    this.render();
    toast('✅ Đã lưu chỉnh sửa câu đọc hiểu!');
  },

  moveOrder(idx, dir) {
    const items = App.analysis.questions.ordering.items;
    const curVal = $('ed_order_item')?.value.trim();
    if (curVal) items[idx] = curVal;
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    [items[idx], items[target]] = [items[target], items[idx]];
    this.editingKey = `ordering_${target}`;
    App.saveSession();
    this.render();
  },

  add(type) {
    const Q = App.analysis.questions;
    let newIdx = 0;
    if (type === 'mcq') {
      Q.mcq.push({ q: 'Câu hỏi đọc hiểu mới…', options: ['Phương án A (đáp án đúng)', 'Phương án B', 'Phương án C', 'Phương án D'], ans: 0, level: 'Thông hiểu', explain: '' });
      newIdx = Q.mcq.length - 1;
    } else if (type === 'trueFalse') {
      Q.trueFalse.push({ statement: 'Nhận định mới về văn bản…', answer: true, level: 'Nhận biết', explain: '' });
      newIdx = Q.trueFalse.length - 1;
    } else if (type === 'fillBlank') {
      Q.fillBlank.push({ sentence: 'Điền từ còn thiếu vào chỗ trống: ____.', answer: 'từ đúng', options: ['từ đúng', 'từ nhiễu 1', 'từ nhiễu 2', 'từ nhiễu 3'], ans: 0, level: 'Nhận biết', explain: '' });
      newIdx = Q.fillBlank.length - 1;
    } else if (type === 'matching') {
      Q.matching.pairs.push({ left: 'Chi tiết / Hình ảnh mới', right: 'Ý nghĩa biểu đạt tương ứng' });
      newIdx = Q.matching.pairs.length - 1;
    } else if (type === 'ordering') {
      Q.ordering.items.push('Sự việc / luận điểm tiếp theo…');
      newIdx = Q.ordering.items.length - 1;
    } else if (type === 'openEnded') {
      Q.openEnded.push({ q: 'Câu hỏi tự luận / vận dụng mới…', rubric: 'Nêu được luận điểm rõ ràng, dẫn chứng phù hợp từ ngữ liệu.', sampleAnswer: '' });
      newIdx = Q.openEnded.length - 1;
    }
    this.editingKey = `${type}_${newIdx}`;
    App.saveSession();
    this.render();
    const el = $(`pv_${this.editingKey}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  },

  toggleOverviewEdit() {
    const ed = $('pvOverviewEditor');
    const disp = $('pvOverviewDisplay');
    if (!ed.hidden) {
      ed.hidden = true;
      disp.hidden = false;
      return;
    }
    const a = App.analysis;
    ed.innerHTML = `
      <div class="pv-ed-opts">
        <div><label class="pv-ed-lbl">Tên văn bản / Đoạn trích</label><input type="text" id="ed_meta_title" value="${esc(a.title)}"></div>
        <div><label class="pv-ed-lbl">Tác giả / Nguồn</label><input type="text" id="ed_meta_author" value="${esc(a.author || '')}"></div>
      </div>
      <div class="pv-ed-opts">
        <div><label class="pv-ed-lbl">Thể loại</label><input type="text" id="ed_meta_genre" value="${esc(a.genre || '')}"></div>
        <div><label class="pv-ed-lbl">Khối lớp</label><input type="text" id="ed_meta_grade" value="${esc(a.gradeLevel || '')}"></div>
      </div>
      <div class="pv-ed-row"><label class="pv-ed-lbl">Tóm tắt văn bản</label><textarea id="ed_meta_summary" rows="3">${esc(a.summary || '')}</textarea></div>
      <div class="pv-ed-row"><label class="pv-ed-lbl">Chủ đề / Cảm hứng chủ đạo</label><input type="text" id="ed_meta_theme" value="${esc(a.theme || '')}"></div>
      <div class="pv-ed-actions">
        <button type="button" class="btn small ghost" onclick="Preview.toggleOverviewEdit()">Hủy</button>
        <button type="button" class="btn small primary" onclick="Preview.saveOverviewEdit()">💾 Lưu thông tin chung</button>
      </div>`;
    disp.hidden = true;
    ed.hidden = false;
  },

  saveOverviewEdit() {
    const a = App.analysis;
    a.title = $('ed_meta_title').value.trim() || a.title;
    a.author = $('ed_meta_author').value.trim();
    a.genre = $('ed_meta_genre').value.trim();
    a.gradeLevel = $('ed_meta_grade').value.trim();
    a.summary = $('ed_meta_summary').value.trim();
    a.theme = $('ed_meta_theme').value.trim();
    App.saveSession();
    this.render();
    toast('✅ Đã cập nhật thông tin tổng quan ngữ liệu!');
  },

  remove(type, idx) {
    const Q = App.analysis.questions;
    if (type === 'matching') {
      Q.matching.pairs.splice(idx, 1);
    } else if (type === 'ordering') {
      Q.ordering.items.splice(idx, 1);
    } else {
      Q[type].splice(idx, 1);
    }
    if (this.editingKey === `${type}_${idx}`) this.editingKey = null;
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
  log: [],
  keys: null,
  locked: false,

  start() {
    const Q = App.analysis.questions;
    this.rounds = App.settings.rounds.filter((t) => ROUND_ORDER.includes(t)).sort((a, b) => ROUND_ORDER.indexOf(a) - ROUND_ORDER.indexOf(b)).map((t) => {
      if (t === 'matching') return { type: t, items: Q.matching.pairs.length >= 2 ? [Q.matching] : [] };
      if (t === 'ordering') return { type: t, items: Q.ordering.items.length >= 3 ? [Q.ordering] : [] };
      return { type: t, items: Q[t] };
    }).filter((r) => r.items.length);

    if (!this.rounds.length) return toast('Không còn câu hỏi nào để chơi. Hãy nạp lại ngữ liệu.', true);

    Sound.stopAll();
    this.rIdx = 0; this.iIdx = 0; this.done = 0; this.score = 0; this.review = []; this.log = [];
    this.totalSteps = this.rounds.reduce((s, r) => s + r.items.length, 0);
    this.stats = {};
    this.rounds.forEach((r) => { this.stats[r.type] = { points: 0, max: 0, correct: 0, total: 0 }; });
    this.levels = { NB: { c: 0, t: 0 }, TH: { c: 0, t: 0 }, VD: { c: 0, t: 0 } };
    Drawer.syncContent();
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
    const msg = pct >= 80 ? 'Xuất sắc! Cả lớp nắm rất vững ngữ liệu 👏' : pct >= 50 ? 'Khá tốt! Cùng bứt phá ở vòng tiếp theo nhé 💪' : 'Hãy đối chiếu kĩ hơn với văn bản gốc nhé 📖';
    Sound.play('round');
    this.stage(`<div class="round-summary">
      <div style="font-size:60px">${pct >= 80 ? '🏆' : pct >= 50 ? '⭐' : '📖'}</div>
      <h2>Hoàn thành vòng ${this.rIdx + 1}: ${ROUNDS[this.round.type].title}</h2>
      <div class="big-num">${pct}%</div>
      <p style="font-size:20px;color:#cbd5e1;margin-bottom:26px">${msg}</p>
      <button class="btn primary big" id="btnGo">${last ? '📊 Xem Infographic & Thống kê kết quả' : `Sang vòng ${this.rIdx + 2} ➜`}</button>
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

  /* ── Vòng trắc nghiệm & điền từ ── */
  renderChoice(type) {
    const it = this.item;
    const isFill = type === 'fillBlank';
    const qHtml = isFill
      ? esc(it.sentence).replace('____', '<span class="blank" id="blank">?</span>')
      : esc(it.q);
    const optsHtml = isFill
      ? `<div class="chips">${it.options.map((o, i) => `<button class="chip" data-i="${i}">${esc(o)}</button>`).join('')}</div>`
      : `<div class="options">${it.options.map((o, i) => `<button class="opt c${i}" data-i="${i}"><span class="opt-key">${'ABCD'[i]}</span><span>${esc(o)}</span></button>`).join('')}</div>`;

    this.stage(`<div class="q-card">${this.qMeta(lvlBadge(it.level))}<div class="q-text selectable-text">${qHtml}</div>
      ${isFill ? '<div class="q-hint">Chọn từ ngữ / khái niệm phù hợp điền vào chỗ trống:</div>' : ''}</div>
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
    this.stage(`<div class="q-card">${this.qMeta(lvlBadge(it.level))}<div class="q-text selectable-text">“${esc(it.statement)}”</div></div>
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
    const links = {};
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
      this.showNext(this.feedback(all ? 'ok' : 'bad', `Đúng vị trí ${correct}/${n} mục · +${correct * 4} điểm`, all ? 'Hoàn hảo! Nắm rất chắc bố cục và mạch văn bản.' : 'Các mục màu đỏ có ghi vị trí đúng bên dưới.'));
    };
    $('btnConfirm').onclick = confirm;
    this.keys = { confirm };
  },

  /* ── Vòng Tự luận ngắn ── */
  renderOpen() {
    const it = this.item;
    const hasKey = !!App.apiKey();
    this.stage(`<div class="q-card">${this.qMeta(lvlBadge('Vận dụng'))}<div class="q-text selectable-text">${esc(it.q)}</div></div>
      <div class="card">
        <label class="field-label" for="openAns">✍️ Câu trả lời của học sinh / của lớp:</label>
        <textarea id="openAns" class="open-answer" placeholder="Giáo viên nhập hoặc dán câu trả lời của học sinh vào đây…"></textarea>
        <div class="action-row">
          ${hasKey ? '<button class="btn primary big" id="btnAIGrade">🤖 AI chấm điểm theo Rubric THPT</button>' : ''}
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

    const sampleHtml = () => `<div class="sample-box selectable-text"><strong>📌 Gợi ý đáp án:</strong> ${esc(it.sampleAnswer || '—')}<br><strong>🎯 Tiêu chí chấm:</strong> ${esc(it.rubric || '—')}</div>`;

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
          b.disabled = false; b.textContent = '🤖 AI chấm điểm theo Rubric THPT';
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

/* ───────── INFOGRAPHIC CHỐT KIẾN THỨC & THỐNG KÊ ───────── */
const Result = {
  render() {
    const a = App.analysis;
    const G = Game;
    if (!G.stats) G.stats = {};
    if (!G.levels || !G.levels.NB) G.levels = { NB: { c: 0, t: 0 }, TH: { c: 0, t: 0 }, VD: { c: 0, t: 0 } };
    if (!G.log) G.log = [];
    if (!G.review) G.review = [];
    if (!G.rounds) G.rounds = [];
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

    $('infographic').innerHTML = `<div class="ig selectable-text">
      <div class="ig-head">
        <div>
          <div class="ig-kicker">Infographic chốt kiến thức · Đọc hiểu Ngữ văn THPT</div>
          <div class="ig-title">${esc(a.title)}</div>
          <div class="ig-tags">${tags}</div>
        </div>
        <div class="ig-score" style="background:conic-gradient(${ringColor} ${pct * 3.6}deg, #e2e8f0 0)">
          <div class="ig-score-inner"><div class="ig-score-num">${pct}%</div><div class="ig-score-lbl">${rating}<br>${G.score}/${max} điểm</div></div>
        </div>
      </div>
      <div class="ig-grid">
        ${box('teal', a.theme ? 8 : 12, '📌 Tổng quan văn bản', a.summary ? `<p>${esc(a.summary)}</p>` : '')}
        ${box('dark', 4, '🎯 Chủ đề & Cảm hứng', a.theme ? `<p class="ig-message">${esc(a.theme)}</p>` : '')}
        ${box('', 12, '🧭 Mạch cảm xúc / Trình tự sự việc / Luận điểm', timeline)}
        ${box('pink', techs ? 6 : 12, '👥 Hình tượng / Chủ thể trữ tình', chars)}
        ${box('violet', chars ? 6 : 12, '🎨 Đặc sắc nghệ thuật & Thi pháp', techs)}
        ${box('blue', a.message ? 7 : 12, '🗂 Bố cục / Hệ thống ý chính', ideas)}
        ${box('amber', ideas ? 5 : 12, '💡 Thông điệp – Giá trị tư tưởng', a.message ? `<p class="ig-message">${esc(a.message)}</p>` : '')}
        ${box('blue', 5, '📚 Từ ngữ & Khái niệm cần nhớ', vocab)}
        ${box('', vocab ? 7 : 12, '📊 Kết quả đọc hiểu của lớp', `${this.tallyLine()}${roundBars}${levelBars ? `<div style="margin-top:10px;font-weight:800;font-size:13px;color:#64748b">THEO MỨC ĐỘ NHẬN THỨC</div>${levelBars}` : ''}`)}
        ${box('pink', 12, '🔁 Nội dung cần ôn lại', review)}
      </div>
      <div class="ig-foot">Hệ thống Đọc Hiểu Cùng AI (Chương trình THPT) · ${new Date().toLocaleDateString('vi-VN')}${App.isDemo ? ' · Ngữ liệu mẫu' : ''}</div>
    </div>`;
    MindMap.render();
    NotebookLM.render();
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

  renderStats(filter = 'all') {
    const log = Game.log;
    const c = this.counts(log);
    const byRound = Game.rounds.map((r) => ({ r, ...this.counts(log.filter((x) => x.type === r.type)) }));
    const byLevel = ['Nhận biết', 'Thông hiểu', 'Vận dụng'].map((lv) => ({ lv, ...this.counts(log.filter((x) => x.level === lv)) })).filter((x) => x.total);
    const rows = log.map((x, i) => ({ ...x, n: i + 1 })).filter((x) => filter === 'all' || (filter === 'bad' ? !x.ok : x.ok));

    $('statsPanel').innerHTML = `<div class="stats selectable-text" id="statsSection">
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

  exportCsv() {
    const log = Game.log;
    if (!log.length) return toast('Chưa có dữ liệu thống kê.', true);
    const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const c = this.counts(log);
    const lines = [
      ['Văn bản', App.analysis.title], ['Khối lớp', App.analysis.gradeLevel || App.settings.grade], ['Ngày', new Date().toLocaleString('vi-VN')],
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

/* ───────── BẢN SƠ ĐỒ TƯ DUY CHỐT KIẾN THỨC (MIND MAP) ───────── */
const MindMap = {
  wrapLines(text, maxChars = 28, maxLines = 3) {
    const words = str(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).trim().length <= maxChars) {
        cur = (cur + ' ' + w).trim();
      } else {
        if (cur) lines.push(cur);
        cur = w;
        if (lines.length >= maxLines - 1) break;
      }
    }
    if (cur && lines.length < maxLines) {
      const used = lines.join(' ').split(/\s+/).filter(Boolean).length + cur.split(/\s+/).filter(Boolean).length;
      if (used < words.length) cur = cur.slice(0, Math.max(10, maxChars - 2)) + '…';
      lines.push(cur);
    }
    return lines.length ? lines : ['—'];
  },

  buildSvg() {
    const a = App.analysis;
    const branches = [
      { title: '🎯 CHỦ ĐỀ & CẢM HỨNG', color: '#0d9488', bg: '#f0fdfa', side: 'L', y: 125, items: [a.theme || a.summary || 'Chủ đề trọng tâm'] },
      { title: '🗂 BỐ CỤC / MẠCH Ý', color: '#2563eb', bg: '#eff6ff', side: 'L', y: 310, items: (a.mainIdeas.length ? a.mainIdeas : a.timeline).slice(0, 3) },
      { title: '👥 HÌNH TƯỢNG / NHÂN VẬT', color: '#db2777', bg: '#fdf2f8', side: 'L', y: 495, items: a.characters.slice(0, 3).map((c) => `${c.name}: ${c.traits}`) },
      { title: '🎨 ĐẶC SẮC NGHỆ THUẬT', color: '#7c3aed', bg: '#f5f3ff', side: 'R', y: 125, items: a.artTechniques.slice(0, 3).map((t) => `${t.name}${t.effect ? ' → ' + t.effect : ''}`) },
      { title: '💡 THÔNG ĐIỆP TƯ TƯỞNG', color: '#d97706', bg: '#fffbeb', side: 'R', y: 310, items: [a.message || 'Giá trị nhân sinh sâu sắc'] },
      { title: '📚 TỪ KHÓA / KHÁI NIỆM', color: '#16a34a', bg: '#f0fdf4', side: 'R', y: 495, items: a.vocabulary.slice(0, 3).map((v) => `${v.word}: ${v.meaning}`) },
    ];

    const W = 1160, H = 640, cx = W / 2, cy = H / 2;
    let paths = '';
    let nodes = '';

    branches.forEach((b) => {
      const bx = b.side === 'L' ? 200 : W - 200;
      const by = b.y;
      const c1x = b.side === 'L' ? cx - 110 : cx + 110;
      const c2x = b.side === 'L' ? bx + 140 : bx - 140;
      paths += `<path d="M ${cx} ${cy} C ${c1x} ${cy}, ${c2x} ${by}, ${bx} ${by}" fill="none" stroke="${b.color}" stroke-width="4" stroke-linecap="round" opacity="0.85"/>`;

      const lines = [];
      const items = b.items.length ? b.items : ['—'];
      items.forEach((it) => {
        this.wrapLines(it, 42, items.length === 1 ? 4 : 2).forEach((ln, idx) => lines.push((idx === 0 ? '• ' : '  ') + ln));
      });
      const showLines = lines.slice(0, 6);
      const boxW = 360;
      const boxH = 44 + showLines.length * 19;
      const rx = bx - boxW / 2;
      const ry = by - boxH / 2;

      nodes += `<g>
        <rect x="${rx}" y="${ry}" width="${boxW}" height="${boxH}" rx="14" fill="${b.bg}" stroke="${b.color}" stroke-width="2.5"/>
        <rect x="${rx}" y="${ry}" width="${boxW}" height="30" rx="12" fill="${b.color}"/>
        <text x="${bx}" y="${ry + 20}" text-anchor="middle" fill="#ffffff" font-family="Be Vietnam Pro, Segoe UI, sans-serif" font-size="13" font-weight="800">${esc(b.title)}</text>
        ${showLines.map((ln, idx) => `<text x="${rx + 14}" y="${ry + 50 + idx * 19}" fill="#1e293b" font-family="Be Vietnam Pro, Segoe UI, sans-serif" font-size="12.5" font-weight="600">${esc(ln)}</text>`).join('')}
      </g>`;
    });

    const titleLines = this.wrapLines(a.title, 22, 2);
    const metaLine = [a.author, a.genre, a.gradeLevel].filter(Boolean).join(' · ').slice(0, 38);

    return `<svg id="mindMapSvg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
      <defs>
        <linearGradient id="mmCenterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#312e81"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" rx="18" fill="#f8fafc"/>
      ${paths}
      ${nodes}
      <g>
        <rect x="${cx - 155}" y="${cy - 68}" width="310" height="136" rx="24" fill="url(#mmCenterGrad)" stroke="#5eead4" stroke-width="4"/>
        <text x="${cx}" y="${cy - 32}" text-anchor="middle" fill="#5eead4" font-family="Be Vietnam Pro, Segoe UI, sans-serif" font-size="11.5" font-weight="800" letter-spacing="1.5">SƠ ĐỒ TƯ DUY TÁC PHẨM</text>
        ${titleLines.map((ln, idx) => `<text x="${cx}" y="${cy - 4 + idx * 24}" text-anchor="middle" fill="#ffffff" font-family="Be Vietnam Pro, Segoe UI, sans-serif" font-size="19" font-weight="900">${esc(ln)}</text>`).join('')}
        <text x="${cx}" y="${cy + 48}" text-anchor="middle" fill="#fde68a" font-family="Be Vietnam Pro, Segoe UI, sans-serif" font-size="12" font-weight="700">${esc(metaLine)}</text>
      </g>
    </svg>`;
  },

  render() {
    $('mindMapPanel').innerHTML = `<div class="mm-card" id="mindMapSection">
      <div class="mm-head">
        <div>
          <h2 class="mm-title">🧠 Bản Sơ Đồ Tư Duy Chốt Kiến Thức</h2>
          <div class="mm-sub">Tổng hợp trực quan toàn bộ hệ thống ý chính, hình tượng, thi pháp và thông điệp của ngữ liệu</div>
        </div>
        <div class="no-print" style="display:flex;gap:8px;flex-wrap:wrap">
          <button type="button" class="btn small ghost" id="btnDownloadMmSvg">⬇ Tải Sơ đồ (.svg)</button>
          <button type="button" class="btn small violet-btn" id="btnMmToNlm">🚀 Đẩy qua Google NotebookLM ➜</button>
        </div>
      </div>
      <div class="mm-svg-wrap">${this.buildSvg()}</div>
    </div>`;
    $('btnDownloadMmSvg').onclick = () => this.downloadSvg();
    $('btnMmToNlm').onclick = () => $('nlmSection')?.scrollIntoView({ behavior: 'smooth' });
  },

  downloadSvg() {
    const svg = $('mindMapSvg')?.outerHTML;
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `so-do-tu-duy-${(App.analysis?.title || 'van-ban').slice(0, 30)}.svg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast('✅ Đã tải file Sơ đồ tư duy (.svg)!');
  },
};

/* ───────── TRUNG TÂM ĐẤU NỐI GOOGLE NOTEBOOKLM (GEMINI NOTEBOOK) ───────── */
const NotebookLM = {
  bridgeUrl: 'http://localhost:8899',
  bridgeState: { connected: false, authenticated: false, notebooks: [], error: '' },
  activeTab: 'report',
  lastNotebookId: '',
  lastNotebookUrl: '',
  sourcesUploaded: false,
  autoExecuteOnSelect: true,
  liveResults: {},
  itemState: {},
  pollTimers: {},
  loginWatchTimer: null,

  buildSourcePackage() {
    const a = App.analysis;
    const G = Game;
    const c = Result.counts(G.log);

    const src1 = [
      `# NGỮ LIỆU ĐỌC HIỂU & PHÂN TÍCH HỌC THUẬT THPT: ${a.title.toUpperCase()}`,
      `- Tác giả / Nguồn: ${a.author || 'Không rõ'}`,
      `- Thể loại: ${a.genre || 'Văn bản đọc hiểu'}`,
      `- Khối lớp / Chương trình: ${a.gradeLevel || App.settings.grade} (CT GDPT 2018)`,
      '',
      '## 1. NGUYÊN VĂN NGỮ LIỆU',
      App.sourceText || '(Ngữ liệu từ ảnh)',
      '',
      '## 2. TÓM TẮT & CHỦ ĐỀ',
      `- Tóm tắt: ${a.summary}`,
      `- Chủ đề & Cảm hứng chủ đạo: ${a.theme}`,
      `- Thông điệp tư tưởng: ${a.message}`,
      '',
      '## 3. BỐ CỤC & MẠCH TRIỂN KHAI',
      ...(a.mainIdeas.length ? a.mainIdeas.map((x, i) => `${i + 1}. ${x}`) : []),
      ...(a.timeline.length ? ['', '### Trình tự mạch cảm xúc / sự việc / luận điểm:', ...a.timeline.map((x, i) => `- Bước ${i + 1}: ${x}`)] : []),
      '',
      '## 4. HÌNH TƯỢNG / NHÂN VẬT / CHỦ THỂ TRỮ TÌNH',
      ...a.characters.map((ch) => `- **${ch.name}**: ${ch.traits}`),
      '',
      '## 5. ĐẶC SẮC NGHỆ THUẬT & THI PHÁP',
      ...a.artTechniques.map((t) => `- **${t.name}**: Dẫn chứng "${t.example}" → Tác dụng: ${t.effect}`),
      '',
      '## 6. TỪ NGỮ & KHÁI NIỆM HỌC THUẬT',
      ...a.vocabulary.map((v) => `- **${v.word}**: ${v.meaning}`),
    ].join('\n');

    const src2 = [
      `# SƠ ĐỒ TƯ DUY, BỘ CÂU HỎI & THỐNG KÊ ĐỌC HIỂU CỦA LỚP: ${a.title.toUpperCase()}`,
      `- Kết quả đọc hiểu của lớp: Đúng ${c.ok}/${c.total} câu (${c.pct}%)`,
      ...(G.review.length ? ['', '## CÁC NỘI DUNG HỌC SINH CÒN NHẦM LẪN (CẦN GIẢNG KĨ TRONG BÀI GIẢNG / PODCAST / VIDEO):', ...G.review.map((r) => `- ${r}`)] : []),
      '',
      '## NGÂN HÀNG CÂU HỎI ĐỌC HIỂU 6 VÒNG:',
      '### Vòng 1: Trắc nghiệm',
      ...a.questions.mcq.map((q, i) => `${i + 1}. [${q.level}] ${q.q}\n   Đáp án đúng: ${q.options[q.ans]}\n   Giải thích: ${q.explain}`),
      '### Vòng 2: Đúng / Sai',
      ...a.questions.trueFalse.map((q, i) => `${i + 1}. [${q.level}] "${q.statement}" → ${q.answer ? 'ĐÚNG' : 'SAI'} (${q.explain})`),
      '### Vòng 6: Tự luận & Vận dụng THPT',
      ...a.questions.openEnded.map((q, i) => `${i + 1}. Câu hỏi: ${q.q}\n   Tiêu chí chấm: ${q.rubric}\n   Gợi ý đáp án: ${q.sampleAnswer}`),
    ].join('\n');

    return [
      { title: `Ngữ liệu & Phân tích: ${a.title}`, text: src1 },
      { title: `Sơ đồ tư duy & Kết quả Đọc hiểu: ${a.title}`, text: src2 },
    ];
  },

  features: [
    {
      id: 'audio',
      label: 'Tổng quan bằng âm thanh',
      shortLabel: '🎙️ Âm thanh',
      checked: true,
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round"><line x1="4" y1="9" x2="4" y2="15"/><line x1="9" y1="5" x2="9" y2="19"/><line x1="14" y1="10" x2="14" y2="16"/><path d="M18 4l1.2 2.8L22 8l-2.8 1.2L18 12l-1.2-2.8L14 8l2.8-1.2L18 4z" fill="#2563eb" stroke="none"/></svg>',
    },
    {
      id: 'slide_deck',
      label: 'Bản trình bày',
      shortLabel: '📊 Bản trình bày',
      checked: true,
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#c026d3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><line x1="7" y1="5" x2="7" y2="19"/><line x1="17" y1="5" x2="17" y2="19"/></svg>',
    },
    {
      id: 'video',
      label: 'Tổng quan bằng video',
      shortLabel: '🎬 Video',
      checked: true,
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="13" height="12" rx="2.5"/><path d="M16 10l5-3v10l-5-3v-4z"/></svg>',
    },
    {
      id: 'mind_map',
      label: 'Bản đồ tư duy',
      shortLabel: '🧠 Bản đồ tư duy',
      checked: true,
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="9.5" width="5" height="5" rx="1"/><rect x="16" y="4.5" width="5" height="5" rx="1"/><rect x="16" y="14.5" width="5" height="5" rx="1"/><path d="M8 12h4m0-5v10m0-10h4m-4 10h4"/></svg>',
    },
    {
      id: 'report',
      label: 'Báo cáo',
      shortLabel: '📄 Báo cáo',
      badge: 'Mới!',
      checked: true,
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#c026d3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 11v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6"/><path d="M15 2v6H9"/><path d="M18 3l1.1 2.4L21.5 6.5l-2.4 1.1L18 10l-1.1-2.4L14.5 6.5l2.4-1.1L18 3z" fill="#c026d3" stroke="none"/></svg>',
    },
    {
      id: 'flashcards',
      label: 'Thẻ ghi nhớ',
      shortLabel: '🗂️ Thẻ ghi nhớ',
      checked: true,
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="4" width="11" height="14" rx="2.5"/><path d="M15 18v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2"/></svg>',
    },
    {
      id: 'quiz',
      label: 'Bài kiểm tra',
      shortLabel: '❓ Bài kiểm tra',
      checked: true,
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="3" width="13" height="14" rx="2"/><path d="M17 17v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h1"/><path d="M11.8 8.2a1.8 1.8 0 0 1 3.4.8c0 1.2-1.7 1.5-1.7 2.5"/><circle cx="13.5" cy="14" r=".9" fill="#0d9488" stroke="none"/></svg>',
    },
    {
      id: 'infographic',
      label: 'Bản đồ hoạ thông tin',
      shortLabel: '📊 Bản đồ hoạ TT',
      checked: true,
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2.4" stroke-linecap="round"><line x1="6" y1="11" x2="6" y2="19"/><circle cx="6" cy="7" r="1.6" fill="#ea580c" stroke="none"/><line x1="12" y1="13" x2="12" y2="19"/><circle cx="12" cy="9" r="1.6" fill="#ea580c" stroke="none"/><line x1="18" y1="15" x2="18" y2="19"/><circle cx="18" cy="11" r="1.6" fill="#ea580c" stroke="none"/></svg>',
    },
    {
      id: 'data_table',
      label: 'Bảng dữ liệu',
      shortLabel: '📋 Bảng dữ liệu',
      checked: true,
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round"><circle cx="5" cy="7" r="1.4" fill="#2563eb" stroke="none"/><line x1="10" y1="7" x2="19" y2="7"/><circle cx="5" cy="12" r="1.4" fill="#2563eb" stroke="none"/><line x1="10" y1="12" x2="19" y2="12"/><circle cx="5" cy="17" r="1.4" fill="#2563eb" stroke="none"/><line x1="10" y1="17" x2="19" y2="17"/></svg>',
    },
  ],

  featLabel(id) {
    return this.features.find((f) => f.id === id)?.label || id;
  },

  render() {
    const a = App.analysis;
    this.liveResults = {};
    this.itemState = {};
    this.sourcesUploaded = false;
    Object.values(this.pollTimers).forEach((t) => clearInterval(t));
    this.pollTimers = {};

    const pillsHtml = this.features.map((f) => `
      <div class="nlm-pill-card ${this.activeTab === f.id ? 'active-preview' : ''}" data-feat="${f.id}" title="Bấm vào mục để tự động đấu nối, chuyển dữ liệu & hiện kết quả lên App">
        <div class="nlm-pill-left">
          <span class="nlm-pill-icon">${f.svg}</span>
          <span class="nlm-pill-label">${esc(f.label)}</span>
          ${f.badge ? `<span class="nlm-new-badge">${esc(f.badge)}</span>` : ''}
          <span class="nlm-pill-state" id="nlmPillState_${f.id}" hidden></span>
        </div>
        <input type="checkbox" class="nlm-pill-check" value="${f.id}" ${f.checked ? 'checked' : ''} title="Chọn tạo ${esc(f.label)}">
      </div>`).join('');

    const tabsHtml = this.features.map((f) => `
      <button type="button" class="studio-tab ${this.activeTab === f.id ? 'active' : ''}" data-tab="${f.id}">${f.shortLabel}</button>`).join('');

    $('notebooklmPanel').innerHTML = `<div class="nlm-card" id="nlmSection">
      <div class="nlm-head">
        <div>
          <div class="nlm-title">🚀 <span>ĐẤU NỐI GOOGLE NOTEBOOKLM (9 TÍNH NĂNG STUDIO)</span></div>
          <div style="font-size:14px;color:#cbd5e1;margin-top:4px">Khi chọn mục bất kỳ hoặc bấm nút thực hiện, ứng dụng tự động đấu nối, chuyển dữ liệu qua thực hiện và hiển thị kết quả trực tiếp ngay trên App</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <span class="nlm-badge" id="nlmConnBadge">⏳ Đang kiểm tra cầu nối NotebookLM…</span>
          <button type="button" class="btn small ghost" id="btnNlmRefresh">🔄 Kiểm tra kết nối</button>
          <button type="button" class="btn small" id="btnNlmLogin">🔑 Đăng nhập NotebookLM</button>
        </div>
      </div>

      <div class="nlm-grid">
        <!-- CỘT TRÁI: 9 TÍNH NĂNG GOOGLE NOTEBOOKLM STUDIO -->
        <div class="nlm-panel">
          <h3>① Chọn Tính năng Studio để Thực hiện &amp; Hiện lên App</h3>
          <div class="form-row">
            <label class="field-label" for="nlmTargetNotebook">Chọn Notebook đích trên Google NotebookLM</label>
            <select id="nlmTargetNotebook">
              <option value="">✨ Tạo Notebook mới: “Đọc hiểu THPT – ${esc(a.title)}”</option>
            </select>
          </div>

          <label class="nlm-auto-bar" for="chkAutoExecuteStudio">
            <span>⚡ Tự động đấu nối, chuyển dữ liệu &amp; thực hiện ngay khi bấm chọn mục</span>
            <input type="checkbox" id="chkAutoExecuteStudio" ${this.autoExecuteOnSelect ? 'checked' : ''}>
          </label>

          <div class="row-between" style="margin-top:6px;margin-bottom:4px;flex-wrap:wrap;gap:8px">
            <label class="field-label" style="margin:0">Bấm vào mục để thực hiện · Tích chọn chạy hàng loạt:</label>
            <div style="display:flex;gap:6px;flex-shrink:0">
              <button type="button" class="btn small ghost" id="btnNlmCheckAll" style="padding:4px 9px;font-size:12px;white-space:nowrap">☑ Chọn cả 9</button>
              <button type="button" class="btn small ghost" id="btnNlmUncheckAll" style="padding:4px 9px;font-size:12px;white-space:nowrap">☐ Bỏ chọn</button>
            </div>
          </div>

          <div class="nlm-artifacts-grid" id="nlmArtifactChecks">
            ${pillsHtml}
          </div>

          <div class="form-row">
            <label class="field-label" for="nlmFocusPrompt">Yêu cầu / Định hướng sư phạm (tùy chọn)</label>
            <input type="text" id="nlmFocusPrompt" value="Thiết kế học liệu tiếng Việt bám sát Chương trình Ngữ văn THPT 2018 (${esc(a.gradeLevel || App.settings.grade)}), nhấn mạnh các câu học sinh còn làm sai.">
          </div>

          <div class="nlm-actions">
            <button type="button" class="btn primary big" id="btnPushNlm">🚀 Tự động đấu nối, thực hiện &amp; Hiện kết quả lên App</button>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <button type="button" class="btn ghost small" id="btnOpenNlmWeb" title="Copy toàn bộ hồ sơ nguồn vào Clipboard và mở trang chủ Google NotebookLM">📤 Copy Nguồn &amp; Mở NotebookLM Web ↗</button>
              <button type="button" class="btn ghost small" id="btnDownloadNlmSource" title="Tải file Markdown chuẩn để nạp vào NotebookLM">📥 Tải file Nguồn (.md)</button>
            </div>
          </div>

          <div id="nlmPushResult" class="nlm-status-box" hidden></div>
        </div>

        <!-- CỘT PHẢI: HIỂN THỊ KẾT QUẢ TRỰC TIẾP TRÊN APP -->
        <div class="nlm-panel">
          <div class="row-between" style="margin-bottom:8px;margin-top:0;flex-wrap:wrap;gap:8px">
            <h3 style="margin:0">② Kết quả hiển thị trực tiếp trên App</h3>
            <div style="display:flex;gap:6px;flex-shrink:0">
              <button type="button" class="btn small primary" id="btnExecuteActiveTab" style="white-space:nowrap" title="Đấu nối và thực hiện ngay mục đang chọn để lấy kết quả mới">⚡ Thực hiện mục này</button>
              <button type="button" class="btn small ghost" id="btnCopyStudioOut" style="white-space:nowrap" title="Copy nội dung mục đang xem">📑 Copy</button>
            </div>
          </div>
          <div class="studio-tabs" id="studioTabs">
            ${tabsHtml}
          </div>
          <div class="studio-output selectable-text" id="studioOutput"></div>
        </div>
      </div>
    </div>`;

    $('btnNlmRefresh').onclick = () => this.checkStatus(false);
    $('btnNlmLogin').onclick = () => this.loginAndWatch();
    $('btnPushNlm').onclick = () => this.pushToNotebookLM();
    $('btnOpenNlmWeb').onclick = () => this.copyAndOpenWeb();
    $('btnDownloadNlmSource').onclick = () => this.downloadSourceMd();
    $('btnCopyStudioOut').onclick = () => copyToClipboard($('studioOutput')?.innerText || '', 'học liệu Studio');
    $('btnExecuteActiveTab').onclick = () => this.executeSingle(this.activeTab, true);
    $('chkAutoExecuteStudio').onchange = (e) => { this.autoExecuteOnSelect = e.target.checked; };
    $('btnNlmCheckAll').onclick = () => document.querySelectorAll('#nlmArtifactChecks input[type=checkbox]').forEach((c) => (c.checked = true));
    $('btnNlmUncheckAll').onclick = () => document.querySelectorAll('#nlmArtifactChecks input[type=checkbox]').forEach((c) => (c.checked = false));

    document.querySelectorAll('#nlmArtifactChecks .nlm-pill-card').forEach((card) => {
      card.onclick = (e) => {
        if (e.target.tagName === 'INPUT') return;
        this.switchStudioTab(card.dataset.feat, true);
      };
    });

    $('studioTabs').querySelectorAll('.studio-tab').forEach((btn) => {
      btn.onclick = () => this.switchStudioTab(btn.dataset.tab, true);
    });

    this.switchStudioTab(this.activeTab || 'report', false);
    this.checkStatus(true);
  },

  updatePillBadges() {
    this.features.forEach((f) => {
      const el = $(`nlmPillState_${f.id}`);
      if (!el) return;
      const st = this.itemState[f.id];
      if (!st || st.status === 'idle') {
        el.hidden = true;
      } else if (st.status === 'running') {
        el.hidden = false;
        el.className = 'nlm-pill-state running';
        el.textContent = '⏳ Đang chạy';
      } else if (st.status === 'done') {
        el.hidden = false;
        el.className = 'nlm-pill-state done';
        el.textContent = '✅ Xong';
      } else if (st.status === 'error') {
        el.hidden = false;
        el.className = 'nlm-pill-state error';
        el.textContent = '⚠️ Lỗi';
      }
    });
  },

  switchStudioTab(tab, userClicked = false) {
    this.activeTab = tab;
    document.querySelectorAll('#studioTabs .studio-tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('#nlmArtifactChecks .nlm-pill-card').forEach((c) => c.classList.toggle('active-preview', c.dataset.feat === tab));
    this.renderStudioTab(tab);
    if (userClicked && this.autoExecuteOnSelect && !this.liveResults[tab] && this.itemState[tab]?.status !== 'running') {
      this.executeSingle(tab, false);
    }
  },

  async api(path, body = null) {
    const base = window.location.port === '8899' ? '' : this.bridgeUrl;
    const res = await fetch(`${base}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
  },

  fileUrl(relPath) {
    if (!relPath) return '';
    if (/^https?:/i.test(relPath)) return relPath;
    const base = window.location.port === '8899' ? '' : this.bridgeUrl;
    return `${base}${relPath}`;
  },

  async checkStatus(silent = true) {
    const badge = $('nlmConnBadge');
    if (!badge) return;
    badge.className = 'nlm-badge';
    badge.textContent = '⏳ Đang kiểm tra cầu nối NotebookLM…';
    try {
      const data = await this.api('/api/notebooklm/status');
      this.bridgeState = { connected: true, authenticated: !!data.authenticated, notebooks: arr(data.notebooks), error: data.error || '' };
      if (data.authenticated) {
        badge.className = 'nlm-badge ok';
        badge.textContent = `🟢 Đã kết nối Google NotebookLM (${this.bridgeState.notebooks.length} notebook)`;
        const sel = $('nlmTargetNotebook');
        if (sel) {
          const curVal = sel.value || this.lastNotebookId;
          const defaultOpt = `<option value="">✨ Tạo Notebook mới: “Đọc hiểu THPT – ${esc(App.analysis.title)}”</option>`;
          sel.innerHTML = defaultOpt + this.bridgeState.notebooks.map((nb) => `<option value="${esc(nb.id)}">📒 ${esc(nb.title)} (${nb.source_count || 0} nguồn)</option>`).join('');
          if (curVal) sel.value = curVal;
        }
        if (!silent) toast('✅ Đã kết nối trực tiếp với tài khoản Google NotebookLM!');
      } else {
        badge.className = 'nlm-badge warn';
        badge.textContent = '🟡 Cầu nối sẵn sàng · Cần bấm "🔑 Đăng nhập NotebookLM"';
        if (!silent) toast(data.error || 'Hãy bấm "🔑 Đăng nhập NotebookLM" để xác thực tài khoản Google.', true);
      }
    } catch (e) {
      this.bridgeState = { connected: false, authenticated: false, notebooks: [], error: e.message };
      badge.className = 'nlm-badge warn';
      badge.textContent = App.apiKey()
        ? '🟢 Chế độ AI Studio Trực tiếp (Tự động thực hiện & hiện kết quả ngay trên App)'
        : '🌐 Chế độ Web (Nhập Gemini API Key hoặc chạy Chay_Game.bat để đấu nối tự động)';
      if (!silent) toast('Đang ở chế độ Web trực tiếp. Bạn có thể bấm chọn bất kỳ mục nào để thực hiện và xem kết quả ngay trên App!');
    }
  },

  async loginAndWatch(afterLoginCallback = null) {
    try {
      const data = await this.api('/api/notebooklm/login', {});
      toast(data.message || 'Đã mở trình duyệt đăng nhập Google NotebookLM. Đang chờ xác thực tự động…');
      if (this.loginWatchTimer) clearInterval(this.loginWatchTimer);
      let checks = 0;
      this.loginWatchTimer = setInterval(async () => {
        checks++;
        if (checks > 60) {
          clearInterval(this.loginWatchTimer);
          return;
        }
        await this.checkStatus(true);
        if (this.bridgeState.authenticated) {
          clearInterval(this.loginWatchTimer);
          toast('🎉 Đăng nhập Google NotebookLM thành công! Đang tự động đấu nối dữ liệu…');
          if (afterLoginCallback) afterLoginCallback();
        }
      }, 3000);
    } catch (e) {
      window.open('https://notebooklm.google.com/', '_blank', 'noopener');
      toast('Đã mở trang Google NotebookLM. Nếu chạy trên máy tính, hãy mở bằng Chay_Game.bat để đồng bộ tự động.');
    }
  },

  /* ── Thực hiện 1 mục đã chọn & tự động trả kết quả về hiển thị ngay trên App ── */
  async executeSingle(tab, manualClick = false) {
    const label = this.featLabel(tab);
    this.itemState[tab] = { status: 'running', msg: `Đang đấu nối, chuyển dữ liệu & thực hiện "${label}"…` };
    this.updatePillBadges();
    if (this.activeTab === tab) this.renderStudioTab(tab);

    // 1. Nếu chưa kiểm tra cầu nối thì kiểm tra nhanh
    if (!this.bridgeState.connected) {
      await this.checkStatus(true);
    }

    // 2. NHÁNH A: Đã kết nối & xác thực với Google NotebookLM Bridge -> Gửi qua Google NotebookLM thật & tải kết quả về App
    if (this.bridgeState.connected && this.bridgeState.authenticated) {
      try {
        const targetNb = $('nlmTargetNotebook')?.value || this.lastNotebookId || '';
        const res = await this.api('/api/notebooklm/execute-one', {
          notebook_id: targetNb,
          title: `Đọc hiểu THPT – ${App.analysis.title}`,
          sources: this.buildSourcePackage(),
          artifact_type: tab,
          focus_prompt: $('nlmFocusPrompt')?.value.trim() || '',
          sources_already_uploaded: !!(this.sourcesUploaded && targetNb && targetNb === this.lastNotebookId),
        });
        if (!res.ok) throw new Error(res.error || `Không khởi tạo được ${label}`);

        this.lastNotebookId = res.notebook_id;
        this.lastNotebookUrl = res.notebook_url;
        this.sourcesUploaded = true;

        if (res.status === 'completed' && res.result_data) {
          this.liveResults[tab] = { source: 'Google NotebookLM', ...res.result_data, file_url: res.file_url };
          this.itemState[tab] = { status: 'done', msg: `Đã nhận kết quả "${label}" trực tiếp từ Google NotebookLM!` };
          this.updatePillBadges();
          if (this.activeTab === tab) this.renderStudioTab(tab);
          toast(`✅ Đã hiển thị kết quả "${label}" từ Google NotebookLM lên App!`);
          return;
        }

        // Bắt đầu poll tự động để lấy kết quả từ Google NotebookLM ngay khi hoàn tất
        this.itemState[tab] = {
          status: 'running',
          msg: `Đã chuyển dữ liệu qua Google NotebookLM · Đang tạo "${label}" và sẽ tự động hiện lên App…`,
        };
        if (this.activeTab === tab) this.renderStudioTab(tab);
        this.startArtifactPoller(tab, res.notebook_id, res.artifact_id);
        return;
      } catch (e) {
        console.warn('NotebookLM Bridge execute error:', e);
        // Nếu lỗi phiên đăng nhập và có Gemini API Key thì chuyển sang thực hiện trực tiếp bằng Gemini AI
        if (!App.apiKey()) {
          this.itemState[tab] = { status: 'error', msg: `Chưa thực hiện được trên NotebookLM: ${e.message}` };
          this.updatePillBadges();
          if (this.activeTab === tab) this.renderStudioTab(tab);
          if (manualClick) toast(e.message, true);
          return;
        }
      }
    }

    // 3. NHÁNH B: Có Gemini API Key -> Thực hiện tự động bằng AI & hiện kết quả ngay trên App
    if (App.apiKey()) {
      await this.executeWithGeminiAI(tab);
      return;
    }

    // 4. NHÁNH C: Cầu nối cục bộ đang bật nhưng chưa đăng nhập Google NotebookLM
    if (this.bridgeState.connected && !this.bridgeState.authenticated) {
      this.itemState[tab] = {
        status: 'error',
        msg: 'Cần đăng nhập Google NotebookLM (hoặc nhập Gemini API Key) để tự động tạo mới. Đang hiển thị bản chuẩn hóa sẵn có.',
      };
      this.updatePillBadges();
      if (this.activeTab === tab) this.renderStudioTab(tab);
      if (manualClick) {
        toast('Đang mở cửa sổ đăng nhập Google NotebookLM – ngay khi bạn đăng nhập xong, ứng dụng sẽ tự động thực hiện!');
        this.loginAndWatch(() => this.executeSingle(tab, false));
      }
      return;
    }

    // 5. NHÁNH D: Chế độ Demo Offline (hiển thị ngay kết quả chuẩn hóa từ ngữ liệu)
    this.itemState[tab] = {
      status: 'done',
      msg: `Đã tổng hợp & hiển thị "${label}" trên App (Nhập Gemini API Key hoặc bật Chay_Game.bat để tạo trực tiếp từ NotebookLM).`,
    };
    this.updatePillBadges();
    if (this.activeTab === tab) this.renderStudioTab(tab);
  },

  startArtifactPoller(tab, notebookId, artifactId) {
    if (this.pollTimers[tab]) clearInterval(this.pollTimers[tab]);
    let attempts = 0;
    const poll = async () => {
      attempts++;
      if (attempts > 90) {
        clearInterval(this.pollTimers[tab]);
        return;
      }
      try {
        const qs = `notebook_id=${encodeURIComponent(notebookId)}&artifact_type=${encodeURIComponent(tab)}&artifact_id=${encodeURIComponent(artifactId || '')}`;
        const res = await this.api(`/api/notebooklm/fetch-artifact?${qs}`);
        if (res.status === 'completed' && res.result_data) {
          clearInterval(this.pollTimers[tab]);
          this.liveResults[tab] = { source: 'Google NotebookLM', ...res.result_data, file_url: res.file_url };
          this.itemState[tab] = {
            status: 'done',
            msg: `🎉 Đã tải & hiển thị kết quả "${this.featLabel(tab)}" trực tiếp từ Google NotebookLM!`,
          };
          this.updatePillBadges();
          if (this.activeTab === tab) this.renderStudioTab(tab);
          toast(`🎉 Kết quả "${this.featLabel(tab)}" từ Google NotebookLM đã hiện lên App!`);
        } else if (res.status === 'failed' || res.ok === false) {
          clearInterval(this.pollTimers[tab]);
          this.itemState[tab] = { status: 'error', msg: res.error || 'Google NotebookLM báo lỗi khi tạo mục này.' };
          this.updatePillBadges();
          if (this.activeTab === tab) this.renderStudioTab(tab);
        }
      } catch (_) {}
    };
    setTimeout(poll, 2500);
    this.pollTimers[tab] = setInterval(poll, 4500);
  },

  /* ── Thực hiện chuyên sâu bằng Gemini AI & hiện trực tiếp lên App ── */
  async executeWithGeminiAI(tab) {
    const label = this.featLabel(tab);
    this.itemState[tab] = { status: 'running', msg: `⚡ Đang chuyển dữ liệu qua AI Studio để thực hiện "${label}"…` };
    this.updatePillBadges();
    if (this.activeTab === tab) this.renderStudioTab(tab);

    const pkg = this.buildSourcePackage();
    const focus = $('nlmFocusPrompt')?.value.trim() || '';
    const contextText = `${pkg[0].text}\n\n${pkg[1].text}\n\nĐịnh hướng sư phạm: ${focus}`;

    const schemas = {
      audio: `Hãy tạo kịch bản "Tổng quan bằng âm thanh" (Podcast đối thoại chuyên sâu 6–8 lượt lời giữa 2 Host: Minh Anh và Hoàng Nam) phân tích sâu sắc ngữ liệu, thi pháp và giải đáp các câu học sinh làm sai.
CHỈ TRẢ VỀ JSON: {"lines": [{"host": "A", "name": "Minh Anh (Host 1)", "text": "..."}, {"host": "B", "name": "Hoàng Nam (Host 2)", "text": "..."}]}`,
      slide_deck: `Hãy thiết kế "Bản trình bày" bài giảng Ngữ văn THPT chuyên sâu gồm 6–7 Slide.
CHỈ TRẢ VỀ JSON: {"slides": [{"title": "Slide 1: ...", "body": "• Ý 1\\n• Ý 2\\n• Ý 3"}]}`,
      video: `Hãy thiết kế kịch bản "Tổng quan bằng video" (Explainer Video 5–6 phân cảnh) có thời lượng, hình ảnh minh họa trên màn hình và lời bình chi tiết.
CHỈ TRẢ VỀ JSON: {"scenes": [{"time": "0:00 - 0:35", "title": "Cảnh 1: ...", "visual": "Mô tả hình ảnh hiển thị", "narration": "Lời giảng chi tiết"}]}`,
      mind_map: `Hãy thiết kế "Bản đồ tư duy" phân nhánh đa tầng tổng hợp toàn bộ kiến thức trọng tâm của tác phẩm.
CHỈ TRẢ VỀ JSON: {"tree": {"name": "Tên tác phẩm", "children": [{"name": "Nhánh 1: ...", "children": [{"name": "Ý nhỏ 1"}, {"name": "Ý nhỏ 2"}]}]}}`,
      report: `Hãy biên soạn "Báo cáo & Kế hoạch bài dạy" (Study Guide & Giáo án Công văn 5512 chuẩn CT GDPT 2018) thật chi tiết.
CHỈ TRẢ VỀ JSON: {"title": "Tiêu đề báo cáo", "sections": [{"heading": "1. ...", "bullets": ["Ý chi tiết 1", "Ý chi tiết 2"]}]}`,
      flashcards: `Hãy tạo bộ 10 "Thẻ ghi nhớ" (Flashcards) ôn tập thuật ngữ, hình tượng, biện pháp nghệ thuật và thông điệp của văn bản.
CHỈ TRẢ VỀ JSON: {"cards": [{"f": "Mặt trước (Câu hỏi / Khái niệm)", "b": "Mặt sau (Giải nghĩa / Đáp án chi tiết)"}]}`,
      quiz: `Hãy tạo "Bài kiểm tra" đọc hiểu gồm 8 câu hỏi trắc nghiệm 4 lựa chọn (gắn mức độ Nhận biết, Thông hiểu, Vận dụng) kèm lời giải thích sâu sắc.
CHỈ TRẢ VỀ JSON: {"questions": [{"question": "Nội dung câu hỏi?", "level": "Thông hiểu", "options": ["A", "B", "C", "D"], "ans": 0, "explain": "Giải thích chi tiết"}]}`,
      infographic: `Hãy thiết kế "Bản đồ hoạ thông tin" (Infographic) gồm 5 khối thông tin trực quan cô đọng nhất về tác phẩm.
CHỈ TRẢ VỀ JSON: {"blocks": [{"title": "1. ...", "color": "#0d9488", "items": ["Điểm 1", "Điểm 2"]}]}`,
      data_table: `Hãy lập "Bảng dữ liệu" tổng hợp chi tiết các tín hiệu nghệ thuật, hình tượng, dẫn chứng và giá trị biểu đạt trong văn bản.
CHỈ TRẢ VỀ JSON: {"headers": ["STT", "Yếu tố / Hình tượng / Nghệ thuật", "Dẫn chứng tiêu biểu", "Giá trị nội dung & Tác dụng nghệ thuật", "Mức độ nhận thức"], "rows": [["1", "...", "...", "...", "Thông hiểu"]]}`,
    };

    try {
      const prompt = `Bạn là hệ thống NotebookLM Studio chuyên gia Ngữ văn THPT.\n${schemas[tab]}\nLƯU Ý: Dùng dấu nháy đơn ('...') khi trích dẫn bên trong chuỗi JSON.\n\nDỮ LIỆU NGUỒN:\n${contextText.slice(0, 22000)}`;
      const data = await AIService.callWithFallback(prompt, { temperature: 0.35, maxTokens: 16384 });
      this.liveResults[tab] = { source: 'AI Studio (Trực tiếp)', kind: `ai_${tab}`, data };
      this.itemState[tab] = { status: 'done', msg: `✅ Đã thực hiện "${label}" & hiển thị kết quả trực tiếp trên App!` };
      this.updatePillBadges();
      if (this.activeTab === tab) this.renderStudioTab(tab);
      toast(`✅ Đã thực hiện "${label}" và hiển thị kết quả lên App!`);
    } catch (e) {
      this.itemState[tab] = { status: 'error', msg: `Lỗi thực hiện AI: ${e.message}` };
      this.updatePillBadges();
      if (this.activeTab === tab) this.renderStudioTab(tab);
      toast(e.message, true);
    }
  },

  /* ── Chạy hàng loạt các mục đã tích chọn & tự động trả kết quả lên App ── */
  async pushToNotebookLM() {
    const selected = [...document.querySelectorAll('#nlmArtifactChecks input:checked')].map((i) => i.value);
    if (!selected.length) return toast('Hãy tích chọn ít nhất 1 mục để thực hiện.', true);

    if (!this.bridgeState.connected) {
      await this.checkStatus(true);
    }

    // Nếu cầu nối cục bộ đang bật nhưng chưa đăng nhập Google NotebookLM -> Tự động mở đăng nhập & chờ thực hiện
    if (this.bridgeState.connected && !this.bridgeState.authenticated && !App.apiKey()) {
      toast('Đang mở cửa sổ đăng nhập Google NotebookLM – ngay khi đăng nhập xong, ứng dụng sẽ tự động đẩy dữ liệu và hiện kết quả!');
      return this.loginAndWatch(() => this.pushToNotebookLM());
    }

    // Nếu không có cầu nối NotebookLM đã đăng nhập nhưng có Gemini API Key -> chạy trực tiếp các mục đã chọn trên App
    if (!this.bridgeState.authenticated && App.apiKey()) {
      const btn = $('btnPushNlm');
      btn.disabled = true;
      const oldText = btn.textContent;
      btn.textContent = `⏳ Đang thực hiện ${selected.length} mục đã chọn & hiển thị lên App…`;
      try {
        this.switchStudioTab(selected[0], false);
        for (const tab of selected) {
          await this.executeWithGeminiAI(tab);
        }
        toast(`🎉 Đã thực hiện xong ${selected.length} mục và hiển thị trực tiếp trên App!`);
      } finally {
        btn.disabled = false;
        btn.textContent = oldText;
      }
      return;
    }

    if (!this.bridgeState.connected) {
      toast('Chưa bật cầu nối cục bộ (Chay_Game.bat) hoặc nhập Gemini API Key – chuyển sang Copy trọn bộ dữ liệu & Mở Google NotebookLM Web!');
      return this.copyAndOpenWeb();
    }

    const btn = $('btnPushNlm');
    const box = $('nlmPushResult');
    btn.disabled = true;
    const oldText = btn.textContent;
    btn.textContent = '⏳ Đang đấu nối Google NotebookLM, chuyển dữ liệu & thực hiện…';
    box.hidden = false;
    box.innerHTML = '⏳ Đang tạo Notebook, chuyển dữ liệu ngữ liệu + sơ đồ tư duy và yêu cầu Google NotebookLM thực hiện các mục đã chọn…';

    selected.forEach((tab) => {
      this.itemState[tab] = { status: 'running', msg: `Đang chuyển dữ liệu & thực hiện "${this.featLabel(tab)}" trên Google NotebookLM…` };
    });
    this.updatePillBadges();
    this.renderStudioTab(this.activeTab);

    try {
      const targetNb = $('nlmTargetNotebook')?.value || this.lastNotebookId || '';
      const res = await this.api('/api/notebooklm/push', {
        notebook_id: targetNb,
        title: `Đọc hiểu THPT – ${App.analysis.title}`,
        sources: this.buildSourcePackage(),
        artifacts: selected,
        focus_prompt: $('nlmFocusPrompt').value.trim(),
        sources_already_uploaded: !!(this.sourcesUploaded && targetNb && targetNb === this.lastNotebookId),
      });
      if (!res.ok) throw new Error(res.error || 'Lỗi khi đẩy dữ liệu sang NotebookLM.');

      this.lastNotebookId = res.notebook_id;
      this.lastNotebookUrl = res.notebook_url;
      this.sourcesUploaded = true;

      // Xử lý ngay các mục hoàn tất tức thì (như mind_map) và bật poller tự động tải kết quả về App cho các mục còn lại
      arr(res.created_artifacts).forEach((art) => {
        const t = art.artifact_type;
        if (t === 'mind_map' && art.mind_map_json) {
          try {
            const tree = JSON.parse(art.mind_map_json);
            this.liveResults[t] = { source: 'Google NotebookLM', kind: 'mind_map', tree };
            this.itemState[t] = { status: 'done', msg: '🎉 Đã nhận Bản đồ tư duy trực tiếp từ Google NotebookLM!' };
          } catch (_) {}
        } else if (t) {
          this.startArtifactPoller(t, res.notebook_id, art.artifact_id);
        }
      });
      arr(res.errors).forEach((err) => {
        this.itemState[err.type] = { status: 'error', msg: err.error };
      });
      this.updatePillBadges();
      this.renderStudioTab(this.activeTab);

      const createdList = arr(res.created_artifacts).map((x) => `<li>✅ <strong>${esc(this.featLabel(x.artifact_type))}</strong>: Đang xử lý &amp; tự động tải kết quả về khung bên phải</li>`).join('');
      const errList = arr(res.errors).map((x) => `<li style="color:#fca5a5">⚠️ ${esc(this.featLabel(x.type))}: ${esc(x.error)}</li>`).join('');

      box.innerHTML = `
        <div>🎉 <strong>Đã đấu nối &amp; chuyển dữ liệu thành công lên Google NotebookLM!</strong></div>
        <div style="margin:6px 0">✨ <strong>Kết quả đang được tự động tải về và hiển thị trực tiếp ở khung bên phải ngay khi hoàn tất!</strong></div>
        <ul style="margin-left:18px;margin-top:6px">${createdList}${errList}</ul>
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
          <a class="btn small primary" href="${esc(res.notebook_url)}" target="_blank" rel="noopener" style="text-decoration:none">↗ Mở xem trên Google NotebookLM</a>
          <button type="button" class="btn small ghost" id="btnPollNlmStudio">🔄 Kiểm tra tiến độ Studio</button>
        </div>`;
      $('btnPollNlmStudio').onclick = () => this.pollStudio();
      toast('🎉 Đã chuyển dữ liệu qua Google NotebookLM! Kết quả sẽ tự động hiển thị lên App.');
    } catch (e) {
      box.innerHTML = `⚠️ <strong>Chưa đẩy tự động được:</strong> ${esc(e.message)}<br>
        💡 Bạn có thể bấm <strong>"🔑 Đăng nhập NotebookLM"</strong> để làm mới phiên, hoặc bấm <strong>"⚡ Thực hiện mục này"</strong> ở cột phải.`;
      toast(e.message, true);
    } finally {
      btn.disabled = false;
      btn.textContent = oldText;
    }
  },

  async pollStudio() {
    if (!this.lastNotebookId) return;
    try {
      const st = await this.api(`/api/notebooklm/studio-status?notebook_id=${encodeURIComponent(this.lastNotebookId)}`);
      if (!st.ok) throw new Error(st.error || 'Không kiểm tra được trạng thái.');
      toast(`📊 Tiến độ trên NotebookLM: Hoàn thành ${st.completed}/${st.total} học liệu (${st.in_progress} đang xử lý).`);
    } catch (e) {
      toast(e.message, true);
    }
  },

  async copyAndOpenWeb() {
    const pkg = this.buildSourcePackage();
    const combined = `${pkg[0].text}\n\n========================================\n\n${pkg[1].text}`;
    await copyToClipboard(combined, 'trọn bộ Hồ sơ Nguồn cho NotebookLM');
    window.open('https://notebooklm.google.com/', '_blank', 'noopener');
  },

  downloadSourceMd() {
    const pkg = this.buildSourcePackage();
    const combined = `${pkg[0].text}\n\n---\n\n${pkg[1].text}`;
    const blob = new Blob([combined], { type: 'text/markdown;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `nguon-notebooklm-${(App.analysis?.title || 'van-ban').slice(0, 30)}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast('✅ Đã tải file nguồn (.md) để nạp vào Google NotebookLM!');
  },

  renderTreeHtml(node) {
    if (!node || typeof node !== 'object') return '';
    const children = arr(node.children);
    return `<div class="nlm-tree-node">
      <div style="font-weight:800;color:#1e293b">🔹 ${esc(node.name || node.title || 'Nhánh kiến thức')}</div>
      ${children.length ? children.map((ch) => this.renderTreeHtml(ch)).join('') : ''}
    </div>`;
  },

  renderSimpleMarkdown(md) {
    return esc(md || '')
      .replace(/^###\s+(.+)$/gm, '<h5 style="font-size:15.5px;font-weight:900;color:#1e293b;margin:10px 0 4px">$1</h5>')
      .replace(/^##\s+(.+)$/gm, '<h4 style="font-size:17px;font-weight:900;color:#0f766e;margin:12px 0 6px">$1</h4>')
      .replace(/^#\s+(.+)$/gm, '<h4 style="font-size:18px;font-weight:900;color:#1e1b4b;margin:12px 0 8px">$1</h4>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  },

  /* ── Hiển thị 9 Tính năng Studio ngay trên App (Ưu tiên kết quả thực tế từ Google NotebookLM / AI Studio) ── */
  renderStudioTab(tab) {
    const a = App.analysis;
    const G = Game;
    const c = Result.counts(G.log);
    const out = $('studioOutput');
    if (!out) return;

    const st = this.itemState[tab];
    const live = this.liveResults[tab];
    let bannerHtml = '';
    if (st) {
      bannerHtml = `<div class="studio-live-banner ${st.status}">
        <span>${st.status === 'running' ? '🔄' : st.status === 'done' ? '✅' : '⚠️'} ${esc(st.msg)}</span>
        ${live?.file_url ? `<a class="btn small primary" href="${esc(this.fileUrl(live.file_url))}" target="_blank" download style="text-decoration:none">⬇ Tải file gốc</a>` : ''}
      </div>`;
    }

    // 1. Nếu đã có kết quả trả về từ Google NotebookLM hoặc AI Studio -> hiển thị trực tiếp kết quả đó!
    if (live) {
      if (live.kind === 'audio') {
        const url = this.fileUrl(live.file_url);
        out.innerHTML = `${bannerHtml}
          <div class="studio-head-row">
            <h4>🎙️ Tổng quan bằng âm thanh (Từ Google NotebookLM)</h4>
            <a class="btn small primary" href="${esc(url)}" download style="text-decoration:none">⬇ Tải file Audio (.m4a)</a>
          </div>
          <div class="slide-card" style="text-align:center;padding:22px">
            <div style="font-weight:800;margin-bottom:10px;color:#0f766e">🎧 Phát trực tiếp Podcast Audio Overview từ Google NotebookLM:</div>
            <audio controls autoplay src="${esc(url)}" style="width:100%;max-width:540px"></audio>
          </div>`;
        return;
      }
      if (live.kind === 'video') {
        const url = this.fileUrl(live.file_url);
        out.innerHTML = `${bannerHtml}
          <div class="studio-head-row">
            <h4>🎬 Tổng quan bằng video (Từ Google NotebookLM)</h4>
            <a class="btn small primary" href="${esc(url)}" download style="text-decoration:none">⬇ Tải Video (.mp4)</a>
          </div>
          <div style="background:#0f172a;border-radius:12px;padding:10px;text-align:center">
            <video controls src="${esc(url)}" style="width:100%;max-height:420px;border-radius:8px"></video>
          </div>`;
        return;
      }
      if (live.kind === 'slide_deck') {
        const url = this.fileUrl(live.file_url);
        out.innerHTML = `${bannerHtml}
          <div class="studio-head-row">
            <h4>📊 Bản trình bày Slide Deck (Từ Google NotebookLM)</h4>
            <a class="btn small primary" href="${esc(url)}" target="_blank" download style="text-decoration:none">⬇ Tải Slide (.pdf)</a>
          </div>
          <iframe src="${esc(url)}" style="width:100%;height:460px;border:2px solid #cbd5e1;border-radius:12px;background:#fff"></iframe>`;
        return;
      }
      if (live.kind === 'infographic') {
        const url = this.fileUrl(live.file_url);
        out.innerHTML = `${bannerHtml}
          <div class="studio-head-row">
            <h4>📊 Bản đồ hoạ thông tin (Từ Google NotebookLM)</h4>
            <a class="btn small primary" href="${esc(url)}" target="_blank" download style="text-decoration:none">⬇ Tải ảnh Infographic (.png)</a>
          </div>
          <div style="text-align:center">
            <img src="${esc(url)}" alt="Infographic NotebookLM" style="max-width:100%;border-radius:12px;border:2px solid #cbd5e1;cursor:zoom-in" onclick="Lightbox.open('${esc(url)}')">
          </div>`;
        return;
      }
      if (live.kind === 'mind_map' || live.kind === 'ai_mind_map') {
        const tree = live.tree || live.data?.tree || {};
        out.innerHTML = `${bannerHtml}
          <div class="studio-head-row">
            <h4>🧠 Bản đồ tư duy (${esc(live.source)}): ${esc(tree.name || a.title)}</h4>
            <button type="button" class="btn small ghost" onclick="document.getElementById('mindMapSection')?.scrollIntoView({behavior:'smooth'})">🔍 Xem Sơ đồ SVG lớn</button>
          </div>
          <div class="nlm-tree-box">${this.renderTreeHtml(tree)}</div>`;
        return;
      }
      if (live.kind === 'report') {
        out.innerHTML = `${bannerHtml}
          <div class="studio-head-row">
            <h4>📄 ${esc(live.title || 'Báo cáo & Hướng dẫn học tập')} (Google NotebookLM)</h4>
          </div>
          <div style="line-height:1.75">${this.renderSimpleMarkdown(live.markdown)}</div>`;
        return;
      }
      if (live.kind === 'ai_report') {
        const d = live.data || {};
        out.innerHTML = `${bannerHtml}
          <div class="studio-head-row">
            <h4>📄 ${esc(d.title || `Báo cáo & Kế hoạch bài dạy: ${a.title}`)} <span class="nlm-new-badge">Mới!</span></h4>
          </div>
          ${arr(d.sections).map((sec) => `
            <div class="slide-card" style="border-left-color:#c026d3">
              <strong>${esc(sec.heading)}</strong>
              <ul style="margin-left:18px;margin-top:6px">${arr(sec.bullets).map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
            </div>`).join('')}`;
        return;
      }
      if (live.kind === 'flashcards' || live.kind === 'ai_flashcards') {
        const rawCards = arr(live.app_data?.cards || live.data?.cards);
        const cards = rawCards.map((fc) => ({ q: fc.f || fc.front || fc.q || '', a: fc.b || fc.back || fc.a || '' })).filter((x) => x.q);
        if (cards.length) {
          out.innerHTML = `${bannerHtml}
            <div class="studio-head-row">
              <h4>🗂️ Thẻ ghi nhớ (${esc(live.source)} · ${cards.length} thẻ – bấm để lật)</h4>
            </div>
            <div class="fc-grid">${cards.map((fc, i) => `
              <div class="fc-card" onclick="this.querySelector('.fc-a').hidden = !this.querySelector('.fc-a').hidden">
                <div class="fc-q">📌 Thẻ #${i + 1}: ${esc(fc.q)}</div>
                <div class="fc-a">💡 ${esc(fc.a)}</div>
              </div>`).join('')}</div>`;
          return;
        }
      }
      if (live.kind === 'quiz' || live.kind === 'ai_quiz') {
        const rawQs = arr(live.app_data?.questions || live.data?.questions);
        const qList = rawQs.map((q) => {
          if (Array.isArray(q.answerOptions)) {
            const ansIdx = Math.max(0, q.answerOptions.findIndex((o) => o.isCorrect));
            const rationale = q.answerOptions[ansIdx]?.rationale || q.hint || '';
            return {
              q: q.question || '',
              options: q.answerOptions.map((o) => o.text || ''),
              ans: ansIdx,
              explain: rationale,
              level: 'Thông hiểu',
            };
          }
          return { q: q.question || q.q || '', options: arr(q.options), ans: Number(q.ans) || 0, explain: q.explain || '', level: q.level || 'Thông hiểu' };
        }).filter((x) => x.q && x.options.length);
        if (qList.length) {
          out.innerHTML = `${bannerHtml}
            <div class="studio-head-row">
              <h4>❓ Bài kiểm tra (${esc(live.source)} · ${qList.length} câu – bấm chọn đáp án để chấm ngay)</h4>
            </div>
            ${qList.map((item, qIdx) => `
              <div class="studio-quiz-item" data-qidx="${qIdx}">
                <div style="font-weight:800;font-size:14.5px;color:#0f172a">${qIdx + 1}. ${esc(item.q)} ${lvlBadge(item.level)}</div>
                <div class="studio-quiz-opts">
                  ${item.options.map((opt, oIdx) => `
                    <button type="button" class="studio-quiz-opt" data-oidx="${oIdx}"><strong>${'ABCD'[oIdx] || oIdx + 1}.</strong> ${esc(opt)}</button>
                  `).join('')}
                </div>
                <div class="studio-quiz-exp" hidden style="margin-top:8px;padding:7px 10px;border-radius:8px;background:#f0fdf4;border:1px solid #86efac;font-size:13px;color:#14532d">
                  💡 <strong>Giải thích:</strong> ${esc(item.explain || 'Đáp án chuẩn theo ngữ liệu.')}
                </div>
              </div>`).join('')}`;
          this.bindQuizOptions(out, qList);
          return;
        }
      }
      if (live.kind === 'data_table' || live.kind === 'ai_data_table') {
        const rows = live.rows || (live.data?.headers ? [live.data.headers, ...arr(live.data.rows)] : []);
        if (rows.length >= 2) {
          const headers = rows[0];
          const bodyRows = rows.slice(1);
          out.innerHTML = `${bannerHtml}
            <div class="studio-head-row">
              <h4>📋 Bảng dữ liệu (${esc(live.source)})</h4>
              <button type="button" class="btn small primary" id="btnExportDataTableCsv">📥 Tải Bảng dữ liệu (.csv)</button>
            </div>
            <table class="studio-dt-table">
              <thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
              <tbody>${bodyRows.map((r) => `<tr>${r.map((cell) => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
            </table>`;
          $('btnExportDataTableCsv').onclick = () => this.exportCustomRowsCsv(rows);
          return;
        }
      }
      if (live.kind === 'ai_slide_deck') {
        const slides = arr(live.data?.slides);
        if (slides.length) {
          out.innerHTML = `${bannerHtml}
            <div class="studio-head-row"><h4>📊 Bản trình bày bài giảng (${esc(live.source)} · ${slides.length} Slide)</h4></div>
            ${slides.map((s) => `<div class="slide-card"><strong>${esc(s.title)}</strong><div style="white-space:pre-line;margin-top:4px;font-size:14px">${esc(s.body)}</div></div>`).join('')}`;
          return;
        }
      }
      if (live.kind === 'ai_video') {
        const scenes = arr(live.data?.scenes);
        if (scenes.length) {
          out.innerHTML = `${bannerHtml}
            <div class="studio-head-row"><h4>🎬 Tổng quan bằng video (${esc(live.source)} · ${scenes.length} phân cảnh)</h4></div>
            ${scenes.map((sc) => `<div class="slide-card" style="border-left-color:#16a34a">
              <strong>[${esc(sc.time || '')}] ${esc(sc.title)}</strong>
              <div style="font-size:13.5px;color:#0f766e;margin-top:4px">🎥 <strong>Hình ảnh:</strong> ${esc(sc.visual)}</div>
              <div style="margin-top:4px">🎙️ <strong>Lời bình:</strong> ${esc(sc.narration)}</div>
            </div>`).join('')}`;
          return;
        }
      }
      if (live.kind === 'ai_audio') {
        const lines = arr(live.data?.lines);
        if (lines.length) {
          this.renderPodcastLines(out, bannerHtml, lines, live.source);
          return;
        }
      }
      if (live.kind === 'ai_infographic') {
        const blocks = arr(live.data?.blocks);
        if (blocks.length) {
          out.innerHTML = `${bannerHtml}
            <div class="studio-head-row">
              <h4>📊 Bản đồ hoạ thông tin (${esc(live.source)})</h4>
              <button type="button" class="btn small primary" onclick="document.getElementById('infographic')?.scrollIntoView({behavior:'smooth'})">🖼️ Xem Infographic lớn</button>
            </div>
            ${blocks.map((b) => `<div class="slide-card" style="border-left-color:${esc(b.color || '#0d9488')}">
              <strong>${esc(b.title)}</strong>
              <ul style="margin-left:18px;margin-top:4px">${arr(b.items).map((it) => `<li>${esc(it)}</li>`).join('')}</ul>
            </div>`).join('')}`;
          return;
        }
      }
    }

    // 2. Bản hiển thị mặc định tức thì (hoặc trong lúc đang chờ Google NotebookLM xử lý)
    if (tab === 'report') {
      out.innerHTML = `${bannerHtml}
        <div class="studio-head-row">
          <h4>📄 Báo cáo &amp; Hướng dẫn học tập: ${esc(a.title)} (${esc(a.gradeLevel || App.settings.grade)}) <span class="nlm-new-badge">Mới!</span></h4>
        </div>
        <p><strong>1. Mục tiêu bài học (Theo YCCĐ CT GDPT 2018):</strong></p>
        <ul style="margin-left:18px;margin-bottom:10px">
          <li><strong>Nhận biết:</strong> Xác định được thể loại (${esc(a.genre || 'văn bản đọc hiểu')}), tác giả (${esc(a.author || '—')}), chủ thể biểu đạt và các chi tiết/hình ảnh tiêu biểu.</li>
          <li><strong>Thông hiểu:</strong> Phân tích được chủ đề (<em>${esc(a.theme)}</em>), mạch kết cấu và tác dụng của các biện pháp nghệ thuật đặc sắc.</li>
          <li><strong>Vận dụng:</strong> Liên hệ thông điệp tư tưởng (<em>${esc(a.message)}</em>) vào thực tiễn đời sống và tư duy phản biện của học sinh THPT.</li>
        </ul>
        <p><strong>2. Tiến trình tổ chức hoạt động dạy học (Công văn 5512):</strong></p>
        <ol style="margin-left:18px;margin-bottom:10px">
          <li><strong>Hoạt động 1 – Mở đầu (5 phút):</strong> Khởi động bằng câu hỏi gợi mở gắn với hình tượng trung tâm của văn bản <em>${esc(a.title)}</em>.</li>
          <li><strong>Hoạt động 2 – Hình thành kiến thức mới (20 phút):</strong>
            <br>• Tìm hiểu bố cục / mạch ý: ${a.mainIdeas.map(esc).join(' → ') || 'Theo trình tự văn bản'}.
            <br>• Phân tích hình tượng &amp; thi pháp: ${a.artTechniques.map((t) => `${esc(t.name)} (<em>“${esc(t.example)}”</em>)`).join('; ') || 'Ngôn ngữ và giọng điệu'}.
          </li>
          <li><strong>Hoạt động 3 – Luyện tập qua 6 vòng Game Đọc Hiểu (12 phút):</strong> Kết quả thực tế của lớp đạt <strong>${c.ok}/${c.total} câu (${c.pct}%)</strong>.</li>
          <li><strong>Hoạt động 4 – Vận dụng &amp; Khắc phục lỗi sai (8 phút):</strong> ${G.review.length ? `Giáo viên chốt lại các câu lớp còn nhầm: <em>${G.review.slice(0, 3).map(esc).join('; ')}</em>.` : 'Lớp nắm rất vững bài, mở rộng thảo luận câu hỏi tự luận nâng cao.'}</li>
        </ol>`;
    } else if (tab === 'mind_map') {
      out.innerHTML = `${bannerHtml}
        <div class="studio-head-row">
          <h4>🧠 Bản đồ tư duy phân nhánh: ${esc(a.title)}</h4>
          <button type="button" class="btn small ghost" onclick="document.getElementById('mindMapSection')?.scrollIntoView({behavior:'smooth'})">🔍 Xem Sơ đồ SVG lớn</button>
        </div>
        <ul style="margin-left:16px">
          <li><strong>🎯 Nhánh 1 – Chủ đề &amp; Cảm hứng:</strong> ${esc(a.theme)}</li>
          <li><strong>🗂 Nhánh 2 – Bố cục / Mạch triển khai:</strong>
            <ul style="margin-left:18px">${(a.mainIdeas.length ? a.mainIdeas : a.timeline).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
          </li>
          <li><strong>👥 Nhánh 3 – Hình tượng / Chủ thể trữ tình:</strong>
            <ul style="margin-left:18px">${a.characters.map((ch) => `<li><strong>${esc(ch.name)}:</strong> ${esc(ch.traits)}</li>`).join('')}</ul>
          </li>
          <li><strong>🎨 Nhánh 4 – Đặc sắc nghệ thuật &amp; Thi pháp:</strong>
            <ul style="margin-left:18px">${a.artTechniques.map((t) => `<li><strong>${esc(t.name)}:</strong> “${esc(t.example)}” ➜ ${esc(t.effect)}</li>`).join('')}</ul>
          </li>
          <li><strong>💡 Nhánh 5 – Thông điệp tư tưởng:</strong> ${esc(a.message)}</li>
        </ul>`;
    } else if (tab === 'slide_deck') {
      const slides = [
        { title: `Slide 1: Giới thiệu tác phẩm – ${a.title}`, body: `• Tác giả / Nguồn: ${a.author || '—'}\n• Thể loại: ${a.genre || '—'} · Khối: ${a.gradeLevel || App.settings.grade}\n• Tóm tắt: ${a.summary}` },
        { title: 'Slide 2: Bố cục & Mạch vận động của văn bản', body: (a.mainIdeas.length ? a.mainIdeas : a.timeline).map((x, i) => `${i + 1}. ${x}`).join('\n') },
        { title: 'Slide 3: Phân tích Hình tượng & Chủ thể biểu đạt', body: a.characters.map((c) => `• ${c.name}: ${c.traits}`).join('\n') || a.theme },
        { title: 'Slide 4: Đặc sắc Nghệ thuật & Thi pháp', body: a.artTechniques.map((t) => `• ${t.name} (“${t.example}”)\n  ➜ Tác dụng: ${t.effect}`).join('\n') },
        { title: 'Slide 5: Thông điệp Tư tưởng & Tổng kết Đọc hiểu', body: `• Chủ đề: ${a.theme}\n• Thông điệp: ${a.message}\n• Kết quả đọc hiểu của lớp: ${c.ok}/${c.total} câu đúng (${c.pct}%)` },
      ];
      out.innerHTML = `${bannerHtml}<div class="studio-head-row"><h4>📊 Bản trình bày bài giảng (${slides.length} Slide)</h4></div>` + slides.map((s) => `
        <div class="slide-card">
          <strong>${esc(s.title)}</strong>
          <div style="white-space:pre-line;margin-top:4px;font-size:14px">${esc(s.body)}</div>
        </div>`).join('');
    } else if (tab === 'flashcards') {
      const cards = [
        ...a.vocabulary.map((v) => ({ q: `Thuật ngữ / Từ ngữ: ${v.word}`, a: v.meaning })),
        ...a.artTechniques.map((t) => ({ q: `Nghệ thuật: ${t.name} (“${t.example}”)`, a: `Tác dụng: ${t.effect}` })),
        { q: `Chủ đề chính của “${a.title}” là gì?`, a: a.theme },
        { q: `Thông điệp tư tưởng rút ra từ “${a.title}”?`, a: a.message },
      ];
      out.innerHTML = `${bannerHtml}<div class="studio-head-row"><h4>🗂️ Thẻ ghi nhớ ôn tập (${cards.length} thẻ – bấm vào thẻ để xem/lật)</h4></div>
        <div class="fc-grid">${cards.map((fc, i) => `
          <div class="fc-card" onclick="this.querySelector('.fc-a').hidden = !this.querySelector('.fc-a').hidden">
            <div class="fc-q">📌 Thẻ #${i + 1}: ${esc(fc.q)}</div>
            <div class="fc-a">💡 ${esc(fc.a)}</div>
          </div>`).join('')}</div>`;
    } else if (tab === 'video') {
      out.innerHTML = `${bannerHtml}
        <div class="studio-head-row"><h4>🎬 Tổng quan bằng video (Explainer Video – 5 phân cảnh)</h4></div>
        <div class="slide-card"><strong>Cảnh 1 (0:00 – 0:30) · Hook mở đầu:</strong> Giới thiệu nhan đề <em>“${esc(a.title)}”</em> (${esc(a.author)}) cùng câu hỏi kích thích tư duy.</div>
        <div class="slide-card"><strong>Cảnh 2 (0:30 – 1:30) · Bức tranh tổng thể &amp; Mạch văn bản:</strong> Trình chiếu sơ đồ diễn biến: ${a.timeline.slice(0, 4).map(esc).join(' → ')}.</div>
        <div class="slide-card"><strong>Cảnh 3 (1:30 – 2:45) · Giải mã Thi pháp &amp; Nghệ thuật:</strong> Phân tích trực quan các biện pháp: ${a.artTechniques.map((t) => esc(t.name)).join(', ')}.</div>
        <div class="slide-card"><strong>Cảnh 4 (2:45 – 3:30) · Giải đáp lỗi sai thường gặp:</strong> Lưu ý các câu hỏi vận dụng và phân biệt phương án nhiễu.</div>
        <div class="slide-card"><strong>Cảnh 5 (3:30 – 4:00) · Thông điệp kết thúc:</strong> Khắc sâu bài học nhân sinh: <em>“${esc(a.message)}”</em>.</div>`;
    } else if (tab === 'audio') {
      const lines = [
        { host: 'A', name: 'Minh Anh (Host 1)', text: `Chào các bạn học sinh THPT! Hôm nay chúng ta cùng khám phá tác phẩm “${a.title}” của ${a.author || 'tác giả'} – một ngữ liệu đặc sắc trong chương trình ${a.gradeLevel || App.settings.grade}.` },
        { host: 'B', name: 'Hoàng Nam (Host 2)', text: `Đúng vậy! Điểm cuốn hút nhất ở văn bản này chính là chủ đề: ${a.theme}. Khi đọc kĩ từng dòng, chúng ta thấy mạch ý vận động rất chặt chẽ.` },
        { host: 'A', name: 'Minh Anh (Host 1)', text: `Đặc biệt, về mặt nghệ thuật và thi pháp, không thể bỏ qua ${a.artTechniques[0] ? `biện pháp ${a.artTechniques[0].name} qua chi tiết “${a.artTechniques[0].example}”, giúp ${a.artTechniques[0].effect}` : 'cách tổ chức ngôn từ giàu sức gợi'}.` },
        { host: 'B', name: 'Hoàng Nam (Host 2)', text: `${G.review.length ? `Vừa rồi khi cả lớp thử sức với 6 vòng đọc hiểu, có một điểm cần lưu ý lại là: ${G.review[0]}.` : 'Cả lớp vừa hoàn thành xuất sắc các vòng câu hỏi đọc hiểu!'} Và thông điệp đọng lại sâu sắc nhất chính là: ${a.message}` },
      ];
      this.renderPodcastLines(out, bannerHtml, lines, 'Bản chuẩn hóa');
    } else if (tab === 'quiz') {
      const Q = a.questions || {};
      const qList = [
        ...arr(Q.mcq).map((m) => ({ q: m.q, options: m.options, ans: m.ans, explain: m.explain, level: m.level })),
        ...arr(Q.trueFalse).slice(0, 3).map((t) => ({ q: `[Đúng/Sai] ${t.statement}`, options: ['Đúng', 'Sai'], ans: t.answer ? 0 : 1, explain: t.explain, level: t.level })),
      ];
      out.innerHTML = `${bannerHtml}
        <div class="studio-head-row"><h4>❓ Bài kiểm tra nhanh tại chỗ (${qList.length} câu – bấm chọn đáp án để kiểm tra ngay)</h4></div>
        ${qList.map((item, qIdx) => `
          <div class="studio-quiz-item" data-qidx="${qIdx}">
            <div style="font-weight:800;font-size:14.5px;color:#0f172a">${qIdx + 1}. ${esc(item.q)} ${lvlBadge(item.level)}</div>
            <div class="studio-quiz-opts">
              ${item.options.map((opt, oIdx) => `
                <button type="button" class="studio-quiz-opt" data-oidx="${oIdx}">${item.options.length === 4 ? `<strong>${'ABCD'[oIdx]}.</strong> ` : ''}${esc(opt)}</button>
              `).join('')}
            </div>
            <div class="studio-quiz-exp" hidden style="margin-top:8px;padding:7px 10px;border-radius:8px;background:#f0fdf4;border:1px solid #86efac;font-size:13px;color:#14532d">
              💡 <strong>Giải thích:</strong> ${esc(item.explain || 'Đáp án chuẩn theo ngữ liệu.')}
            </div>
          </div>`).join('')}`;
      this.bindQuizOptions(out, qList);
    } else if (tab === 'infographic') {
      out.innerHTML = `${bannerHtml}
        <div class="studio-head-row">
          <h4>📊 Bản đồ hoạ thông tin (Infographic Tóm tắt)</h4>
          <button type="button" class="btn small primary" onclick="document.getElementById('infographic')?.scrollIntoView({behavior:'smooth'})">🖼️ Xem Infographic lớn</button>
        </div>
        <div class="slide-card" style="border-left-color:#0d9488">
          <strong>1. Hồ sơ nhận diện tác phẩm</strong>
          <div>• <strong>Tác phẩm:</strong> ${esc(a.title)} · <strong>Tác giả:</strong> ${esc(a.author || '—')}</div>
          <div>• <strong>Thể loại:</strong> ${esc(a.genre || '—')} · <strong>Khối lớp:</strong> ${esc(a.gradeLevel || App.settings.grade)}</div>
        </div>
        <div class="slide-card" style="border-left-color:#2563eb">
          <strong>2. Trục nội dung &amp; Mạch kết cấu (${(a.mainIdeas.length ? a.mainIdeas : a.timeline).length} chặng)</strong>
          <div>${(a.mainIdeas.length ? a.mainIdeas : a.timeline).map((x, i) => `<div><strong>[${i + 1}]</strong> ${esc(x)}</div>`).join('')}</div>
        </div>
        <div class="slide-card" style="border-left-color:#db2777">
          <strong>3. Trục Thi pháp &amp; Nghệ thuật (${a.artTechniques.length} điểm nhấn)</strong>
          <div>${a.artTechniques.map((t) => `<div>• <strong>${esc(t.name)}</strong>: <em>“${esc(t.example)}”</em> ➜ ${esc(t.effect)}</div>`).join('')}</div>
        </div>
        <div class="slide-card" style="border-left-color:#d97706">
          <strong>4. Thông điệp cốt lõi &amp; Chỉ số Đọc hiểu</strong>
          <div>• <strong>Thông điệp:</strong> ${esc(a.message)}</div>
          <div>• <strong>Kết quả lớp học:</strong> Đúng ${c.ok}/${c.total} câu (${c.pct}%)</div>
        </div>`;
    } else if (tab === 'data_table') {
      out.innerHTML = `${bannerHtml}
        <div class="studio-head-row">
          <h4>📋 Bảng dữ liệu tổng hợp học thuật</h4>
          <button type="button" class="btn small primary" id="btnExportDataTableCsv">📥 Tải Bảng dữ liệu (.csv)</button>
        </div>
        <p style="font-weight:800;margin-bottom:4px">Bảng 1: Hệ thống Tín hiệu Nghệ thuật – Dẫn chứng – Tác dụng biểu đạt</p>
        <table class="studio-dt-table">
          <thead><tr><th>#</th><th>Biện pháp / Yếu tố nghệ thuật</th><th>Dẫn chứng tiêu biểu trong văn bản</th><th>Tác dụng / Giá trị biểu đạt</th></tr></thead>
          <tbody>
            ${a.artTechniques.map((t, i) => `<tr><td>${i + 1}</td><td><strong>${esc(t.name)}</strong></td><td><em>“${esc(t.example)}”</em></td><td>${esc(t.effect)}</td></tr>`).join('')}
          </tbody>
        </table>
        <p style="font-weight:800;margin-bottom:4px">Bảng 2: Hệ thống Hình tượng / Chủ thể &amp; Từ ngữ học thuật</p>
        <table class="studio-dt-table">
          <thead><tr><th>Phân loại</th><th>Tên hình tượng / Thuật ngữ</th><th>Đặc điểm / Giải nghĩa học thuật</th></tr></thead>
          <tbody>
            ${a.characters.map((ch) => `<tr><td><span class="badge lvl-th">Hình tượng</span></td><td><strong>${esc(ch.name)}</strong></td><td>${esc(ch.traits)}</td></tr>`).join('')}
            ${a.vocabulary.map((v) => `<tr><td><span class="badge lvl-nb">Từ khóa</span></td><td><strong>${esc(v.word)}</strong></td><td>${esc(v.meaning)}</td></tr>`).join('')}
          </tbody>
        </table>`;
      $('btnExportDataTableCsv').onclick = () => this.exportDataTableCsv();
    }
  },

  renderPodcastLines(out, bannerHtml, lines, sourceLabel) {
    out.innerHTML = `${bannerHtml}
      <div class="studio-head-row">
        <h4>🎙️ Tổng quan bằng âm thanh (${esc(sourceLabel)} · ${lines.length} lượt thoại)</h4>
        <button type="button" class="btn small primary" id="btnSpeakPodcast">🔊 Nghe đọc Podcast</button>
      </div>
      ${lines.map((l, idx) => `<div class="podcast-line host${l.host === 'B' || idx % 2 === 1 ? 'B' : 'A'}"><strong>🎙️ ${esc(l.name || (idx % 2 === 0 ? 'Host 1' : 'Host 2'))}:</strong> ${esc(l.text)}</div>`).join('')}`;
    $('btnSpeakPodcast').onclick = () => {
      if (!('speechSynthesis' in window)) return toast('Trình duyệt không hỗ trợ đọc giọng nói.', true);
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        $('btnSpeakPodcast').textContent = '🔊 Nghe đọc Podcast';
        return;
      }
      const u = new SpeechSynthesisUtterance(lines.map((l) => `${l.name || ''} nói: ${l.text}`).join(' ... '));
      u.lang = 'vi-VN';
      u.onend = () => { if ($('btnSpeakPodcast')) $('btnSpeakPodcast').textContent = '🔊 Nghe đọc Podcast'; };
      $('btnSpeakPodcast').textContent = '⏹ Dừng đọc';
      window.speechSynthesis.speak(u);
    };
  },

  bindQuizOptions(out, qList) {
    out.querySelectorAll('.studio-quiz-item').forEach((box) => {
      const qIdx = +box.dataset.qidx;
      const item = qList[qIdx];
      box.querySelectorAll('.studio-quiz-opt').forEach((btn) => {
        btn.onclick = () => {
          const chosen = +btn.dataset.oidx;
          box.querySelectorAll('.studio-quiz-opt').forEach((b, idx) => {
            b.classList.remove('right', 'wrong');
            if (idx === item.ans) b.classList.add('right');
            else if (idx === chosen) b.classList.add('wrong');
          });
          box.querySelector('.studio-quiz-exp').hidden = false;
          Sound.play(chosen === item.ans ? 'correct' : 'wrong');
        };
      });
    });
  },

  exportCustomRowsCsv(rows) {
    const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = '\uFEFF' + rows.map((r) => r.map(cell).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bang-du-lieu-notebooklm-${(App.analysis?.title || 'van-ban').slice(0, 30)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast('✅ Đã tải file Bảng dữ liệu (.csv)!');
  },

  exportDataTableCsv() {
    const a = App.analysis;
    const rows = [
      ['BẢNG DỮ LIỆU ĐỌC HIỂU NGỮ VĂN THPT', a.title, a.author, a.genre, a.gradeLevel || App.settings.grade],
      [],
      ['BẢNG 1: ĐẶC SẮC NGHỆ THUẬT & THI PHÁP'],
      ['STT', 'Biện pháp / Yếu tố nghệ thuật', 'Dẫn chứng', 'Tác dụng biểu đạt'],
      ...a.artTechniques.map((t, i) => [i + 1, t.name, t.example, t.effect]),
      [],
      ['BẢNG 2: HÌNH TƯỢNG & TỪ KHÓA HỌC THUẬT'],
      ['Phân loại', 'Tên hình tượng / Thuật ngữ', 'Đặc điểm / Giải nghĩa'],
      ...a.characters.map((ch) => ['Hình tượng / Nhân vật', ch.name, ch.traits]),
      ...a.vocabulary.map((v) => ['Từ khóa / Khái niệm', v.word, v.meaning]),
    ];
    this.exportCustomRowsCsv(rows);
  },
};

/* ───────── ĐIỀU KHIỂN NGĂN VĂN BẢN & SỰ KIỆN CHUNG ───────── */
const Drawer = {
  syncContent() {
    $('drawerText').textContent = App.sourceText || '';
    const imgBox = $('drawerImages');
    if (App.media && App.media.length && !App.isDemo) {
      imgBox.hidden = false;
      imgBox.innerHTML = App.media.map((m, i) => `<img src="${m.dataUrl}" alt="${esc(m.name)}" data-idx="${i}" title="Bấm để phóng to: ${esc(m.name)}">`).join('');
      imgBox.querySelectorAll('img').forEach((img) => {
        img.onclick = () => Lightbox.open(App.media[+img.dataset.idx]?.dataUrl);
      });
    } else {
      imgBox.hidden = true;
      imgBox.innerHTML = '';
    }
  },
  open() { $('textDrawer').classList.add('open'); $('drawerBackdrop').classList.add('open'); },
  close() { $('textDrawer').classList.remove('open'); $('drawerBackdrop').classList.remove('open'); },
  toggle() { $('textDrawer').classList.contains('open') ? this.close() : this.open(); },
};

function bindGlobal() {
  $('btnShowText').onclick = () => Drawer.toggle();
  $('btnCloseDrawer').onclick = () => Drawer.close();
  $('drawerBackdrop').onclick = () => Drawer.close();
  $('btnCopyDrawer').onclick = () => copyToClipboard(App.sourceText, 'ngữ liệu đọc hiểu');
  $('btnEditOverview').onclick = () => Preview.toggleOverviewEdit();
  $('btnCopySummary').onclick = () => copyToClipboard(`${App.analysis?.title || ''}\n\nTóm tắt: ${App.analysis?.summary || ''}\nChủ đề: ${App.analysis?.theme || ''}`, 'tóm tắt ngữ liệu');
  $('btnCloseModal').onclick = () => Lightbox.close();
  $('imgModal').onclick = (e) => { if (e.target === $('imgModal')) Lightbox.close(); };

  $('btnSound').onclick = () => Sound.toggle();
  $('btnFullscreen').onclick = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {}));
  $('btnHome').onclick = () => {
    if ($('screenGame').classList.contains('active') && !confirm('Thoát trò chơi và quay về màn hình nạp bài?')) return;
    Sound.stopAll();
    $('btnRestore').hidden = !localStorage.getItem('dh_last_session');
    showScreen('screenSetup');
  };
  $('btnBackSetup').onclick = () => showScreen('screenSetup');
  $('btnPreviewToMindMap').onclick = () => {
    if (!Game.rounds || !Game.rounds.length) {
      Game.stats = {};
      Game.levels = { NB: { c: 0, t: 0 }, TH: { c: 0, t: 0 }, VD: { c: 0, t: 0 } };
      Game.log = [];
      Game.review = [];
    }
    Result.render();
    setTimeout(() => $('mindMapSection')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };
  $('btnStart').onclick = () => Game.start();
  $('btnPrint').onclick = () => window.print();
  $('btnMindMapJump').onclick = () => $('mindMapSection')?.scrollIntoView({ behavior: 'smooth' });
  $('btnNlmJump').onclick = () => $('nlmSection')?.scrollIntoView({ behavior: 'smooth' });
  $('btnStatsJump').onclick = () => $('statsSection')?.scrollIntoView({ behavior: 'smooth' });
  $('btnExportCsv').onclick = () => Result.exportCsv();
  $('btnReplay').onclick = () => Game.start();
  $('btnNewText').onclick = () => { Sound.stopAll(); showScreen('screenSetup'); };

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!$('imgModal').hidden) return Lightbox.close();
      return Drawer.close();
    }
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
