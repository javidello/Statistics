/* script.js — Homework 10
   Discrete approximation of Poisson counting process and plotting (Chart.js)
   Place script.js next to homework10.html and open the HTML file.
*/

(() => {
  // helpers
  function factorial(k) {
    if (k < 0) return NaN;
    let f = 1;
    for (let i = 2; i <= k; i++) f *= i;
    return f;
  }
  function poissonPMF(k, lambdaT) {
    return Math.exp(-lambdaT) * Math.pow(lambdaT, k) / factorial(k);
  }
  function sampleBinomial(n, prob) {
    let cnt = 0;
    for (let i = 0; i < n; i++) if (Math.random() < prob) cnt++;
    return cnt;
  }
  function discreteEventTimes(n, T, prob) {
    const dt = T / n;
    const times = [];
    for (let i = 0; i < n; i++) {
      if (Math.random() < prob) {
        const t = (i + Math.random()) * dt;
        times.push(t);
      }
    }
    return times;
  }

  // Chart instances
  let pathChart = null, histChart = null;

  function initCharts() {
    const pctx = document.getElementById('pathChart').getContext('2d');
    const hctx = document.getElementById('countHist').getContext('2d');
    if (pathChart) pathChart.destroy();
    if (histChart) histChart.destroy();

    pathChart = new Chart(pctx, {
      type: 'line',
      data: { labels: [], datasets: [] },
      options: {
        responsive:true, maintainAspectRatio:false,
        scales:{ x:{ title:{display:true,text:'Time'} }, y:{ title:{display:true,text:'Cumulative count'} } },
        plugins:{ legend:{display:true, position:'top'} },
        elements:{ point:{ radius:0 } }
      }
    });

    histChart = new Chart(hctx, {
      type: 'bar',
      data: { labels: [], datasets: [{ label:'Empirical counts', data: [], backgroundColor:'#0ea5e9' }, { label:'Poisson pmf (scaled)', data: [], type:'line', borderColor:'#ef4444', borderWidth:2, fill:false, order:1 }] },
      options: {
        responsive:true, maintainAspectRatio:false,
        scales:{ x:{ title:{display:true,text:'Event count in [0,T]'} }, y:{ title:{display:true,text:'Frequency / scaled pmf'} } },
        plugins:{ legend:{ position:'top' } }
      }
    });
  }

  function weightedMean(keys, freqs) {
    const total = freqs.reduce((a,b)=>a+b,0);
    if (!total) return NaN;
    let s = 0;
    for (let i = 0; i < keys.length; i++) s += keys[i] * freqs[i];
    return s / total;
  }

  function runSimulation() {
    const T = parseFloat(document.getElementById('T').value) || 1;
    const lambda = parseFloat(document.getElementById('lambda').value) || 1;
    const n = parseInt(document.getElementById('n').value) || 1000;
    const runs = parseInt(document.getElementById('runs').value) || 1000;
    const showPath = parseInt(document.getElementById('showPath').value) || 0;

    if (n <= 0 || runs <= 0 || lambda < 0 || T <= 0) { alert('Enter valid parameters'); return; }

    initCharts();
    const prob = (lambda * T) / n;
    if (prob > 1) { alert('λT / n must be ≤ 1. Increase n or decrease λT.'); return; }

    const counts = new Map();
    const samplePaths = [];

    // run simulation
    for (let r = 0; r < runs; r++) {
      const k = sampleBinomial(n, prob);
      counts.set(k, (counts.get(k) || 0) + 1);
      if (r < showPath) {
        const times = discreteEventTimes(n, T, prob).sort((a,b)=>a-b);
        samplePaths.push(times);
      }
    }

    // histogram arrays
    const keys = Array.from(counts.keys()).sort((a,b)=>a-b);
    const freqs = keys.map(k => counts.get(k));

    histChart.data.labels = keys.map(k => String(k));
    histChart.data.datasets[0].data = freqs;

    // theoretical pmf scaled
    const lambdaT = lambda * T;
    const theo = keys.map(k => poissonPMF(k, lambdaT) * runs);
    histChart.data.datasets[1].data = theo;
    histChart.update();

    // path chart: build stepwise cumulative counts for each sample
    const datasets = samplePaths.map((times, idx) => {
      const gridN = 200;
      const grid = Array.from({length:gridN+1}, (_,i)=> i * (T / gridN));
      const data = [];
      let j = 0;
      for (let t of grid) {
        while (j < times.length && times[j] <= t) j++;
        data.push({x: t, y: j});
      }
      return {
        label: 'Sample ' + (idx+1),
        data: data,
        borderColor: ['#0ea5e9','#f97316','#06b6d4','#7c3aed'][idx % 4],
        fill: false,
        tension: 0.05,
        pointRadius: 0,
      };
    });

    // expected line λ·t
    const gridN = 200;
    const gridLabels = Array.from({length:gridN+1}, (_,i)=> (i*(T/gridN)).toFixed(3));
    const expectedData = Array.from({length:gridN+1}, (_,i) => lambda * (i*(T/gridN)));

    pathChart.data.labels = gridLabels;
    pathChart.data.datasets = [
      { label: 'Expected λ·t', data: expectedData.map((v,i)=>({x: i*(T/gridN), y: v})), borderColor:'#111827', borderDash:[6,4], fill:false, pointRadius:0 },
      ...datasets
    ];
    pathChart.update();

    // load source into viewer
    const srcArea = document.getElementById('sourceArea');
    if (srcArea && (srcArea.textContent.trim() === '' || srcArea.textContent.trim() === 'loading...')) {
      fetch('script.js').then(r=>r.text()).then(txt=>{ srcArea.textContent = txt; }).catch(()=>{});
    }

    console.log('Done. Empirical mean ≈', weightedMean(keys, freqs), 'theoretical λT =', lambdaT);
  }

  // UI wiring
  document.getElementById('runBtn').addEventListener('click', runSimulation);
  document.getElementById('clearBtn').addEventListener('click', ()=> {
    initCharts();
    const srcArea = document.getElementById('sourceArea');
    if (srcArea) srcArea.textContent = 'loading...';
    const block = document.getElementById('codeBlock');
    if (block) block.style.display = 'none';
  });

  document.getElementById('showCodeBtn').addEventListener('click', ()=> {
    const block = document.getElementById('codeBlock');
    const srcArea = document.getElementById('sourceArea');
    if (block.style.display === 'block') { block.style.display = 'none'; block.setAttribute('aria-hidden','true'); return; }
    fetch('script.js').then(r=>r.text()).then(txt=>{ srcArea.textContent = txt; block.style.display='block'; block.setAttribute('aria-hidden','false'); }).catch(()=>{ srcArea.textContent = 'Could not load script.js'; block.style.display='block'; block.setAttribute('aria-hidden','false'); });
  });

  document.addEventListener('DOMContentLoaded', ()=> initCharts());
})();
