/* script.js
   Homework 3 — RSA demo + statistical decode using reference (English) distribution
   Place this file in: statisticsblog/homework3/script.js
*/

// -------------------- utilities: bigint powmod, egcd, modinv --------------------
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
  const {g,x} = egcd(a, m);
  if(g !== 1n) return null;
  return ((x % m) + m) % m;
}

// -------------------- small primes for demo --------------------
const SMALL_PRIMES = [
  101n, 103n, 107n, 109n, 113n, 127n, 131n, 137n, 139n, 149n,
  151n, 157n, 163n, 167n, 173n, 179n, 181n, 191n, 193n, 197n
];

// choose primes quickly (not cryptographically secure)
function choosePrimes(size){
  if(size === 'medium'){
    // use slightly larger primes (from the same list but more spaced)
    return [ 151n, 179n ];
  }
  // default small
  return [103n, 107n];
}

// -------------------- language frequencies (English, uppercase) --------------------
const ENG_FREQ = {
  A:8.167,B:1.492,C:2.782,D:4.253,E:12.702,F:2.228,G:2.015,H:6.094,I:6.966,J:0.153,K:0.772,
  L:4.025,M:2.406,N:6.749,O:7.507,P:1.929,Q:0.095,R:5.987,S:6.327,T:9.056,U:2.758,V:0.978,W:2.360,X:0.150,Y:1.974,Z:0.074
};

// -------------------- key storage --------------------
let RSA = {
  p: null, q: null, n: null, phi: null, e: null, d: null
};

function generateKeys(){
  const size = document.getElementById('primeSize').value;
  const [p,q] = choosePrimes(size);
  RSA.p = p; RSA.q = q;
  RSA.n = p * q;
  RSA.phi = (p - 1n) * (q - 1n);
  // choose e small and coprime to phi
  let e = 65537n;
  // if not coprime, choose fallback
  if(egcd(e, RSA.phi).g !== 1n){
    e = 17n;
    if(egcd(e, RSA.phi).g !== 1n) e = 3n;
  }
  RSA.e = e;
  RSA.d = modInv(RSA.e, RSA.phi);
  // update UI
  document.getElementById('keyMeta').textContent = `Public key (e,n): (${RSA.e.toString()}, ${RSA.n.toString()}) — private d computed.`;
  return RSA;
}

function showKeyInfo(){
  if(!RSA.n) { alert('Keys not generated — click Generate Keys'); return; }
  alert(`p=${RSA.p}\nq=${RSA.q}\nn=${RSA.n}\ne=${RSA.e}\nd=${RSA.d}`);
}

// -------------------- text ↔ blocks (per-character) --------------------
function textToBlocks(str){
  // convert each character to its char code (0..65535 technically, but we keep basic ASCII)
  const codes = [];
  for(let ch of str){
    codes.push(BigInt(ch.codePointAt(0)));
  }
  return codes;
}

function blocksToText(blocks){
  return blocks.map(b => String.fromCodePoint(Number(b))).join('');
}

// -------------------- encryption / decryption --------------------
function encryptBlocks(blocks){
  // c = m^e mod n (per block)
  return blocks.map(m => bigPowMod(m, RSA.e, RSA.n));
}

function decryptBlocks(blocks){
  // m = c^d mod n
  return blocks.map(c => bigPowMod(c, RSA.d, RSA.n));
}

// helper to hex string for display
function blocksToHex(blocks){
  return blocks.map(b => '0x' + (b.toString(16))).join(' ');
}

// -------------------- UI actions --------------------
function encryptMessage(){
  if(!RSA.n) { alert('Generate keys first.'); return; }
  const plain = document.getElementById('plainInput').value || '';
  const blocks = textToBlocks(plain);
  const cipher = encryptBlocks(blocks);
  document.getElementById('cipherOutput').value = blocksToHex(cipher);
  document.getElementById('plainOutput').value = '';
  // update plain frequency
  document.getElementById('plainFreq').textContent = freqPrintable(plain);
}

function decryptWithPrivate(){
  if(!RSA.n) { alert('Generate keys first.'); return; }
  const cipherText = document.getElementById('cipherOutput').value.trim();
  if(!cipherText){ alert('Nothing to decrypt.'); return; }
  // parse hex blocks back to BigInt (allow spaces)
  const parts = cipherText.split(/\s+/).filter(Boolean);
  const cblocks = parts.map(p => {
    if(p.startsWith('0x')||p.startsWith('0X')) return BigInt(p);
    return BigInt('0x' + p);
  });
  const mblocks = decryptBlocks(cblocks);
  const plain = blocksToText(mblocks);
  document.getElementById('plainOutput').value = plain;
  document.getElementById('plainFreq').textContent = freqPrintable(plain);
}

// -------------------- statistical decode (reference distribution) --------------------
function statisticalDecode(){
  if(!RSA.n){ alert('Generate keys first.'); return; }
  const cipherText = document.getElementById('cipherOutput').value.trim();
  if(!cipherText){ alert('Please encrypt some text first.'); return; }
  const parts = cipherText.split(/\s+/).filter(Boolean);
  const cblocks = parts.map(p => (p.startsWith('0x')||p.startsWith('0X')) ? BigInt(p) : BigInt('0x'+p));
  // For each ciphertext block, find candidate m in printable ASCII range:
  const candidatesPerBlock = cblocks.map(c => {
    const candidates = [];
    // printable ASCII range 32..126 (you can widen if you want)
    for(let m=32; m<=126; m++){
      const mBig = BigInt(m);
      const ccalc = bigPowMod(mBig, RSA.e, RSA.n);
      if(ccalc === c) candidates.push(m);
    }
    return candidates;
  });

  // For each block choose candidate with highest ENG_FREQ score, else mark '?'
  const decipherChars = candidatesPerBlock.map(list => {
    if(list.length === 0) return '?';
    // choose candidate with highest English freq score (letters higher weight)
    let best = list[0];
    let bestScore = -Infinity;
    for(let m of list){
      const ch = String.fromCharCode(m).toUpperCase();
      const score = ENG_FREQ[ch] || 0.001; // tiny fallback for non-letters
      if(score > bestScore){ best = m; bestScore = score; }
    }
    return String.fromCharCode(best);
  });

  const decoded = decipherChars.join('');
  document.getElementById('statDecode').value = decoded;
  document.getElementById('decodedFreq').textContent = freqPrintable(decoded);
  alert('Statistical decode finished (per-block candidate selection). Results shown in "Statistical decode".');
}

// utility to produce simple frequency table for printable letters
function freqPrintable(text){
  const counts = {};
  for(let ch of text.toUpperCase()){
    if(ch >= 'A' && ch <= 'Z'){
      counts[ch] = (counts[ch] || 0) + 1;
    }
  }
  const entries = Object.keys(counts).sort((a,b)=>counts[b]-counts[a]).map(k => `${k}: ${counts[k]}`);
  return entries.length ? entries.join('\n') : '(no letters)';
}

// -------------------- init: wire buttons and default keys --------------------
document.addEventListener('DOMContentLoaded', () => {
  // link UI elements:
  window.generateKeys = generateKeys;
  window.showKeyInfo = showKeyInfo;
  window.encryptMessage = encryptMessage;
  window.decryptWithPrivate = decryptWithPrivate;
  window.statisticalDecode = statisticalDecode;
  // simple default key gen at load
  generateKeys();
});
b
