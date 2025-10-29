/* script.js — Homework 3 (fixed)
   Place this file at: statisticsblog/homework3/script.js
   This version exposes functions on window right away and logs helpful info.
*/

// -------------------- utilities --------------------
function bigPowMod(base, exp, mod){
  base = BigInt(base) % BigInt(mod);
  exp = BigInt(exp);
  mod = BigInt(mod);
  let result = 1n;
  while(exp > 0n){
    if(exp & 1n) result = (result * base) % mod;
    base = (base * base) % mod;
    exp >>= 1n;
  }
  return result;
}

function egcd(a,b){
  a = BigInt(a); b = BigInt(b);
  if(b === 0n) return {g:a, x:1n, y:0n};
  const {g, x: x1, y: y1} = egcd(b, a % b);
  return { g, x: y1, y: x1 - (a / b) * y1 };
}

function modInv(a, m){
  const res = egcd(a, m);
  if(res.g !== 1n) return null;
  return ((res.x % m) + m) % m;
}

// -------------------- demo primes --------------------
const SMALL_PRIMES = [101n,103n,107n,109n,113n,127n,131n,137n,139n,149n,151n,157n,163n,167n,173n,179n,181n,191n,193n,197n];
function choosePrimes(size){
  if(size === 'medium') return [151n,179n];
  return [103n,107n];
}

// -------------------- english frequencies --------------------
const ENG_FREQ = {
  A:8.167,B:1.492,C:2.782,D:4.253,E:12.702,F:2.228,G:2.015,H:6.094,I:6.966,J:0.153,K:0.772,
  L:4.025,M:2.406,N:6.749,O:7.507,P:1.929,Q:0.095,R:5.987,S:6.327,T:9.056,U:2.758,V:0.978,W:2.360,X:0.150,Y:1.974,Z:0.074
};

// -------------------- RSA state --------------------
let RSA = { p:null, q:null, n:null, phi:null, e:null, d:null };

// safe setter for UI text (if element exists)
function setText(id, text){
  const el = document.getElementById(id);
  if(el) el.textContent = text;
}

// -------------------- main functions --------------------
function generateKeys(){
  try{
    const sizeEl = document.getElementById('primeSize');
    const size = sizeEl ? sizeEl.value : 'small';
    const [p,q] = choosePrimes(size);
    RSA.p = p; RSA.q = q;
    RSA.n = p * q;
    RSA.phi = (p - 1n) * (q - 1n);
    let e = 65537n;
    if(egcd(e, RSA.phi).g !== 1n){
      e = 17n;
      if(egcd(e, RSA.phi).g !== 1n) e = 3n;
    }
    RSA.e = e;
    RSA.d = modInv(RSA.e, RSA.phi);
    setText('keyMeta', `Public key (e,n): (${RSA.e.toString()}, ${RSA.n.toString()}) — private d computed.`);
    console.log('Keys generated', RSA);
    return RSA;
  }catch(err){
    console.error('generateKeys error', err);
    alert('Error generating keys: ' + err);
  }
}
function showKeyInfo(){
  if(!RSA.n){ alert('Keys not generated — click Generate Keys'); return; }
  alert(`p=${RSA.p}\nq=${RSA.q}\nn=${RSA.n}\ne=${RSA.e}\nd=${RSA.d}`);
}

// text/blocks conversions
function textToBlocks(str){
  const codes = [];
  for(let ch of str) codes.push(BigInt(ch.codePointAt(0)));
  return codes;
}
function blocksToText(blocks){
  return blocks.map(b => String.fromCodePoint(Number(b))).join('');
}

// encrypt/decrypt
function encryptBlocks(blocks){
  return blocks.map(m => bigPowMod(m, RSA.e, RSA.n));
}
function decryptBlocks(blocks){
  return blocks.map(c => bigPowMod(c, RSA.d, RSA.n));
}
function blocksToHex(blocks){
  return blocks.map(b => '0x' + (b.toString(16))).join(' ');
}

// UI actions
function encryptMessage(){
  if(!RSA.n){ alert('Generate keys first.'); return; }
  const plain = (document.getElementById('plainInput')||{value:''}).value || '';
  const blocks = textToBlocks(plain);
  const cipher = encryptBlocks(blocks);
  const hex = blocksToHex(cipher);
  const outEl = document.getElementById('cipherOutput');
  if(outEl) outEl.value = hex;
  const plainFreqEl = document.getElementById('plainFreq');
  if(plainFreqEl) plainFreqEl.textContent = freqPrintable(plain);
  console.log('Encrypted', {plain, hex});
}

