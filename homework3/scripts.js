/* script.js — Simple, reliable RSA demo for Homework 3
   - Uses fixed small primes (p=61, q=53) so key generation always works
   - Exposes functions used by homework3.html:
       generateKeys(), showKeyInfo(), encryptMessage(), decryptWithPrivate(), statisticalDecode(), downloadJS(), toggleCode()
   Place this file at: statisticsblog/homework3/script.js
*/

// ---------- Utilities (BigInt-safe) ----------
function bigPowMod(base, exp, mod) {
  base = BigInt(base) % BigInt(mod);
  exp = BigInt(exp);
  mod = BigInt(mod);
  let res = 1n;
  while (exp > 0n) {
    if (exp & 1n) res = (res * base) % mod;
    base = (base * base) % mod;
    exp >>= 1n;
  }
  return res;
}

function egcd(a, b) {
  a = BigInt(a); b = BigInt(b);
  if (b === 0n) return { g: a, x: 1n, y: 0n };
  const { g, x: x1, y: y1 } = egcd(b, a % b);
  return { g, x: y1, y: x1 - (a / b) * y1 };
}

function modInv(a, m) {
  const res = egcd(a, m);
  if (res.g !== 1n) return null;
  return ((res.x % m) + m) % m;
}

// ---------- English letter frequency (for statistical tie-breaking) ----------
const ENG_FREQ = {
  A:8.167,B:1.492,C:2.782,D:4.253,E:12.702,F:2.228,G:2.015,H:6.094,I:6.966,J:0.153,K:0.772,
  L:4.025,M:2.406,N:6.749,O:7.507,P:1.929,Q:0.095,R:5.987,S:6.327,T:9.056,U:2.758,V:0.978,W:2.360,X:0.150,Y:1.974,Z:0.074
};

// ---------- Simple fixed RSA keys (works every run) ----------
let RSA = {
  p: 61n,
  q: 53n,
  n: null,
  phi: null,
  e: null,
  d: null
};

function initFixedKeys() {
  RSA.n = RSA.p * RSA.q;                  // 61 * 53 = 3233
  RSA.phi = (RSA.p - 1n) * (RSA.q - 1n);  // 60 * 52 = 3120
  // choose e that is coprime with phi (17 works here)
  RSA.e = 17n;
  RSA.d = modInv(RSA.e, RSA.phi);        // should be 2753
}

// ---------- Safe UI text helper ----------
function setText(id, txt) {
  const el = document.getElementById(id);
  if (el) el.textContent = txt;
}
function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

// ---------- Exposed functions (called by HTML buttons) ----------
function generateKeys(){
  try {
    initFixedKeys();
    setText('keyMeta', `Public key (e,n): (${RSA.e.toString()}, ${RSA.n.toString()}) — private d computed.`);
    console.log('RSA ready', RSA);
    return RSA;
  } catch (err) {
    console.error('generateKeys error', err);
    alert('Error generating keys: ' + err);
  }
}

function showKeyInfo(){
  if(!RSA.n){ alert('Keys not generated — click Generate Keys'); return; }
  alert(`p=${RSA.p}\nq=${RSA.q}\nn=${RSA.n}\ne=${RSA.e}\nd=${RSA.d}`);
}

// convert text -> numeric blocks (per-character)
function textToBlocks(str){
  const arr = [];
  for(const ch of str) arr.push(BigInt(ch.codePointAt(0)));
  return arr;
}
function blocksToText(arr){
  return arr.map(b => String.fromCodePoint(Number(b))).join('');
}
function blocksToHex(arr){
  return arr.map(b => '0x' + b.toString(16)).join(' ');
}

// encrypt / decrypt using RSA state
function encryptBlocks(blocks){
  return blocks.map(m => bigPowMod(m, RSA.e, RSA.n));
}
function decryptBlocks(blocks){
  return blocks.map(c => bigPowMod(c, RSA.d, RSA.n));
}

// UI actions
function encryptMessage(){
  if(!RSA.n){ alert('Generate keys first.'); return; }
  const plain = (document.getElementById('plainInput')||{value:''}).value || '';
  const blocks = textToBlocks(plain);
  const cipher = encryptBlocks(blocks);
  setValue('cipherOutput', blocksToHex(cipher));
  setValue('plainOutput', '');
  const freq = freqPrintable(plain);
  setText('plainFreq', freq);
  console.log('Encrypted:', cipher);
}

