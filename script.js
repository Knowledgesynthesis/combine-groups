// script.js – all the logic
const tbody = document.getElementById('rows');
const addRowBtn = document.getElementById('add-row');
const resultBox = document.getElementById('result');
const totalNEl = document.getElementById('totalN');
const meanEl = document.getElementById('combinedMean');
const sdEl = document.getElementById('combinedSd');

const DISP_TYPES = ['SD', 'SE', 'CI', 'Range', 'IQR'];

addRow();
addRow();

addRowBtn.addEventListener('click', addRow);

function addRow() {
  const idx = tbody.children.length + 1;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${idx}</td>
    <td><input type="number" min="1" class="n" placeholder="n"></td>
    <td><input type="number" step="any" class="mean" placeholder="mean"></td>
    <td>
      <select class="dtype">
        ${DISP_TYPES.map((d) => `<option value="${d}">${d}</option>`).join('')}
      </select>
    </td>
    <td class="din1"></td>
    <td class="din2"></td>
    <td class="sd">—</td>
    <td><button class="delete" title="Delete row">×</button></td>`;

  tbody.appendChild(tr);
  updateInputs(tr.querySelector('.dtype'));
  tr.addEventListener('input', () => recalc());
  tr.querySelector('.dtype').addEventListener('change', (e) => updateInputs(e.target));
  tr.querySelector('.delete').addEventListener('click', () => {
    tr.remove();
    relabelRows();
    recalc();
  });
  recalc();
}

function updateInputs(sel) {
  const tr = sel.closest('tr');
  const din1 = tr.querySelector('.din1');
  const din2 = tr.querySelector('.din2');
  din1.innerHTML = din2.innerHTML = '';
  const makeInput = (cls, ph) => `<input type="number" step="any" class="${cls}" placeholder="${ph}">`;

  switch (sel.value) {
    case 'SD':
      din1.innerHTML = makeInput('sdin', 'SD');
      break;
    case 'SE':
      din1.innerHTML = makeInput('sein', 'SE');
      break;
    case 'CI':
      din1.innerHTML = makeInput('ll', 'LL');
      din2.innerHTML = makeInput('ul', 'UL');
      break;
    case 'Range':
      din1.innerHTML = makeInput('min', 'min');
      din2.innerHTML = makeInput('max', 'max');
      break;
    case 'IQR':
      din1.innerHTML = makeInput('q1', 'Q1');
      din2.innerHTML = makeInput('q3', 'Q3');
      break;
  }
}

function relabelRows() {
  [...tbody.children].forEach((tr, i) => (tr.children[0].textContent = i + 1));
}

function getSD(tr) {
  const n = +tr.querySelector('.n').value;
  if (!n) return undefined;
  const dtype = tr.querySelector('.dtype').value;
  const get = (cls) => {
    const el = tr.querySelector('.' + cls);
    return el && el.value !== '' ? +el.value : NaN;
  };

  switch (dtype) {
    case 'SD': {
      const s = get('sdin');
      return Number.isFinite(s) ? s : undefined;
    }
    case 'SE': {
      const se = get('sein');
      return Number.isFinite(se) ? se * Math.sqrt(n) : undefined;
    }
    case 'CI': {
      const ll = get('ll'), ul = get('ul');
      return Number.isFinite(ll) && Number.isFinite(ul)
        ? ((ul - ll) / 3.92) * Math.sqrt(n)
        : undefined;
    }
    case 'Range': {
      const min = get('min'), max = get('max');
      if (!Number.isFinite(min) || !Number.isFinite(max)) return undefined;
      return (max - min) / (n <= 70 ? 4 : 6);
    }
    case 'IQR': {
      const q1 = get('q1'), q3 = get('q3');
      return Number.isFinite(q1) && Number.isFinite(q3)
        ? (q3 - q1) / 1.35
        : undefined;
    }
  }
}

function normalDist(x, mean, sd) {
  return (1 / (sd * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((x - mean) / sd) ** 2);
}

function plotCurves(groups, combined) {
  const plotDiv = document.getElementById('individual-curves');
  const combDiv = document.getElementById('combined-curve');
  const plotsSection = document.getElementById('plots');

  if (groups.length < 1) {
    plotsSection.classList.add('hidden');
    Plotly.purge(plotDiv);
    Plotly.purge(combDiv);
    return;
  }
  plotsSection.classList.remove('hidden');

  // Find min/max for x axis
  let minX = Math.min(...groups.map(g => g.mean - 3 * g.sd));
  let maxX = Math.max(...groups.map(g => g.mean + 3 * g.sd));
  if (combined) {
    minX = Math.min(minX, combined.mean - 3 * combined.sd);
    maxX = Math.max(maxX, combined.mean + 3 * combined.sd);
  }
  if (!isFinite(minX) || !isFinite(maxX)) {
    minX = -10; maxX = 10;
  }
  const xs = Array.from({length: 200}, (_, i) => minX + (maxX - minX) * i / 199);

  // Individual curves
  const traces = groups.map((g, i) => ({
    x: xs,
    y: xs.map(x => normalDist(x, g.mean, g.sd)),
    name: `Group ${i+1} (n=${g.n}, μ=${g.mean}, σ=${g.sd})`,
    mode: 'lines',
    line: {width: 2},
    hovertemplate: 'x: %{x:.2f}<br>y: %{y:.4f}<br>μ: '+g.mean+'<br>σ: '+g.sd+'<extra></extra>'
  }));
  Plotly.newPlot(plotDiv, traces, {
    margin: {t: 20, r: 20, l: 40, b: 40},
    legend: {orientation: 'h'},
    xaxis: {title: 'Value'},
    yaxis: {title: 'Density'},
    plot_bgcolor: '#122b36',
    paper_bgcolor: '#122b36',
    font: {color: '#e2f7fa'}
  }, {displayModeBar: false, responsive: true});

  // Combined curve
  if (combined) {
    Plotly.newPlot(combDiv, [{
      x: xs,
      y: xs.map(x => normalDist(x, combined.mean, combined.sd)),
      name: `Combined (N=${combined.n}, μ=${combined.mean.toFixed(4)}, σ=${combined.sd.toFixed(4)})`,
      mode: 'lines',
      line: {color: '#38bdf8', width: 3},
      hovertemplate: 'x: %{x:.2f}<br>y: %{y:.4f}<br>μ: '+combined.mean.toFixed(4)+'<br>σ: '+combined.sd.toFixed(4)+'<extra></extra>'
    }], {
      margin: {t: 20, r: 20, l: 40, b: 40},
      showlegend: false,
      xaxis: {title: 'Value'},
      yaxis: {title: 'Density'},
      plot_bgcolor: '#122b36',
      paper_bgcolor: '#122b36',
      font: {color: '#e2f7fa'}
    }, {displayModeBar: false, responsive: true});
  } else {
    Plotly.purge(combDiv);
  }
}

function recalc() {
  const groups = [];
  [...tbody.children].forEach((tr) => {
    const n = +tr.querySelector('.n').value;
    const mean = +tr.querySelector('.mean').value;
    const sd = getSD(tr);
    tr.querySelector('.sd').textContent = sd ? sd.toFixed(4) : '—';
    if (n && mean && sd) groups.push({ n, mean, sd });
  });

  if (groups.length < 2) {
    resultBox.classList.add('hidden');
    plotCurves(groups, null);
    return;
  }

  // Σx / Σx² algorithm
  let N = 0, sumX = 0, sumX2 = 0;
  groups.forEach(({ n, mean, sd }) => {
    const ex = n * mean;
    const ex2 = sd ** 2 * (n - 1) + (ex ** 2) / n;
    N += n;
    sumX += ex;
    sumX2 += ex2;
  });
  const mu = sumX / N;
  const sdCombined = Math.sqrt((sumX2 - (sumX ** 2) / N) / (N - 1));

  totalNEl.textContent = N;
  meanEl.textContent = mu.toFixed(4);
  sdEl.textContent = sdCombined.toFixed(4);

  resultBox.classList.remove('hidden');
  plotCurves(groups, {n: N, mean: mu, sd: sdCombined});
}
