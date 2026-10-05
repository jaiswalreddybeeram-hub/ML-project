/**
 * Interactive Canvas Heatmap Engine for Taiwanese Bankruptcy Prediction
 * Renders high-DPI interactive correlation matrices with tooltips, crosshairs,
 * multiple color palettes, cell values, and export capabilities.
 */

class CorrelationHeatmap {
  constructor(canvasId, tooltipId, legendCanvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.tooltip = document.getElementById(tooltipId);
    this.legendCanvas = document.getElementById(legendCanvasId);
    this.legendCtx = this.legendCanvas ? this.legendCanvas.getContext('2d') : null;

    this.currentPreset = 'top15';
    this.currentPalette = 'coolwarm';
    this.showValues = true;
    this.hoveredCell = null;
    this.selectedCell = null;

    this.data = HEATMAP_MATRICES['top15'];

    this.initEvents();
    this.render();
    this.renderLegend();
  }

  setPreset(presetKey) {
    if (!HEATMAP_MATRICES[presetKey]) return;
    this.currentPreset = presetKey;
    this.data = HEATMAP_MATRICES[presetKey];
    this.hoveredCell = null;
    this.selectedCell = null;
    this.render();
  }

  setPalette(palette) {
    this.currentPalette = palette;
    this.render();
    this.renderLegend();
  }

  toggleValues(show) {
    this.showValues = show;
    this.render();
  }

  initEvents() {
    window.addEventListener('resize', () => {
      this.render();
      this.renderLegend();
    });

    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
  }

  getColor(val) {
    // val is between -1 and 1
    const clamped = Math.max(-1, Math.min(1, val));

    if (this.currentPalette === 'coolwarm') {
      // -1: Deep Indigo/Blue #1d4ed8, 0: Pure White #ffffff, +1: Crimson/Red #dc2626
      if (clamped < 0) {
        const t = (clamped + 1); // 0 to 1
        const r = Math.round(29 + t * (255 - 29));
        const g = Math.round(78 + t * (255 - 78));
        const b = Math.round(216 + t * (255 - 216));
        return `rgb(${r},${g},${b})`;
      } else {
        const t = clamped; // 0 to 1
        const r = Math.round(255 - t * (255 - 220));
        const g = Math.round(255 - t * (255 - 38));
        const b = Math.round(255 - t * (255 - 38));
        return `rgb(${r},${g},${b})`;
      }
    } else if (this.currentPalette === 'viridis') {
      // 0 to 1 normalized
      const norm = (clamped + 1) / 2;
      return this.interpolateViridis(norm);
    } else if (this.currentPalette === 'emerald_ruby') {
      // -1: Emerald #059669, 0: #f8fafc, +1: Ruby #e11d48
      if (clamped < 0) {
        const t = clamped + 1; // 0 to 1
        const r = Math.round(5 + t * (248 - 5));
        const g = Math.round(150 + t * (250 - 150));
        const b = Math.round(105 + t * (252 - 105));
        return `rgb(${r},${g},${b})`;
      } else {
        const t = clamped;
        const r = Math.round(248 - t * (248 - 225));
        const g = Math.round(250 - t * (250 - 29));
        const b = Math.round(252 - t * (252 - 72));
        return `rgb(${r},${g},${b})`;
      }
    }
    return '#ffffff';
  }

  getTextColor(val) {
    if (this.currentPalette === 'viridis') {
      const norm = (val + 1) / 2;
      return norm > 0.45 && norm < 0.85 ? '#0f172a' : '#ffffff';
    }
    // For coolwarm or emerald_ruby: dark text near 0, white text for strong extremes
    return Math.abs(val) > 0.45 ? '#ffffff' : '#1e293b';
  }

