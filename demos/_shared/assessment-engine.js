/**
 * AssessmentEngine — reusable interactive assessment framework.
 *
 * Handles hit-zone detection, issue picking, annotation markers,
 * progressive hints, review-mode diffing, and challenge navigation.
 * Content-agnostic: the host page supplies a rubric, challenge bank,
 * and callbacks for rendering + layout.
 *
 * Usage:
 *   const engine = new AssessmentEngine({
 *     canvas, rubric, challenges,
 *     renderContent(ctx, w, h, challenge),
 *     computeZones(w, h, challenge) => [{id, rect:{x,y,w,h}, rubricIds}],
 *     containerEl, leftPanelEl, rightPanelEl, centerControlsEl
 *   });
 *   engine.start();
 */

/* eslint-disable no-unused-vars */
class AssessmentEngine {
  constructor(cfg) {
    this.canvas = cfg.canvas;
    this.ctx = this.canvas.getContext('2d');
    this.rubric = cfg.rubric;                 // [{id, category, shortName, description}]
    this.challenges = cfg.challenges;         // [{title, difficulty, answerKey:[{rubricId, zoneId, explanation}], hints:[str], ...extra}]
    this.renderContent = cfg.renderContent;   // fn(ctx, W, H, challenge)
    this.computeZones = cfg.computeZones;     // fn(W, H, challenge) => zones[]
    this.onChallengeLoad = cfg.onChallengeLoad || (() => {});

    // DOM containers the engine populates
    this.leftPanel = cfg.leftPanelEl;
    this.rightPanel = cfg.rightPanelEl;
    this.centerControls = cfg.centerControlsEl;

    // State
    this.currentIndex = 0;
    this.findings = [];        // [{id, rubricId, zoneId, x, y}]
    this.hintsRevealed = 0;
    this.reviewMode = false;
    this.zones = [];
    this.hoveredZone = null;
    this._findingId = 0;
    this._pickerOpen = false;
    this._completed = new Set(); // indices the student has checked
    this._tutorialStep = 0;
    this._tutorialVisited = new Set();
    this.onTutorialStep = cfg.onTutorialStep || null;

    // Category colours used for annotations
    this._catColors = {
      Axes: '#f0a050',
      Presentation: '#a080f0',
      Data: '#50c8f0',
      Text: '#60d080'
    };

    this._bind();
  }

  /* ── public API ─────────────────────────────────────── */

  start() {
    this._resizeCanvas();
    window.addEventListener('resize', () => this._resizeCanvas());
    this.loadChallenge(0);
  }

  loadChallenge(idx) {
    this.currentIndex = idx;
    this.findings = [];
    this.hintsRevealed = 0;
    this.reviewMode = false;
    this._tutorialStep = 0;
    this._tutorialVisited = new Set();
    this._closePicker();

    const ch = this.challenges[idx];
    this._resizeCanvas();
    this.zones = this.computeZones(this.canvas.clientWidth, this.canvas.clientHeight, ch);
    this.renderContent(this.ctx, this.canvas.clientWidth, this.canvas.clientHeight, ch);
    this.onChallengeLoad(ch, idx);

    if (ch.type === 'tutorial') {
      this._renderTutorial();
      return;
    }

    this._renderLeft();
    this._renderRight();
    this._renderCenterControls();
    this._drawOverlay();
  }

  addFinding(rubricId, zoneId, x, y) {
    const id = ++this._findingId;
    this.findings.push({ id, rubricId, zoneId, x, y });
    this._renderRight();
    this._drawOverlay();
  }

  removeFinding(id) {
    this.findings = this.findings.filter(f => f.id !== id);
    this._renderRight();
    this._drawOverlay();
  }

  revealHint() {
    const ch = this.challenges[this.currentIndex];
    if (this.hintsRevealed < ch.hints.length) {
      this.hintsRevealed++;
      this._renderLeft();
    }
  }

  checkAnswers() {
    this.reviewMode = true;
    this._completed.add(this.currentIndex);
    this._closePicker();
    this._renderLeft();
    this._renderRight();
    this._renderCenterControls();
    this._drawOverlay();
  }

