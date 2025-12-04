document.addEventListener("DOMContentLoaded", () => {

    // Box-Muller transform for standard normal
    function randn() {
        const u = Math.random();
        const v = Math.random();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }

    // Simulate Wiener process
    function simulateWiener(T = 1, N = 100) {
        const dt = T / N;
        const path = [0];
        for (let i = 1; i <= N; i++) {
            path.push(path[i - 1] + Math.sqrt(dt) * randn());
        }
        return path;
    }

    // Button
    const btn = document.getElementById("runWiener");
    const output = document.getElementById("outputWiener");

    btn.addEventListener("click", () => {
        const path = simulateWiener(1, 100);
        output.textContent = "Wiener Process:\n" + path.map(v => v.toFixed(4)).join(", ");
    });

});