  interpolateViridis(t) {
    // Viridis stops: 0: #440154, 0.25: #3b528b, 0.5: #21918c, 0.75: #5ec962, 1.0: #fde725
    const stops = [
      { p: 0.0, r: 68, g: 1, b: 84 },
      { p: 0.25, r: 59, g: 82, b: 139 },
      { p: 0.5, r: 33, g: 145, b: 140 },
      { p: 0.75, r: 94, g: 201, b: 98 },
      { p: 1.0, r: 253, g: 231, b: 37 }
    ];
    let lower = stops[0], upper = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) {
      if (t >= stops[i].p && t <= stops[i + 1].p) {
        lower = stops[i];
        upper = stops[i + 1];
        break;
      }
    }
    const range = upper.p - lower.p;
    const factor = range === 0 ? 0 : (t - lower.p) / range;
    const r = Math.round(lower.r + factor * (upper.r - lower.r));
    const g = Math.round(lower.g + factor * (upper.g - lower.g));
    const b = Math.round(lower.b + factor * (upper.b - lower.b));
    return `rgb(${r},${g},${b})`;
  }

  getMetrics() {
    const n = this.data.features.length;
    const container = this.canvas.parentElement;
    const availableWidth = Math.max(680, container ? container.clientWidth - 40 : 800);

    // Margins
    const leftMargin = n > 15 ? 190 : 180;
    const topMargin = n > 15 ? 150 : 140;
    const rightMargin = 20;
    const bottomMargin = 20;

    const matrixAreaWidth = availableWidth - leftMargin - rightMargin;
    const cellSize = Math.max(22, Math.min(48, Math.floor(matrixAreaWidth / n)));

    const width = leftMargin + (n * cellSize) + rightMargin;
    const height = topMargin + (n * cellSize) + bottomMargin;

    return { n, leftMargin, topMargin, cellSize, width, height };
  }

  render() {
    if (!this.data || !this.canvas) return;

    const { n, leftMargin, topMargin, cellSize, width, height } = this.getMetrics();
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';

    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);

    // Background
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, width, height);

    const features = this.data.features;
    const matrix = this.data.matrix;

    // Draw Crosshair highlights if hovered
    if (this.hoveredCell) {
      const { r, c } = this.hoveredCell;
      // Row highlight
      this.ctx.fillStyle = 'rgba(99, 102, 241, 0.08)';
      this.ctx.fillRect(leftMargin, topMargin + r * cellSize, n * cellSize, cellSize);
      // Column highlight
      this.ctx.fillRect(leftMargin + c * cellSize, topMargin, cellSize, n * cellSize);
    }

    // Draw Cells
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const val = matrix[r][c];
        const x = leftMargin + c * cellSize;
        const y = topMargin + r * cellSize;

        this.ctx.fillStyle = this.getColor(val);
        this.ctx.fillRect(x, y, cellSize, cellSize);

        // Cell border
        this.ctx.strokeStyle = '#f1f5f9';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, cellSize, cellSize);

        // Highlight selected or hovered cell
        if (this.selectedCell && this.selectedCell.r === r && this.selectedCell.c === c) {
          this.ctx.strokeStyle = '#4f46e5';
          this.ctx.lineWidth = 3;
          this.ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
        } else if (this.hoveredCell && this.hoveredCell.r === r && this.hoveredCell.c === c) {
          this.ctx.strokeStyle = '#0f172a';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
        }

        // Cell numerical value
        if (this.showValues && cellSize >= 26) {
          this.ctx.fillStyle = this.getTextColor(val);
          this.ctx.font = `${Math.max(8, Math.min(11, Math.floor(cellSize * 0.3)))}px Inter, system-ui, sans-serif`;
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          const txt = val === 1 ? '1.0' : (val > 0 ? '+' + val.toFixed(2) : val.toFixed(2));
          this.ctx.fillText(txt, x + cellSize / 2, y + cellSize / 2);
        }
      }
    }

    // Draw Column Labels (Angled at top)
    this.ctx.save();
    this.ctx.font = '10px Inter, system-ui, sans-serif';
    this.ctx.fillStyle = '#334155';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';

    for (let c = 0; c < n; c++) {
      const featName = this.truncateLabel(features[c], 26);
      const x = leftMargin + c * cellSize + (cellSize / 2);
      const y = topMargin - 8;

      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.rotate(-Math.PI / 3.8); // ~47 degree angle

      // Special highlight for Bankrupt? target
      if (features[c] === 'Bankrupt?') {
        this.ctx.fillStyle = '#dc2626';
        this.ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      } else if (this.hoveredCell && this.hoveredCell.c === c) {
        this.ctx.fillStyle = '#4f46e5';
        this.ctx.font = 'bold 10px Inter, system-ui, sans-serif';
      } else {
        this.ctx.fillStyle = '#334155';
        this.ctx.font = '10px Inter, system-ui, sans-serif';
      }

      this.ctx.fillText(featName, 0, 0);
      this.ctx.restore();
    }
    this.ctx.restore();

    // Draw Row Labels (Right-aligned at left margin)
    this.ctx.font = '10px Inter, system-ui, sans-serif';
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';

    for (let r = 0; r < n; r++) {
      const featName = this.truncateLabel(features[r], 28);
      const x = leftMargin - 10;
      const y = topMargin + r * cellSize + (cellSize / 2);

      if (features[r] === 'Bankrupt?') {
        this.ctx.fillStyle = '#dc2626';
        this.ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      } else if (this.hoveredCell && this.hoveredCell.r === r) {
        this.ctx.fillStyle = '#4f46e5';
        this.ctx.font = 'bold 10px Inter, system-ui, sans-serif';
      } else {
        this.ctx.fillStyle = '#334155';
        this.ctx.font = '10px Inter, system-ui, sans-serif';
      }

      this.ctx.fillText(featName, x, y);
    }
  }

  truncateLabel(text, maxLen) {
    if (!text) return '';
    return text.length > maxLen ? text.substring(0, maxLen - 2) + '…' : text;
  }

  renderLegend() {
    if (!this.legendCanvas || !this.legendCtx) return;
    const w = this.legendCanvas.clientWidth || 340;
    const h = 42;
    const dpr = window.devicePixelRatio || 1;

    this.legendCanvas.width = w * dpr;
    this.legendCanvas.height = h * dpr;
    this.legendCanvas.style.width = w + 'px';
    this.legendCanvas.style.height = h + 'px';

    this.legendCtx.resetTransform();
    this.legendCtx.scale(dpr, dpr);

    const barX = 15;
    const barY = 8;
    const barW = w - 30;
    const barH = 12;

    // Draw gradient
    for (let x = 0; x < barW; x++) {
      const val = -1 + (x / barW) * 2; // -1 to +1
      this.legendCtx.fillStyle = this.getColor(val);
      this.legendCtx.fillRect(barX + x, barY, 1, barH);
    }

    this.legendCtx.strokeStyle = '#cbd5e1';
    this.legendCtx.strokeRect(barX, barY, barW, barH);

    // Ticks
    this.legendCtx.font = '10px Inter, system-ui, sans-serif';
    this.legendCtx.fillStyle = '#64748b';
    this.legendCtx.textAlign = 'center';
    this.legendCtx.textBaseline = 'top';

    const ticks = [
      { val: -1.0, label: '-1.0 (Inverse)' },
      { val: -0.5, label: '-0.5' },
      { val: 0.0, label: '0.0 (None)' },
      { val: 0.5, label: '+0.5' },
      { val: 1.0, label: '+1.0 (Direct)' }
    ];

    ticks.forEach(t => {
      const x = barX + ((t.val + 1) / 2) * barW;
      this.legendCtx.fillText(t.label, x, barY + barH + 5);
    });
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const { n, leftMargin, topMargin, cellSize } = this.getMetrics();

    if (
      mouseX >= leftMargin && mouseX < leftMargin + n * cellSize &&
      mouseY >= topMargin && mouseY < topMargin + n * cellSize
    ) {
      const c = Math.floor((mouseX - leftMargin) / cellSize);
      const r = Math.floor((mouseY - topMargin) / cellSize);

      if (r >= 0 && r < n && c >= 0 && c < n) {
        if (!this.hoveredCell || this.hoveredCell.r !== r || this.hoveredCell.c !== c) {
          this.hoveredCell = { r, c };
          this.render();
          this.showTooltip(e, r, c);
        } else {
          this.positionTooltip(e);
        }
        return;
      }
    }

    if (this.hoveredCell) {
      this.hoveredCell = null;
      this.render();
      this.hideTooltip();
    }
  }

  handleMouseLeave() {
    if (this.hoveredCell) {
      this.hoveredCell = null;
      this.render();
    }
    this.hideTooltip();
  }

  handleClick(e) {
    if (this.hoveredCell) {
      this.selectedCell = { ...this.hoveredCell };
      this.render();
      this.displayIndicatorInsight(this.selectedCell.r, this.selectedCell.c);
    }
  }

  showTooltip(e, r, c) {
    if (!this.tooltip) return;
    const feat1 = this.data.features[r];
    const feat2 = this.data.features[c];
    const val = this.data.matrix[r][c];

    let strength = '';
    let badgeClass = '';
    const absVal = Math.abs(val);

    if (absVal >= 0.7) {
      strength = val > 0 ? 'Strong Positive Correlation' : 'Strong Inverse Correlation';
      badgeClass = val > 0 ? 'badge-risk' : 'badge-safe';
    } else if (absVal >= 0.35) {
      strength = val > 0 ? 'Moderate Positive Correlation' : 'Moderate Inverse Correlation';
      badgeClass = val > 0 ? 'badge-warn' : 'badge-info';
    } else if (absVal >= 0.1) {
      strength = val > 0 ? 'Weak Positive Correlation' : 'Weak Inverse Correlation';
      badgeClass = 'badge-neutral';
    } else {
      strength = 'Negligible Linear Correlation';
      badgeClass = 'badge-neutral';
    }

    let implication = '';
    if (feat1 === 'Bankrupt?' || feat2 === 'Bankrupt?') {
      const otherFeat = feat1 === 'Bankrupt?' ? feat2 : feat1;
      if (val > 0.15) {
        implication = `⚠️ High values of <b>${otherFeat}</b> strongly elevate company bankruptcy probability.`;
      } else if (val < -0.15) {
        implication = `🛡️ High values of <b>${otherFeat}</b> act as a robust solvency buffer against bankruptcy.`;
      } else {
        implication = `Minor direct linear correlation with bankruptcy status.`;
      }
    } else if (feat1 === feat2) {
      implication = `Self correlation (identity diagonal).`;
    } else if (absVal > 0.7) {
      implication = `High multicollinearity between these two indicators ($r = ${val.toFixed(3)}$).`;
    } else {
      implication = `Moderate financial co-movement across Taiwanese firms.`;
    }

    this.tooltip.innerHTML = `
      <div class="tooltip-header">
        <span class="tooltip-badge ${badgeClass}">${strength}</span>
        <strong>r = ${val > 0 ? '+' : ''}${val.toFixed(3)}</strong>
      </div>
      <div class="tooltip-pair">
        <div><small>Indicator A:</small><b>${feat1}</b></div>
        <div><small>Indicator B:</small><b>${feat2}</b></div>
      </div>
      <div class="tooltip-insight">${implication}</div>
      <div class="tooltip-hint">Click cell to view detailed indicator comparison</div>
    `;

    this.tooltip.style.display = 'block';
    this.positionTooltip(e);
  }

  positionTooltip(e) {
    if (!this.tooltip) return;
    const pad = 15;
    const ttWidth = this.tooltip.offsetWidth || 260;
    const ttHeight = this.tooltip.offsetHeight || 130;

    let left = e.clientX + pad;
    let top = e.clientY + pad;

    if (left + ttWidth > window.innerWidth) {
      left = e.clientX - ttWidth - pad;
    }
    if (top + ttHeight > window.innerHeight) {
      top = e.clientY - ttHeight - pad;
    }

    this.tooltip.style.left = left + 'px';
    this.tooltip.style.top = top + 'px';
  }

  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.style.display = 'none';
    }
  }

  displayIndicatorInsight(r, c) {
    const feat1 = this.data.features[r];
    const feat2 = this.data.features[c];
    const val = this.data.matrix[r][c];

    const box = document.getElementById('heatmapInsightBox');
    if (!box) return;

    // Retrieve stats
    const stat1 = FEATURES_METADATA.find(f => f.name === feat1);
    const stat2 = FEATURES_METADATA.find(f => f.name === feat2);

    let html = `
      <div class="insight-selected-head">
        <div>
          <h4>${feat1} <span class="corr-arrow">↔</span> ${feat2}</h4>
          <span class="subtitle">Pearson Correlation Analysis</span>
        </div>
        <div class="corr-value-pill ${val > 0 ? 'pos' : 'neg'}">
          ${val > 0 ? '+' : ''}${val.toFixed(3)}
        </div>
      </div>
      <div class="insight-grid-pair">
        <div class="feat-box">
          <h5>${feat1}</h5>
          ${stat1 ? `
            <div class="stat-row"><span>Category</span><b>${stat1.category}</b></div>
            <div class="stat-row"><span>Dataset Mean</span><b>${stat1.mean}</b></div>
            <div class="stat-row"><span>Std Dev</span><b>${stat1.std}</b></div>
            <div class="stat-row"><span>Correlation with Bankruptcy</span><b class="${stat1.corr > 0 ? 'red' : 'green'}">${stat1.corr > 0 ? '+' : ''}${stat1.corr.toFixed(3)}</b></div>
          ` : `<span>Target variable (0 = Safe, 1 = Bankrupt)</span>`}
        </div>
        <div class="feat-box">
          <h5>${feat2}</h5>
          ${stat2 ? `
            <div class="stat-row"><span>Category</span><b>${stat2.category}</b></div>
            <div class="stat-row"><span>Dataset Mean</span><b>${stat2.mean}</b></div>
            <div class="stat-row"><span>Std Dev</span><b>${stat2.std}</b></div>
            <div class="stat-row"><span>Correlation with Bankruptcy</span><b class="${stat2.corr > 0 ? 'red' : 'green'}">${stat2.corr > 0 ? '+' : ''}${stat2.corr.toFixed(3)}</b></div>
          ` : `<span>Target variable (0 = Safe, 1 = Bankrupt)</span>`}
        </div>
      </div>
      <div class="insight-analysis-note">
        <strong>Economic Risk Takeaway:</strong>
        ${this.getDetailedInsightText(feat1, feat2, val)}
      </div>
    `;

    box.innerHTML = html;
  }

  getDetailedInsightText(f1, f2, r) {
    if (f1 === 'Bankrupt?' || f2 === 'Bankrupt?') {
      const feat = f1 === 'Bankrupt?' ? f2 : f1;
      if (r > 0.15) {
        return `As <b>${feat}</b> increases, the probability of corporate distress in Taiwanese firms significantly escalates. Elevated leverage and short-term debt obligations consume operating liquidity, pushing the firm towards default.`;
      } else if (r < -0.15) {
        return `Higher <b>${feat}</b> indicates superior financial health and asset productivity. Companies with robust returns on assets and retained earnings are historically shielded against systemic downturns.`;
      }
      return `This indicator exhibits low direct bivariate linear correlation with the bankruptcy label, but may contribute non-linearly within ensemble models like Random Forest.`;
    }
    if (Math.abs(r) > 0.8) {
      return `Very strong correlation ($r = ${r.toFixed(3)}$). In financial modeling, these two indicators carry redundant information (collinearity). Pruning or regularizing one of them (e.g. Ridge/Lasso) often improves model generalization.`;
    }
    if (r > 0.4) {
      return `Positive financial alignment ($r = ${r.toFixed(3)}$). When <b>${f1}</b> expands, <b>${f2}</b> tends to expand proportionately across Taiwanese enterprises.`;
    }
    if (r < -0.4) {
      return `Inverse trade-off ($r = ${r.toFixed(3)}$). These two indicators demonstrate opposing dynamics, typical of debt expansion suppressing net asset margins.`;
    }
    return `Mild relationship ($r = ${r.toFixed(3)}$). These indicators capture largely distinct financial operational aspects of company health.`;
  }

  exportPNG() {
    if (!this.canvas) return;
    const a = document.createElement('a');
    a.download = `taiwan_bankruptcy_heatmap_${this.currentPreset}.png`;
    a.href = this.canvas.toDataURL('image/png');
    a.click();
  }

  exportCSV() {
    if (!this.data) return;
    const features = this.data.features;
    const matrix = this.data.matrix;
    let csv = ',' + features.map(f => `"${f}"`).join(',') + '\n';
    features.forEach((f, i) => {
      csv += `"${f}",` + matrix[i].map(v => v.toFixed(3)).join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `taiwan_bankruptcy_correlation_${this.currentPreset}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}

// Global instance handle
let heatmapInstance = null;

function initHeatmapEngine() {
  if (document.getElementById('heatmapCanvas')) {
    heatmapInstance = new CorrelationHeatmap('heatmapCanvas', 'heatmapTooltip', 'legendCanvas');
  }
}