  getSummary() {
    return this.challenges.map((ch, i) => {
      if (!this._completed.has(i)) return { title: ch.title, status: 'skipped' };
      // Reconstruct: we don't store per-challenge findings after nav,
      // so summary just shows completed/skipped.
      return { title: ch.title, status: 'completed' };
    });
  }

  /* ── canvas interaction ─────────────────────────────── */

  _bind() {
    this.canvas.addEventListener('mousemove', e => this._onMouseMove(e));
    this.canvas.addEventListener('mouseleave', () => { this.hoveredZone = null; this._drawOverlay(); });
    this.canvas.addEventListener('click', e => this._onCanvasClick(e));
    // Close picker on outside click
    document.addEventListener('mousedown', e => {
      if (this._pickerEl && !this._pickerEl.contains(e.target) && e.target !== this.canvas) {
        this._closePicker();
      }
    });
  }

  _rect() { return this.canvas.getBoundingClientRect(); }

  _onMouseMove(e) {
    if (this.reviewMode || this._pickerOpen) return;
    if (this.challenges[this.currentIndex].type === 'tutorial') return;
    const r = this._rect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const zone = this._hitTest(x, y);
    if (zone !== this.hoveredZone) {
      this.hoveredZone = zone;
      this._drawOverlay();
      this.canvas.style.cursor = zone ? 'pointer' : 'default';
    }
  }

  _onCanvasClick(e) {
    if (this.reviewMode) return;
    if (this.challenges[this.currentIndex].type === 'tutorial') return;
    const r = this._rect();
    const x = e.clientX - r.left, y = e.clientY - r.top;

    // Did we click an existing annotation?
    const ann = this._hitAnnotation(x, y);
    if (ann) { this.removeFinding(ann.id); return; }

    const zone = this._hitTest(x, y);
    if (!zone) return;
    this._openPicker(zone, x, y, e.clientX, e.clientY);
  }

  _hitTest(x, y) {
    let best = null, bestArea = Infinity;
    for (const z of this.zones) {
      const rr = z.rect;
      if (x >= rr.x && x <= rr.x + rr.w && y >= rr.y && y <= rr.y + rr.h) {
        const area = rr.w * rr.h;
        if (area < bestArea) { best = z; bestArea = area; }
      }
    }
    return best;
  }

  _hitAnnotation(x, y) {
    const R = 10;
    for (const f of this.findings) {
      if (Math.hypot(f.x - x, f.y - y) < R) return f;
    }
    return null;
  }

  /* ── overlay drawing (hover highlights + annotations) ── */

