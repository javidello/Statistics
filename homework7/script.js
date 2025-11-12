// homework7/script.js
// Simulation for Homework 7: server security random-walk and binomial comparison
(() => {
  // helpers
  function chooseRandom() { return Math.random(); }
  function binomialPMF(n, k, q) {
    // compute C(n,k) q^k (1-q)^(n-k) safely
    function comb(n,k) {
      if (k < 0 || k > n) return 0;
      k = Math.min(k, n - k);
      let num = 1, den = 1;
      for (let i = 0; i < k; i++) {
        num *= (n - i);
        den *= (i + 1);
      }
      return num / den;
    }
    return comb(n,k) * Math.pow(q,k) * Math.pow(1-q, n-k);
  }

  // simulation core
  function simulateOne(n, m, p) {
    // weekly breach prob q
    const q = 1 - Math.pow(1 - p, m);
    let S = 0;
    for (let i = 0; i < n; i++) {
      const breached = (Math.random() < q);
      S += breached ? -1 : 1;
    }
    return S;
  }

  function runSimulation(n, m, p, trials, showTraj) {
    const q = 1 - Math.pow(1 - p, m);
    // container for final scores counts
    const counts = new Map();
    // optional sample trajectories
    const sampleTrajectories = [];
    for (let t = 0; t < trials; t++) {
      let S = 0;
      let traj = [];
      for (let i = 0; i < n; i++) {
        const breached = (Math.random() < q);
        S += breached ? -1 : 1;
        if (t < showTraj) traj.push(S);
      }
      counts.set(S, (counts.get(S) || 0) + 1);
      if (t < showTraj) sampleTrajectories.push(traj);
    }
    return { counts, sampleTrajectories, q };
  }

  // convert counts map to arrays for plotting
  function countsToArrays(counts) {
    const keys = Array.from(counts.keys()).sort((a,b)=>a-b);
    const values = keys.map(k => counts.get(k));
    return { keys, values };
  }

  // chart setup (Chart.js)
  let trajChart = null, histChart = null;
  function initCharts() {
    const tctx = document.getElementById('trajChart').getContext('2d');
    const hctx = document.getElementById('histChart').getContext('2d');
    if (trajChart) trajChart.destroy();
    if (histChart) histChart.destroy();

    trajChart = new Chart(tctx, {
      type: 'line',
      data: { labels: [], datasets: [] },
      options: {
        responsive:true, maintainAspectRatio:false,
        scales:{ x:{ title:{display:true, text:'Week'} }, y:{ title:{display:true,text:'Cumulative score S'} } },
        plugins:{ legend:{display:true, position:'top'} },
        elements:{ point:{ radius:0 } }
      }
    });

    histChart = new Chart(hctx, {
      type: 'bar',
      data: { labels: [], datasets: [{ label: 'Empirical counts', data: [], backgroundColor:'#0ea5e9' }, { label: 'Theoretical (binomial)', data: [], type:'line', borderColor:'#ef4444', borderWidth:2, fill:false, order:1 }] },
      options: {
        responsive:true, maintainAspectRatio:false,
        scales:{ x:{ title:{display:true,text:'Final score S'} }, y:{ title:{display:true,text:'Count'} } },
        plugins:{ legend:{position:'top'} }
      }
    });
  }

  // plot trajectories (sample)
  function plotTrajectories(sampleTrajectories) {
    const datasets = sampleTrajectories.map((traj, idx) => ({
      label: 'Sample ' + (idx+1),
      data: traj,
      borderColor: ['#0ea5e9','#f97316','#06b6d4','#7c3aed','#ef4444','#10b981'][idx % 6],
      fill: false,
      tension: 0.12
    }));
    const n = sampleTrajectories.length ? sampleTrajectories[0].length : 0;
    const labels = Array.from({length:n}, (_,i)=>i+1);
    trajChart.data.labels = labels;
    trajChart.data.datasets = datasets;
    trajChart.update();
  }

  // plot histogram with theoretical overlay
  function plotHistogram(counts, n, q, trials) {
    const { keys, values } = countsToArrays(counts);
    // labels are S values
    histChart.data.labels = keys.map(k=>String(k));
    histChart.data.datasets[0].data = values;
    // compute theoretical probabilities for each key: k breaches => S = n-2k
    const theo = keys.map(S => {
      const breaches = (n - S) / 2;
      if (!Number.isInteger(breaches) || breaches < 0 || breaches > n) return 0;
      return binomialPMF(n, breaches, q) * trials;
    });
    histChart.data.datasets[1].data = theo;
    histChart.update();
  }

  // wire UI
  document.getElementById('runSim').addEventListener('click', ()=> {
    const n = parseInt(document.getElementById('n').value);
    const m = parseInt(document.getElementById('m').value);
    const p = parseFloat(document.getElementById('p').value);
    const trials = parseInt(document.getElementById('trials').value);
    const showTraj = parseInt(document.getElementById('showTraj').value);
    if (isNaN(n)||isNaN(m)||isNaN(p)||isNaN(trials)||n<=0||m<=0||p<0||p>1) { alert('Please enter valid parameters'); return; }
    initCharts();
    const res = runSimulation(n,m,p,trials,showTraj);
    plotTrajectories(res.sampleTrajectories);
    plotHistogram(res.counts, n, res.q, trials);
  });

  document.getElementById('clearSim').addEventListener('click', ()=> {
    initCharts();
  });

  document.getElementById('showCode').addEventListener('click', ()=> {
    const block = document.getElementById('codeBlock');
    const src = document.getElementById('srcArea');
    if (block.style.display === 'block') { block.style.display='none'; return; }
    fetch('script.js').then(r=>r.text()).then(txt=>{ src.textContent = txt; block.style.display = 'block'; }).catch(()=>{ src.textContent = 'Could not load source'; block.style.display='block'; });
  });

  // initialize charts on load
  document.addEventListener('DOMContentLoaded', ()=> {
    initCharts();
  });

})();
