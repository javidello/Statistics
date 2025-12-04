document.addEventListener("DOMContentLoaded", () => {
    // Standard normal generator
    function randn() {
        let u = Math.random(), v = Math.random();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }

    // Wiener process simulation
    function simulateWiener(T = 1, N = 1000) {
        const dt = T / N;
        const path = new Array(N + 1).fill(0);
        for (let i = 1; i <= N; i++) {
            path[i] = path[i - 1] + Math.sqrt(dt) * randn();
        }
        return path;
    }

    // General SDE
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

    // Console plot helper
    function plotPath(path, label = "Path") {
        console.log("==== " + label + " ====");
        path.forEach((v, i) => {
            if (i % Math.floor(path.length / 20) === 0) {
                console.log(i + ": " + v.toFixed(4));
            }
        });
    }

    // Buttons
    const wBtn = document.getElementById("runWiener");
    if (wBtn) {
        wBtn.addEventListener("click", () => {
            const p = simulateWiener(1, 1000);
            plotPath(p, "Wiener Simulation");
            alert("Wiener process simulated! Check console.");
        });
    }

    const sBtn = document.getElementById("runSDE");
    if (sBtn) {
        sBtn.addEventListener("click", () => {
            const mu = (x, t) => 0.5 * x;
            const sigma = (x, t) => 0.2;
            const p = simulateSDE(mu, sigma, 1, 1, 1000);
            plotPath(p, "General SDE Simulation");
            alert("General SDE simulated! Check console.");
        });
    }
});