  _drawOverlay() {
    // Redraw content first
    const W = this.canvas.clientWidth, H = this.canvas.clientHeight;
    this.renderContent(this.ctx, W, H, this.challenges[this.currentIndex]);

    const ctx = this.ctx;

    // Hover highlight
    if (this.hoveredZone && !this.reviewMode) {
      const rr = this.hoveredZone.rect;
      ctx.save();
      ctx.strokeStyle = 'rgba(88,166,255,0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.strokeRect(rr.x, rr.y, rr.w, rr.h);
      ctx.fillStyle = 'rgba(88,166,255,0.07)';
      ctx.fillRect(rr.x, rr.y, rr.w, rr.h);
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Annotation markers
    if (!this.reviewMode) {
      for (const f of this.findings) {
        this._drawMarker(ctx, f.x, f.y, this._rubricColor(f.rubricId), false);
      }
    } else {
      this._drawReviewOverlay(ctx, W, H);
    }
  }

  _drawReviewOverlay(ctx, W, H) {
    const ch = this.challenges[this.currentIndex];
    const key = ch.answerKey;
    const matched = new Set();
    const falsePositives = [];

    // Match findings to answer key
    for (const f of this.findings) {
      const match = key.find(k => k.rubricId === f.rubricId && !matched.has(k.rubricId));
      if (match) {
        matched.add(match.rubricId);
        this._drawMarker(ctx, f.x, f.y, '#50c878', true, '\u2713');
      } else {
        falsePositives.push(f);
        this._drawMarker(ctx, f.x, f.y, '#f06060', true, '\u2717');
      }
    }

    // Missed issues — pulsing zone outlines
    for (const k of key) {
      if (matched.has(k.rubricId)) continue;
      const zone = this.zones.find(z => z.id === k.zoneId);
      if (!zone) continue;
      const rr = zone.rect;
      ctx.save();
      ctx.strokeStyle = 'rgba(240,160,80,0.7)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 4]);
      ctx.strokeRect(rr.x + 2, rr.y + 2, rr.w - 4, rr.h - 4);
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  _drawMarker(ctx, x, y, color, review, symbol) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = review ? 0.9 : 0.75;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (symbol) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(symbol, x, y);
    }
    ctx.restore();
  }

  _rubricColor(rubricId) {
    const item = this.rubric.find(r => r.id === rubricId);
    return item ? (this._catColors[item.category] || '#aaa') : '#aaa';
  }

  /* ── issue picker (floating menu) ──────────────────── */

  _openPicker(zone, cx, cy, clientX, clientY) {
    this._closePicker();
    this._pickerOpen = true;

    const el = document.createElement('div');
    el.className = 'ae-picker';

    const heading = document.createElement('div');
    heading.className = 'ae-picker-heading';
    heading.textContent = 'Select issue:';
    el.appendChild(heading);

    // Already-used rubric ids in this zone
    const usedInZone = new Set(this.findings.filter(f => f.zoneId === zone.id).map(f => f.rubricId));

    // Filter rubric items relevant to this zone
    const relevant = this.rubric.filter(r => zone.rubricIds.includes(r.id));
    if (relevant.length === 0) {
      heading.textContent = 'No rubric items for this area';
    }

    for (const item of relevant) {
      const btn = document.createElement('button');
      btn.className = 'ae-picker-item';
      if (usedInZone.has(item.id)) {
        btn.classList.add('ae-picker-used');
        btn.disabled = true;
      }
      const dot = document.createElement('span');
      dot.className = 'ae-picker-dot';
      dot.style.background = this._catColors[item.category] || '#aaa';
      btn.appendChild(dot);
      btn.appendChild(document.createTextNode(item.shortName));
      btn.addEventListener('click', () => {
        this.addFinding(item.id, zone.id, cx, cy);
        this._closePicker();
      });
      el.appendChild(btn);
    }

    // Also offer "No issue here" to dismiss
    const noIssue = document.createElement('button');
    noIssue.className = 'ae-picker-item ae-picker-dismiss';
    noIssue.textContent = 'No issue here';
    noIssue.addEventListener('click', () => this._closePicker());
    el.appendChild(noIssue);

    // Position near click but within viewport
    document.body.appendChild(el);
    const pw = el.offsetWidth, ph = el.offsetHeight;
    let left = clientX + 12, top = clientY - 10;
    if (left + pw > window.innerWidth - 10) left = clientX - pw - 12;
    if (top + ph > window.innerHeight - 10) top = window.innerHeight - ph - 10;
    if (top < 10) top = 10;
    el.style.left = left + 'px';
    el.style.top = top + 'px';

    this._pickerEl = el;
  }

  _closePicker() {
    if (this._pickerEl) { this._pickerEl.remove(); this._pickerEl = null; }
    this._pickerOpen = false;
  }

  /* ── canvas resize helper ──────────────────────────── */

  _resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ── left panel (nav, hints, instructions) ─────────── */

  _renderLeft() {
    const ch = this.challenges[this.currentIndex];
    const total = this.challenges.length;
    const i = this.currentIndex;

    let html = '';

    // Challenge nav
    html += '<div class="ae-section">';
    html += '<h2>Challenge</h2>';
    html += '<div class="ae-nav">';
    html += `<button class="ae-nav-btn" id="ae-prev" ${i === 0 ? 'disabled' : ''}>&lsaquo;</button>`;
    html += `<span class="ae-nav-label">${i + 1} / ${total}</span>`;
    html += `<button class="ae-nav-btn" id="ae-next" ${i === total - 1 ? 'disabled' : ''}>&rsaquo;</button>`;
    html += '</div>';
    html += `<div class="ae-challenge-title">${ch.title}</div>`;
    html += `<div class="ae-difficulty">Difficulty: ${this._stars(ch.difficulty)}</div>`;
    html += '</div>';

    // Hints
    html += '<div class="ae-section">';
    html += '<h2>Hints</h2>';
    if (!this.reviewMode && ch.hints.length > 0) {
      html += `<button class="ae-btn" id="ae-hint-btn" ${this.hintsRevealed >= ch.hints.length ? 'disabled' : ''}>Reveal Hint (${this.hintsRevealed}/${ch.hints.length})</button>`;
    }
    if (this.hintsRevealed > 0) {
      html += '<ol class="ae-hint-list">';
      for (let h = 0; h < this.hintsRevealed; h++) {
        html += `<li>${ch.hints[h]}</li>`;
      }
      html += '</ol>';
    } else if (!this.reviewMode) {
      html += '<p class="ae-muted">No hints revealed yet.</p>';
    }
    html += '</div>';

    // Instructions
    if (!this.reviewMode) {
      html += '<div class="ae-section">';
      html += '<h2>Instructions</h2>';
      html += '<p class="ae-muted">Click on problem areas in the figure. Select the matching rubric issue from the popup. Click an annotation to remove it.</p>';
      html += '</div>';
    }

    // Summary button (after last challenge in review mode)
    if (this.reviewMode) {
      html += '<div class="ae-section">';
      html += '<button class="ae-btn" id="ae-summary-btn">View Summary</button>';
      html += '</div>';
    }

    this.leftPanel.innerHTML = html;

    // Event wiring
    const prevBtn = document.getElementById('ae-prev');
    const nextBtn = document.getElementById('ae-next');
    if (prevBtn) prevBtn.addEventListener('click', () => this.loadChallenge(this.currentIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => this.loadChallenge(this.currentIndex + 1));
    const hintBtn = document.getElementById('ae-hint-btn');
    if (hintBtn) hintBtn.addEventListener('click', () => this.revealHint());
    const summaryBtn = document.getElementById('ae-summary-btn');
    if (summaryBtn) summaryBtn.addEventListener('click', () => this._showSummary());
  }

  _stars(difficulty) {
    const levels = { easy: 1, medium: 2, hard: 3 };
    const n = levels[difficulty] || 1;
    return '<span class="ae-stars">' + '\u2605'.repeat(n) + '\u2606'.repeat(3 - n) + '</span>';
  }

  /* ── right panel (rubric + findings) ───────────────── */

  _renderRight() {
    const ch = this.challenges[this.currentIndex];
    let html = '';

    // Rubric reference
    html += '<div class="ae-section">';
    html += '<h2>Rubric Reference</h2>';
    const cats = {};
    for (const r of this.rubric) {
      (cats[r.category] = cats[r.category] || []).push(r);
    }
    for (const [cat, items] of Object.entries(cats)) {
      html += `<details class="ae-rubric-cat"><summary><span class="ae-picker-dot" style="background:${this._catColors[cat] || '#aaa'}"></span>${cat} (${items.length})</summary>`;
      html += '<ul class="ae-rubric-list">';
      for (const it of items) {
        html += `<li><strong>${it.shortName}</strong>: ${it.description}</li>`;
      }
      html += '</ul></details>';
    }
    html += '</div>';

    // Findings
    html += '<div class="ae-section">';
    html += `<h2>Your Findings <span class="ae-count">${this.findings.length}</span></h2>`;

    if (this.reviewMode) {
      const key = ch.answerKey;
      const matchedIds = new Set();
      // Correct findings
      for (const f of this.findings) {
        const match = key.find(k => k.rubricId === f.rubricId && !matchedIds.has(k.rubricId));
        const rItem = this.rubric.find(r => r.id === f.rubricId);
        if (match) {
          matchedIds.add(match.rubricId);
          html += `<div class="ae-finding ae-correct"><span class="ae-finding-icon">\u2713</span> ${rItem ? rItem.shortName : f.rubricId}<div class="ae-explanation">${match.explanation}</div></div>`;
        } else {
          html += `<div class="ae-finding ae-incorrect"><span class="ae-finding-icon">\u2717</span> ${rItem ? rItem.shortName : f.rubricId}<div class="ae-explanation">This isn't an issue in this figure.</div></div>`;
        }
      }
      // Missed
      const missed = key.filter(k => !matchedIds.has(k.rubricId));
      if (missed.length > 0) {
        html += '<div class="ae-missed-heading">Missed Issues</div>';
        for (const m of missed) {
          const rItem = this.rubric.find(r => r.id === m.rubricId);
          html += `<div class="ae-finding ae-missed"><span class="ae-finding-icon">!</span> ${rItem ? rItem.shortName : m.rubricId}<div class="ae-explanation">${m.explanation}</div></div>`;
        }
      }
      if (key.length === 0 && this.findings.length === 0) {
        html += '<div class="ae-finding ae-correct"><span class="ae-finding-icon">\u2713</span> Correct! This figure has no issues.</div>';
      } else if (key.length === 0 && this.findings.length > 0) {
        html += '<div class="ae-missed-heading">This was a trick question — the figure is correct!</div>';
      }
    } else {
      if (this.findings.length === 0) {
        html += '<p class="ae-muted">No issues identified yet.</p>';
      } else {
        for (const f of this.findings) {
          const rItem = this.rubric.find(r => r.id === f.rubricId);
          const col = this._rubricColor(f.rubricId);
          html += `<div class="ae-finding"><span class="ae-picker-dot" style="background:${col}"></span>${rItem ? rItem.shortName : f.rubricId}<button class="ae-finding-remove" data-id="${f.id}">\u2717</button></div>`;
        }
      }
      html += `<button class="ae-btn ae-btn-subtle" id="ae-clear-all" ${this.findings.length === 0 ? 'disabled' : ''}>Clear All</button>`;
    }
    html += '</div>';

    this.rightPanel.innerHTML = html;

    // Wire remove buttons
    this.rightPanel.querySelectorAll('.ae-finding-remove').forEach(btn => {
      btn.addEventListener('click', () => this.removeFinding(Number(btn.dataset.id)));
    });
    const clearBtn = document.getElementById('ae-clear-all');
    if (clearBtn) clearBtn.addEventListener('click', () => {
      this.findings = [];
      this._renderRight();
      this._drawOverlay();
    });
  }

  /* ── center controls (Check Answers / Next) ────────── */

  _renderCenterControls() {
    let html = '';
    if (!this.reviewMode) {
      html += '<button class="ae-btn ae-btn-primary" id="ae-check">Check Answers</button>';
    } else {
      if (this.currentIndex < this.challenges.length - 1) {
        html += '<button class="ae-btn ae-btn-primary" id="ae-next-bottom">Next Challenge \u203a</button>';
      } else {
        html += '<button class="ae-btn ae-btn-primary" id="ae-summary-bottom">View Summary</button>';
      }
    }
    this.centerControls.innerHTML = html;

    const checkBtn = document.getElementById('ae-check');
    if (checkBtn) checkBtn.addEventListener('click', () => this.checkAnswers());
    const nextBot = document.getElementById('ae-next-bottom');
    if (nextBot) nextBot.addEventListener('click', () => this.loadChallenge(this.currentIndex + 1));
    const sumBot = document.getElementById('ae-summary-bottom');
    if (sumBot) sumBot.addEventListener('click', () => this._showSummary());
  }

  /* ── tutorial mode ──────────────────────────────────── */

  _renderTutorial() {
    const ch = this.challenges[this.currentIndex];
    const steps = ch.tutorialSteps || [];
    const step = steps[this._tutorialStep];
    this._tutorialVisited.add(this._tutorialStep);

    // Notify callback
    if (this.onTutorialStep) this.onTutorialStep(step, this._tutorialStep);

    // Draw overlay
    this._drawTutorialOverlay(step);

    // Left panel
    let html = '';
    html += '<div class="ae-section">';
    html += '<h2>Tutorial</h2>';
    html += `<div class="ae-challenge-title">${ch.title}</div>`;
    html += '<p class="ae-muted" style="margin:8px 0">This figure follows all E80 guidelines. Step through each element to learn what makes a good figure.</p>';
    html += '</div>';

    html += '<div class="ae-section">';
    html += '<h2>Steps</h2>';
    html += '<div class="ae-tutorial-steps">';
    for (let i = 0; i < steps.length; i++) {
      const visited = this._tutorialVisited.has(i);
      const current = i === this._tutorialStep;
      const cls = current ? 'ae-tut-step ae-tut-current' : visited ? 'ae-tut-step ae-tut-visited' : 'ae-tut-step';
      const icon = visited && !current ? '\u2713 ' : `${i + 1}. `;
      html += `<button class="${cls}" data-step="${i}">${icon}${steps[i].label}</button>`;
    }
    html += '</div>';
    html += '</div>';

    this.leftPanel.innerHTML = html;

    this.leftPanel.querySelectorAll('.ae-tut-step').forEach(btn => {
      btn.addEventListener('click', () => {
        this._tutorialStep = Number(btn.dataset.step);
        this._renderTutorial();
      });
    });

    // Right panel
    let rhtml = '';
    rhtml += '<div class="ae-section">';
    rhtml += `<h2>Step ${this._tutorialStep + 1} of ${steps.length}</h2>`;
    rhtml += `<div class="ae-challenge-title">${step.label}</div>`;
    rhtml += `<p class="ae-tutorial-text">${step.text}</p>`;
    rhtml += '</div>';
    this.rightPanel.innerHTML = rhtml;

    // Center controls
    let chtml = '';
    if (this._tutorialStep > 0) {
      chtml += '<button class="ae-btn" id="ae-tut-prev">&lsaquo; Previous</button>';
    }
    if (this._tutorialStep < steps.length - 1) {
      chtml += '<button class="ae-btn ae-btn-primary" id="ae-tut-next">Next &rsaquo;</button>';
    } else {
      chtml += '<button class="ae-btn ae-btn-primary" id="ae-tut-start">Start Critiques &rsaquo;</button>';
    }
    this.centerControls.innerHTML = chtml;

    const prevBtn = document.getElementById('ae-tut-prev');
    if (prevBtn) prevBtn.addEventListener('click', () => { this._tutorialStep--; this._renderTutorial(); });
    const nextBtn = document.getElementById('ae-tut-next');
    if (nextBtn) nextBtn.addEventListener('click', () => { this._tutorialStep++; this._renderTutorial(); });
    const startBtn = document.getElementById('ae-tut-start');
    if (startBtn) startBtn.addEventListener('click', () => this.loadChallenge(this.currentIndex + 1));
  }

  _drawTutorialOverlay(step) {
    const W = this.canvas.clientWidth, H = this.canvas.clientHeight;
    this.renderContent(this.ctx, W, H, this.challenges[this.currentIndex]);

    const ctx = this.ctx;

    if (!step || step.domTarget) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      return;
    }

    const zone = this.zones.find(z => z.id === step.zoneId);
    if (!zone) return;

    const rr = zone.rect;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.rect(rr.x, rr.y + rr.h, rr.w, -rr.h);
    ctx.fill('evenodd');

    ctx.strokeStyle = '#50c878';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#50c878';
    ctx.shadowBlur = 12;
    ctx.strokeRect(rr.x - 1, rr.y - 1, rr.w + 2, rr.h + 2);
    ctx.restore();
  }

  /* ── summary overlay ───────────────────────────────── */

  _showSummary() {
    // Remove any existing summary
    const existing = document.getElementById('ae-summary-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'ae-summary-overlay';
    overlay.className = 'ae-summary-overlay';

    let html = '<div class="ae-summary-box">';
    html += '<h2>Challenge Summary</h2>';
    html += '<div class="ae-summary-list">';
    const critiqueChallenges = this.challenges.map((ch, i) => ({ ch, i })).filter(({ ch }) => ch.type !== 'tutorial');
    for (const { ch, i } of critiqueChallenges) {
      const done = this._completed.has(i);
      const icon = done ? '\u2713' : '\u2014';
      const cls = done ? 'ae-sum-done' : 'ae-sum-skip';
      html += `<div class="ae-summary-row ${cls}"><span>${icon}</span><strong>${ch.title}</strong><span class="ae-difficulty">${this._stars(ch.difficulty)}</span></div>`;
    }
    html += '</div>';
    const critiqueCompleted = critiqueChallenges.filter(({ i }) => this._completed.has(i)).length;
    html += `<p class="ae-muted">${critiqueCompleted} of ${critiqueChallenges.length} challenges reviewed.</p>`;
    html += '<button class="ae-btn ae-btn-primary" id="ae-close-summary">Close</button>';
    html += '</div>';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    document.getElementById('ae-close-summary').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }
}
