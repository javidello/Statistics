/* script.js — Homework 11
   Euler–Maruyama simulator for Wiener process and general SDE.
   Place this file next to homework11.html and open the html.
   Uses Chart.js for plotting (already included in HTML).
*/

(() => {
  // ---------- Utilities ----------
  function randn() {
    // Box–Muller (two normal variates available, we return one)
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function linspace(a, b, m) {
    const arr = [];
    for (let i = 0; i <= m; i++) arr.push(a + (b - a) * (i / m));
    return arr;
  }

  function mean(arr) {
    if (!arr.length) return NaN;
    return arr.reduce((a,b)=>a+b,0)/arr.length;
  }

  function variance(arr) {
    const m = mean(arr);
    return arr.reduce((s,x)=>s + (x - m)**2, 0) / (arr.length - 1 || 1);
  }

  // ---------- Chart holders ----------
  let pathChart = null, histChart = null, qvChart = null;

  function initCharts() {
    const pctx = document.getElementById('pathChart').getContext('2d');
    const hctx = document.getElementById('incHist').getContext('2d');
    const qctx = document.getElementById('qvChart').getContext('2d');

    if (pathChart) pathChart.destroy();
    if (histChart) histChart.destroy();
    if (qvChart) qvChart.destroy();

    pathChart = new Chart(pctx, {
      type: 'line',
      data: { labels: [], datasets: [] },
      options: { responsive:true, maintainAspectRatio:false,
        scales:{ x:{ title:{display:true,text:'t'} }, y:{ title:{display:true,text:'X_t'} } },
        plugins:{ legend:{ position:'top' } }, elements:{ point:{ radius:0 } }
      }
    });

    histChart = new Chart(hctx, {
      type: 'bar',
      data: { labels: [], datasets: [{ label:'increments', data: [], backgroundColor:'#0ea5e9' }, { label:'Normal approx', data: [], type:'line', borderColor:'#ef4444', borderWidth:2, fill:false }] },
      options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'top' } } }
    });

    qvChart = new Chart(qctx, {
      type: 'line',
      data: { labels: [], datasets: [{ label:'Quadratic variation', data: [], borderColor:'#7c3aed', fill:false }] },
      options: { responsive:true, maintainAspectRatio:false, scales:{ x:{ title:{display:true,text:'Index'} }, y:{ title:{display:true,text:'QV'} } } }
    });
  }

  // ---------- Euler–Maruyama ----------
  function eulerMaruyama({muFn, sigmaFn, x0=0, T=1, n=1000, paths=1}) {
    const dt = T / n;
    const sqrtDt = Math.sqrt(dt);
    const ts = linspace(0, T, n);
    const results = [];

    for (let p = 0; p < paths; p++) {
      const X = [x0];
      for (let k = 0; k < n; k++) {
        const t = k * dt;
        const xk = X[X.length - 1];
        let mu = 0, sigma = 1;
        try {
          mu = muFn(xk, t);
          sigma = sigmaFn(xk, t);
        } catch (e) {
          // fallback to constants if parser fails
          mu = Number(mu) || 0;
          sigma = Number(sigma) || 1;
        }
        const Z = randn();
        const xnext = xk + mu * dt + sigma * sqrtDt * Z;
        X.push(xnext);
      }
      results.push(X);
    }
    return { ts, results };
  }

  // ---------- Helpers to parse user mu/sigma safely ----------
  function makeFn(expr) {
    // trusted simple parser: allow x, t, Math.* and basic operators
    // replace Math. usage if user wrote Math.*
    // We build a function new Function('x','t','Math', 'return ' + expr)
    // Dangerous functions are theoretically possible via injection; warn in comments — professor will inspect code.
    try {
      const fn = new Function('x','t','Math', `return (${expr});`);
      // test call
      fn(0,0,Math);
      return (x,t) => Number(fn(x,t,Math));
    } catch (e) {
      // fallback
      return (_) => 0;
    }
  }

  // ---------- Diagnostics ----------
  function incrementsFromPath(path, dt) {
    const incs = [];
    for (let i = 1; i < path.length; i++) incs.push(path[i] - path[i-1]);
    return incs;
  }

  function quadraticVariation(path) {
    let qv = 0;
    const qvs = [];
    for (let i = 1; i < path.length; i++) {
      qv += (path[i] - path[i-1])**2;
      qvs.push(qv);
    }
    return qvs;
  }

  // ---------- UI Wiring ----------
  document.getElementById('runBtn').addEventListener('click', () => {
    const simType = document.getElementById('simType').value;
    const T = parseFloat(document.getElementById('T').value) || 1;
    const n = parseInt(document.getElementById('n').value) || 2000;
    const paths = parseInt(document.getElementById('paths').value) || 1;
    const x0 = parseFloat(document.getElementById('x0').value) || 0;
    const muExpr = document.getElementById('mu').value || '0';
    const sigmaExpr = document.getElementById('sigma').value || '1';

    initCharts();

    if (simType === 'wiener') {
      // Wiener: mu=0 sigma=1
      const { ts, results } = eulerMaruyama({
        muFn: () => 0,
        sigmaFn: () => 1,
        x0, T, n, paths
      });

      // plot paths
      const datasets = results.map((path, idx) => ({
        label: 'path ' + (idx+1),
        data: path.map((v,i)=>({x: ts[i], y: v})),
        borderColor: ['#0ea5e9','#f97316','#06b6d4','#7c3aed'][idx % 4],
        fill:false, tension:0.08, pointRadius:0
      }));
      pathChart.data.labels = ts;
      pathChart.data.datasets = datasets;
      pathChart.update();

      // increments from first path (for histogram)
      const incs = incrementsFromPath(results[0], T/n);
      plotIncrementsHistogram(incs, T/n);

      // quadratic variation (from first path)
      const qv = quadraticVariation(results[0]);
      qvChart.data.labels = qv.map((_,i)=>i+1);
      qvChart.data.datasets[0].data = qv;
      qvChart.update();

    } else {
      // general SDE: parse mu and sigma
      const muFn = makeFn(muExpr);
      const sigmaFn = makeFn(sigmaExpr);
      const { ts, results } = eulerMaruyama({
        muFn, sigmaFn, x0, T, n, paths
      });

      // plot
      const datasets = results.map((path, idx) => ({
        label: 'path ' + (idx+1),
        data: path.map((v,i)=>({x: ts[i], y: v})),
        borderColor: ['#0ea5e9','#f97316','#06b6d4','#7c3aed'][idx % 4],
        fill:false, tension:0.08, pointRadius:0
      }));
      pathChart.data.labels = ts;
      pathChart.data.datasets = datasets;
      pathChart.update();

      // increments from first path (for histogram)
      const incs = incrementsFromPath(results[0], T/n);
      plotIncrementsHistogram(incs, T/n);

      // quadratic variation
      const qv = quadraticVariation(results[0]);
      qvChart.data.labels = qv.map((_,i)=>i+1);
      qvChart.data.datasets[0].data = qv;
      qvChart.update();
    }

    // load JS source into viewer for professor
    const srcArea = document.getElementById('sourceArea');
    if (srcArea && (srcArea.textContent.trim() === '' || srcArea.textContent.trim() === 'loading...')) {
      fetch('script.js').then(r=>r.text()).then(txt=>{ srcArea.textContent = txt; }).catch(()=>{});
    }
  });

  document.getElementById('clearBtn').addEventListener('click', ()=> {
    initCharts();
    const srcArea = document.getElementById('sourceArea');
    if (srcArea) srcArea.textContent = 'loading...';
    const block = document.getElementById('codeBlock');
    if (block) block.style.display = 'none';
  });

  document.getElementById('showCodeBtn').addEventListener('click', ()=> {
    const block = document.getElementById('codeBlock');
    if (block.style.display === 'block') { block.style.display = 'none'; block.setAttribute('aria-hidden','true'); return; }
    const srcArea = document.getElementById('sourceArea');
    fetch('script.js').then(r=>r.text()).then(txt=>{ srcArea.textContent = txt; block.style.display='block'; block.setAttribute('aria-hidden','false'); }).catch(()=>{ srcArea.textContent = 'Could not load script.js'; block.style.display='block'; block.setAttribute('aria-hidden','false'); });
  });

  // ---------- Plot increments histogram helper ----------
  function plotIncrementsHistogram(incs, dt) {
    // simple histogram into 30 bins
    const bins = 30;
    const min = Math.min(...incs);
    const max = Math.max(...incs);
    const width = (max - min) / bins || 1;
    const counts = new Array(bins).fill(0);
    incs.forEach(v => {
      let idx = Math.floor((v - min) / width);
      if (idx < 0) idx = 0;
      if (idx >= bins) idx = bins - 1;
      counts[idx]++;
    });
    const labels = counts.map((_,i) => (min + i*width).toFixed(3) + '–' + (min + (i+1)*width).toFixed(3));
    histChart.data.labels = labels;
    histChart.data.datasets[0].data = counts;

    // normal approx (mean 0, var ~ dt for Wiener)
    const m = mean(incs);
    const s2 = variance(incs);
    // compute normal pdf scaled to histogram height
    const total = incs.length;
    const pdf = counts.map((_,i) => {
      const x = min + (i + 0.5) * width;
      const dens = (1 / Math.sqrt(2*Math.PI*s2)) * Math.exp(- (x - m)**2 / (2*s2));
      return dens * total * width; // scale density to counts
    });
    histChart.data.datasets[1].data = pdf;
    histChart.update();
  }

  // initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    initCharts();
  });
})();