function decryptWithPrivate(){
  if(!RSA.n){ alert('Generate keys first.'); return; }
  const txt = (document.getElementById('cipherOutput')||{value:''}).value.trim();
  if(!txt){ alert('Nothing to decrypt.'); return; }
  try {
    const parts = txt.split(/\s+/).filter(Boolean);
    const cblocks = parts.map(p => p.startsWith('0x')||p.startsWith('0X') ? BigInt(p) : BigInt('0x'+p));
    const mblocks = decryptBlocks(cblocks);
    const plain = blocksToText(mblocks);
    setValue('plainOutput', plain);
    setText('plainFreq', freqPrintable(plain));
    console.log('Decrypted (private):', plain);
  } catch(err) {
    console.error('decryptWithPrivate error', err);
    alert('Error decrypting: ' + err);
  }
}

// Statistical decode (reference distribution)
function statisticalDecode(){
  if(!RSA.n){ alert('Generate keys first.'); return; }
  const txt = (document.getElementById('cipherOutput')||{value:''}).value.trim();
  if(!txt){ alert('Please encrypt some text first.'); return; }
  const parts = txt.split(/\s+/).filter(Boolean);
  const cblocks = parts.map(p => p.startsWith('0x')||p.startsWith('0X') ? BigInt(p) : BigInt('0x'+p));

  const candidatesPerBlock = cblocks.map(c => {
    const list = [];
    // printable ASCII 32..126
    for(let m=32; m<=126; m++){
      const mm = BigInt(m);
      const ccalc = bigPowMod(mm, RSA.e, RSA.n);
      if(ccalc === c) list.push(m);
    }
    return list;
  });

  const resultChars = candidatesPerBlock.map(list => {
    if(list.length === 0) return '?';
    // choose candidate with best ENG_FREQ score (letters get weights)
    let best = list[0], bestScore = -Infinity;
    for(const m of list){
      const ch = String.fromCharCode(m).toUpperCase();
      const score = ENG_FREQ[ch] || 0.001;
      if(score > bestScore){ best = m; bestScore = score; }
    }
    return String.fromCharCode(best);
  });

  const decoded = resultChars.join('');
  setValue('statDecode', decoded);
  setText('decodedFreq', freqPrintable(decoded));
  alert('Statistical decode complete — check "Statistical decode" box.');
  console.log('Stat decode:', decoded);
}

// helper: freq of letters
function freqPrintable(text){
  const counts = {};
  for(const c of String(text||'').toUpperCase()){
    if(c >= 'A' && c <= 'Z') counts[c] = (counts[c]||0) + 1;
  }
  return Object.keys(counts).length ? Object.keys(counts).sort((a,b)=>counts[b]-counts[a]).map(k=>`${k}: ${counts[k]}`).join('\n') : '(no letters)';
}

// helper: download script
function downloadJS(){
  fetch('script.js').then(r=>r.text()).then(text=>{
    const blob = new Blob([text], {type:'text/javascript'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'script.js';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }).catch(e => alert('Could not download: ' + e));
}

// helper: toggle code block in page
function toggleCode(){
  const block = document.getElementById('codeBlock');
  const area = document.getElementById('sourceArea');
  if(!block) return;
  if(block.style.display === 'block'){ block.style.display = 'none'; block.setAttribute('aria-hidden','true'); return; }
  if(area && area.textContent.trim() === 'Loading script.js ...'){
    fetch('script.js').then(r=>r.text()).then(txt=>{ area.textContent = txt; }).catch(e=>{ area.textContent = 'Could not load: ' + e; });
  }
  block.style.display = 'block';
  block.setAttribute('aria-hidden','false');
  window.scrollTo({ top: block.offsetTop - 20, behavior: 'smooth' });
}

// expose functions for HTML onclick handlers
window.generateKeys = generateKeys;
window.showKeyInfo = showKeyInfo;
window.encryptMessage = encryptMessage;
window.decryptWithPrivate = decryptWithPrivate;
window.statisticalDecode = statisticalDecode;
window.downloadJS = downloadJS;
window.toggleCode = toggleCode;

// initialize keys on load
try {
  if (typeof document !== 'undefined' && document.readyState !== 'loading') generateKeys();
  else document.addEventListener('DOMContentLoaded', generateKeys);
} catch (e) {
  console.warn('init failed', e);
}