function decryptWithPrivate(){
  if(!RSA.n){ alert('Generate keys first.'); return; }
  const txt = (document.getElementById('cipherOutput')||{value:''}).value.trim();
  if(!txt){ alert('Nothing to decrypt.'); return; }
  const parts = txt.split(/\s+/).filter(Boolean);
  try{
    const cblocks = parts.map(p => (p.startsWith('0x')||p.startsWith('0X')) ? BigInt(p) : BigInt('0x'+p));
    const mblocks = decryptBlocks(cblocks);
    const plain = blocksToText(mblocks);
    const out = document.getElementById('plainOutput');
    if(out) out.value = plain;
    const plainFreqEl = document.getElementById('plainFreq');
    if(plainFreqEl) plainFreqEl.textContent = freqPrintable(plain);
    console.log('Decrypted with private', plain);
  }catch(err){
    console.error('decryptWithPrivate error', err);
    alert('Error decrypting: ' + err);
  }
}

// statistical decode
function statisticalDecode(){
  if(!RSA.n){ alert('Generate keys first.'); return; }
  const txt = (document.getElementById('cipherOutput')||{value:''}).value.trim();
  if(!txt){ alert('Please encrypt some text first.'); return; }
  const parts = txt.split(/\s+/).filter(Boolean);
  const cblocks = parts.map(p => (p.startsWith('0x')||p.startsWith('0X')) ? BigInt(p) : BigInt('0x'+p));
  const candidatesPerBlock = cblocks.map(c => {
    const candidates = [];
    for(let m=32; m<=126; m++){
      const mBig = BigInt(m);
      const ccalc = bigPowMod(mBig, RSA.e, RSA.n);
      if(ccalc === c) candidates.push(m);
    }
    return candidates;
  });
  const decipherChars = candidatesPerBlock.map(list => {
    if(list.length === 0) return '?';
    let best = list[0], bestScore = -Infinity;
    for(let m of list){
      const ch = String.fromCharCode(m).toUpperCase();
      const score = ENG_FREQ[ch] || 0.001;
      if(score > bestScore){ best = m; bestScore = score; }
    }
    return String.fromCharCode(best);
  });
  const decoded = decipherChars.join('');
  const out = document.getElementById('statDecode');
  if(out) out.value = decoded;
  const decFreq = document.getElementById('decodedFreq');
  if(decFreq) decFreq.textContent = freqPrintable(decoded);
  alert('Statistical decode finished. Check the "Statistical decode" box.');
  console.log('Stat decode result', decoded);
}

// download script helper
function downloadJS(){
  fetch('script.js').then(r=>r.text()).then(text=>{
    const blob = new Blob([text], {type:'text/javascript'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'script.js';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }).catch(e=>alert('Could not download: '+e));
}

// small frequency helper
function freqPrintable(text){
  const counts = {};
  for(let ch of text.toUpperCase()){
    if(ch >= 'A' && ch <= 'Z') counts[ch] = (counts[ch]||0) + 1;
  }
  const entries = Object.keys(counts).sort((a,b)=>counts[b]-counts[a]).map(k=>`${k}: ${counts[k]}`);
  return entries.length ? entries.join('\n') : '(no letters)';
}

// helper to toggle code block (UI)
function toggleCode(){
  const block = document.getElementById('codeBlock');
  const area = document.getElementById('sourceArea');
  if(!block) return;
  if(block.style.display === 'block'){ block.style.display='none'; block.setAttribute('aria-hidden','true'); return; }
  if(area && area.textContent.trim() === 'Loading script.js ...'){
    fetch('script.js').then(r=>r.text()).then(txt=>{ area.textContent = txt; }).catch(e=>{ area.textContent = 'Could not load: '+e; });
  }
  block.style.display='block';
  block.setAttribute('aria-hidden','false');
  window.scrollTo({ top: block.offsetTop - 20, behavior: 'smooth' });
}

// expose functions immediately so onclick handlers work
window.generateKeys = generateKeys;
window.showKeyInfo  = showKeyInfo;
window.encryptMessage = encryptMessage;
window.decryptWithPrivate = decryptWithPrivate;
window.statisticalDecode = statisticalDecode;
window.downloadJS = downloadJS;
window.toggleCode = toggleCode;

// quick init: if elements exist, generate default keys (non-blocking)
try {
  if(typeof document !== 'undefined' && document.readyState !== 'loading'){
    generateKeys();
  } else {
    document.addEventListener('DOMContentLoaded', ()=>{ try{ generateKeys(); }catch(e){console.warn(e);} });
  }
} catch(e){
  console.warn('init error', e);
}

