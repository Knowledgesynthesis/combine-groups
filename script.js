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
  const get = (cls) => +tr.querySelector('.' + cls)?.value;

  switch (dtype) {
    case 'SD':
      return get('sdin') || undefined;
    case 'SE':
      return (get('sein') || 0) * Math.sqrt(n);
    case 'CI':
      const ll = get('ll'), ul = get('ul');
      return ll && ul ? ((ul - ll) / 3.92) * Math.sqrt(n) : undefined;
    case 'Range':
      const min = get('min'), max = get('max');
      if (!(min && max)) return undefined;
      return (max - min) / (n <= 70 ? 4 : 6);
    case 'IQR':
      const q1 = get('q1'), q3 = get('q3');
      return q1 && q3 ? (q3 - q1) / 1.35 : undefined;
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
}
