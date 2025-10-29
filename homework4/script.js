// ==================== Homework 4 — Law of Large Numbers ====================

// --- Random Generator (seeded if given) ---
function makeRNG(seed) {
  if (!seed) return { random: () => Math.random() };
  let s = Number(seed) >>> 0 || 1;
  return { random: () => ((s = (1664525 * s + 1013904223) >>> 0) / 4294967296) };
}

// --- Simulation of a single trajectory ---
function simulateRun(p, n, rng) {
  const freqs = [];
  let success = 0;
  for (let i = 1; i <= n; i++) {
    if (rng.random() < p) success++;
    freqs.push(success / i);
  }
  return freqs;
}

// --- Ensemble of runs ---
function ensembleFinals(p, n, runs, rngFactory) {
  const finals = [];
  for (let r = 0; r < runs; r++) {
    const freqs = simulateRun(p, n, rngFactory());
    finals.push(freqs[freqs.length - 1]);
  }
  return finals;
}

// --- Histogram helper ---
function histogram(values, bins = 20) {
  const min = 0, max = 1;
  const width = (max - min) / bins;
  const counts = new Array(bins).fill(0);
  for (const v of values) {
    const idx = Math.min(bins - 1, Math.floor((v - min) / width));
    counts[idx]++;
  }
  return { counts, width, min };
}

// --- Charts ---
let trajChart, histChart;
const COLORS = ['#0ea5e9','#f97316','#06b6d4','#7c3aed','#ef4444','#10b981','#f59e0b'];

function initCharts() {
  if (trajChart) trajChart.destroy();
  if (histChart) histChart.destroy();

  trajChart = new Chart(document.getElementById('trajCanvas'), {
    type: 'line',
    data: { labels: [], datasets: [] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { min: 0, max: 1 } },
      plugins: { legend: { position: 'top' } },
      elements: { point: { radius: 0 } }
    }
  });

  histChart = new Chart(document.getElementById('histCanvas'), {
    type: 'bar',
    data: { labels: [], datasets: [{ label: 'Count', data: [] }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } },
      plugins: { legend: { display: false } }
    }
  });
}

function plotTrajectories(trajectories, p) {
  const n = trajectories[0].length;
  const labels = Array.from({length: n}, (_, i) => i + 1);
  const datasets = trajectories.map((t, i) => ({
    label: `Run ${i + 1}`,
    data: t,
    borderColor: COLORS[i % COLORS.length],
    borderWidth: 1.5,
    fill: false,
    tension: 0.12
  }));
  datasets.push({
    label: 'Theoretical p',
    data: Array(n).fill(p),
    borderColor: '#ef4444',
    borderWidth: 1.5,
    borderDash: [4,4],
    pointRadius: 0,
    fill: false
  });
  trajChart.data.labels = labels;
  trajChart.data.datasets = datasets;
  trajChart.update();
}

function plotHistogram(finals, bins, p) {
  const { counts, width, min } = histogram(finals, bins);
  const labels = counts.map((_, i) =>
    `${(min + i*width).toFixed(2)}–${(min + (i+1)*width).toFixed(2)}`
  );
  histChart.data.labels = labels;
  histChart.data.datasets[0].data = counts;
  histChart.update();
  console.log("Theoretical p =", p);
}

// --- Buttons ---
document.getElementById('runBtn').addEventListener('click', () => {
  const p = parseFloat(document.getElementById('p').value);
  const n = parseInt(document.getElementById('n').value);
  const t = parseInt(document.getElementById('sampleTraj').value);
  const seed = document.getElementById('seed').value;
  if (isNaN(p) || isNaN(n) || isNaN(t)) return alert('Enter valid parameters');
  initCharts();
  const rngFactory = () => makeRNG(seed || Math.random()*1e9);
  const trjs = Array.from({length:t}, ()=> simulateRun(p, n, rngFactory()));
  plotTrajectories(trjs, p);
});

document.getElementById('ensembleBtn').addEventListener('click', () => {
  const p = parseFloat(document.getElementById('p').value);
  const n = parseInt(document.getElementById('n').value);
  const r = parseInt(document.getElementById('runs').value);
  const seed = document.getElementById('seed').value;
  if (isNaN(p) || isNaN(n) || isNaN(r)) return alert('Enter valid parameters');
  initCharts();
  const rngFactory = () => makeRNG(seed || Math.random()*1e9);
  const finals = ensembleFinals(p, n, r, rngFactory);
  plotHistogram(finals, 20, p);
});

document.getElementById('clearBtn').addEventListener('click', initCharts);

// initialize charts at start
initCharts();
