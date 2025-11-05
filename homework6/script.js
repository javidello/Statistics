/* script.js — Homework 6: online mean & variance (Welford)
   Place this file in: statisticsblog/homework6/script.js
   This script exposes interactive controls used by homework6.html
*/

(() => {
  // --- State for online algorithm (Welford) ---
  let n = 0;
  let mean = 0.0;
  let M2 = 0.0;

  // full-data array for batch comparison
  let data = [];

  // --- Helpers ---
  function resetState() {
    n = 0; mean = 0.0; M2 = 0.0; data = [];
    updateUI();
  }

  function addValue(x) {
    // convert to number, ignore NaN
    const xv = Number(x);
    if (!Number.isFinite(xv)) return false;
    // update Welford
    n += 1;
    const delta = xv - mean;
    mean += delta / n;
    const delta2 = xv - mean;
    M2 += delta * delta2;
    // update data (for batch comparison)
    data.push(xv);
    updateUI();
    return true;
  }

  function loadValuesFromText(text, append = false) {
    // parse numbers separated by comma, space, newline
    const tokens = text.split(/[\s,;]+/).filter(t => t.trim().length > 0);
    const nums = tokens.map(t => Number(t)).filter(v => Number.isFinite(v));
    if (!append) { n = 0; mean = 0.0; M2 = 0.0; data = []; }
    for (const x of nums) addValue(x);
    return nums.length;
  }

  // batch computation for comparison
  function batchStats(arr) {
    const nB = arr.length;
    if (nB === 0) return { n: 0, mean: NaN, sampleVar: NaN };
    const meanB = arr.reduce((a,b) => a + b, 0) / nB;
    const ssum = arr.reduce((a,b) => a + (b - meanB) * (b - meanB), 0);
    const sampleVar = nB > 1 ? ssum / (nB - 1) : NaN;
    return { n: nB, mean: meanB, sampleVar: sampleVar };
  }

  // UI update
  function updateUI() {
    // online
    document.getElementById('onlineCount').textContent = 'n: ' + n;
    document.getElementById('onlineMean').textContent = 'mean: ' + (n ? mean.toPrecision(8) : '—');
    document.getElementById('onlineM2').textContent = 'M2: ' + (n ? M2.toPrecision(8) : '—');
    document.getElementById('onlineVar').textContent = 'sample var (s²): ' + (n > 1 ? (M2 / (n - 1)).toPrecision(8) : '—');

    // batch
    const bs = batchStats(data);
    document.getElementById('batchCount').textContent = 'n: ' + bs.n;
    document.getElementById('batchMean').textContent = 'mean: ' + (bs.n ? bs.mean.toPrecision(8) : '—');
    document.getElementById('batchVar').textContent = 'sample var (s²): ' + (Number.isFinite(bs.sampleVar) ? bs.sampleVar.toPrecision(8) : '—');
    document.getElementById('dataPreview').textContent = (data.length ? ('[' + data.slice(-20).join(', ') + (data.length > 20 ? ' …' : '') + ']') : '(no data)');

    // show code if not loaded yet (fetch)
    const srcArea = document.getElementById('sourceArea');
    if (srcArea && (srcArea.textContent.trim() === 'Loading script...' || srcArea.textContent.trim() === '')) {
      // fetch the script itself (same folder)
      fetch('script.js').then(r => r.text()).then(txt => { srcArea.textContent = txt; }).catch(()=>{ /* ignore */ });
    }
  }

  // --- Event handlers wiring ---
  document.addEventListener('DOMContentLoaded', () => {
    // elements
    const dataInput = document.getElementById('dataInput');
    document.getElementById('loadBtn').addEventListener('click', () => {
      const text = (dataInput.value || '').trim();
      if (!text) { resetState(); return; }
      loadValuesFromText(text, false);
    });
    document.getElementById('appendBtn').addEventListener('click', () => {
      const text = (dataInput.value || '').trim();
      if (!text) return;
      loadValuesFromText(text, true);
      dataInput.value = ''; // clear input for convenience
    });
    document.getElementById('randomBtn').addEventListener('click', () => {
      // add a random value from N(0,1) using Box-Muller
      const u1 = Math.random(), u2 = Math.random();
      const z0 = Math.sqrt(-2*Math.log(u1)) * Math.cos(2*Math.PI*u2);
      addValue(z0);
    });
    document.getElementById('clearBtn').addEventListener('click', () => {
      resetState();
      document.getElementById('dataInput').value = '';
    });

    document.getElementById('showCodeBtn').addEventListener('click', () => {
      const block = document.getElementById('codeBlock');
      if (block.style.display === 'block') { block.style.display = 'none'; block.setAttribute('aria-hidden','true'); return; }
      // ensure code shown
      const srcArea = document.getElementById('sourceArea');
      if (srcArea && (srcArea.textContent.trim() === 'Loading script...' || srcArea.textContent.trim() === '')) {
        fetch('script.js').then(r => r.text()).then(txt => { srcArea.textContent = txt; block.style.display = 'block'; block.setAttribute('aria-hidden','false'); }).catch(()=>{ block.style.display='block'; block.setAttribute('aria-hidden','false'); });
      } else { block.style.display = 'block'; block.setAttribute('aria-hidden','false'); }
    });

    // initialize UI
    resetState();
  });

  // expose for console testing (optional)
  window._welford = {
    addValue: addValue,
    resetState: resetState,
    getState: () => ({ n, mean, M2, sampleVar: (n>1?M2/(n-1):NaN), data: data.slice() })
  };
})();
