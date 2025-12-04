// ======================================================
// Random Number Utilities
// ======================================================

// Standard Normal (Gaussian) using Box–Muller transform
function randn() {
    let u = Math.random(), v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Uniform random
function rand() {
    return Math.random();
}



// ======================================================
// Homework 11 — Wiener Process Simulation
// ======================================================

// Simulate a Wiener process W_t on [0, T] with N steps
function simulateWiener(T = 1, N = 1000) {
    const dt = T / N;
    const path = new Array(N + 1).fill(0);

    for (let i = 1; i <= N; i++) {
        const dW = Math.sqrt(dt) * randn();
        path[i] = path[i - 1] + dW;
    }

    return path;
}



// ======================================================
// Optional General SDE Solver (Homework 11 Extension)
// dX = μ(x,t) dt + σ(x,t) dW
// ======================================================

function simulateSDE(mu, sigma, X0, T = 1, N = 1000) {
    const dt = T / N;
    const path = [X0];

    for (let i = 1; i <= N; i++) {
        const t = i * dt;
        const Xprev = path[i - 1];
        const dW = Math.sqrt(dt) * randn();
        const Xnext = Xprev + mu(Xprev, t) * dt + sigma(Xprev, t) * dW;
        path.push(Xnext);
    }

    return path;
}



// ======================================================
// Console Plot Helper (for debugging)
// ======================================================

function plotPath(path, label = "Path") {
    console.log("==== " + label + " ====");
    path.forEach((v, i) => {
        if (i % Math.floor(path.length / 20) === 0) {
            console.log(i + ": " + v.toFixed(4));
        }
    });
}



// ======================================================
// Debug Buttons (if homework pages want them)
// ======================================================

// Simulate when pressing a button with id="runWiener"
const wBtn = document.getElementById("runWiener");
if (wBtn) {
    wBtn.addEventListener("click", () => {
        const p = simulateWiener(1, 1000);
        plotPath(p, "Wiener Simulation");
        alert("Wiener process simulated! Check console.");
    });
}

// Simulate general SDE when pressing a button with id="runSDE"
const sBtn = document.getElementById("runSDE");
if (sBtn) {
    sBtn.addEventListener("click", () => {
        const mu = (x, t) => 0.5 * x;     // example drift
        const sigma = (x, t) => 0.2;      // example volatility
        const p = simulateSDE(mu, sigma, 1, 1, 1000);
        plotPath(p, "General SDE Simulation");
        alert("General SDE simulated! Check console.");
    });
}
