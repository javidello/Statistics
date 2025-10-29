// ==================== Homework 4 — Law of Large Numbers ====================

// --- Simple seeded RNG (LCG) ---
function makeRNG(seed) {
  if (!seed) return { random: () => Math.random() };
  let s = Number(seed) >>> 0 || 1;
  return { random: () => ((s = (1664525 * s + 1013904223) >>> 0) / 4294967296) };
}

// --- Simulate one Bernoulli trajectory ---
function simulateRun(p, n, rng) {
  const freqs = [];
  let successes = 0;
  for (let i = 1; i <= n; i++) {
    if (rng.random() < p) successes++;
    freqs.push(successes / i);
  }
  return freqs;
}

// --- Ensemble simulation (final frequencies) ---
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
  const counts = new Array(bins).fill(0);
  const min = 0, max = 1;
  const width = (max - min) / bins;
  values.forEach(v => {
    const idx = Math.min(bins - 1, Math.floor((v - min) / width));
    counts[idx]++;
  });
  return { counts, width, min };
}

// --- Chart.js instances ---
let trajChart = null;
let histChart = null;
const COLORS = ['#0ea5e9','#f97316','#06b6d4','#7c3aed','#ef4444','#10b981','#f59e0b'];

// --- Initialize empty charts ---
function initCharts() {
  const tctx = document.getElementById('trajCanvas').getContext('2d');
  const hctx = document.getElementById('histCanvas').getContext('2d');

  if (trajChart) trajChart.destroy();
  if (histChart) histChart.destroy();

  trajChart = new Chart(tctx, {
    type: 'line',
    data: { labels: [], datasets: [] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { x: { title: { display: true, text: 'Trial index' } }, y: { min: 0, max: 1, title: { display: true, text: 'Relative frequency' } } },
      plugins: { legend: { position: 'top' } },
      elements: { point: { radius: 0 } }
    }
  });

  histChart = new Chart(hctx, {
    type: 'bar',
    data: { labels: [], datasets: [{ label: 'Count', data: [], backgroundColor: '#0ea5e9' }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true }, x: { title: { display: true, text: 'Final relative frequency (bins)' } } },
      plugins: { legend: { display: false } }
    }
  });
}

// --- Plot trajectory chart ---
function plotTrajectories(trajectories, p) {
  const n = trajectories[0].length;
  const labels = Array.from({length: n}, (_, i) => i + 1);
  const datasets = trajectories.map((traj, idx) => ({
    label: 'Run ' + (idx + 1),
    data: traj,
    borderColor: COLORS[idx % COLORS.length],
    borderWidth: 1.5,
    fill: false,
    tension: 0.12
  }));

  // Theoretical p line
  datasets.push({
    label: 'Theoretical p',
    data: Array(n).fill(p),
    borderColor: '#ef4444',
    borderWidth: 1.5,
    borderDash: [4,4],
    fill: false,
    pointRadius: 0
  });

  trajChart.data.labels = labels;
  trajChart.data.datasets = datasets;
  trajChart.update();
}

// --- Plot histogram ---
function plotHistogram(finals, bins, p) {
  const { counts, width, min } = histogram(finals, bins);
  const labels = counts.map((_, i) => `${(min + i*width).toFixed(2)}–${(min + (i+1)*width).toFixed(2)}`);
  histChart.data.labels = labels;
  histChart.data.datasets[0].data = counts;
  histChart.update();
}

// --- Buttons ---
document.getElementById('runBtn').addEventListener('click', () => {
  const p = parseFloat(document.getElementById('p').value);
  const n = parseInt(document.getElementById('n').value);
  const t = parseInt(document.getElementById('sampleTraj').value);
  const seed = document.getElementById('seed').value;
  if (isNaN(p) || isNaN(n) || isNaN(t)) return alert('Enter valid parameters');

  initCharts();
  const rngFactory = () => makeRNG(seed || Math.floor(Math.random() * 1e9));
  const trajectories = Array.from({length: t}, () => simulateRun(p, n, rngFactory()));
  plotTrajectories(trajectories, p);
});

document.getElementById('ensembleBtn').addEventListener('click', () => {
  const p = parseFloat(document.getElementById('p').value);
  const n = parseInt(document.getElementById('n').value);
  const r = parseInt(document.getElementById('runs').value);
  const seed = document.getElementById('seed').value;
  if (isNaN(p) || isNaN(n) || isNaN(r)) return alert('Enter valid parameters');

  initCharts();
  const rngFactory = () => makeRNG(seed || Math.floor(Math.random() * 1e9));
  const finals = ensembleFinals(p, n, r, rngFactory);
  plotHistogram(finals, 20, p);
});

document.getElementById('clearBtn').addEventListener('click', initCharts);

// Initialize charts on load
initCharts();

