document.addEventListener("DOMContentLoaded", () => {

    // Standard normal generator using Box-Muller
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

    // Draw chart using Chart.js
    let chart; // global variable
    function drawChart(path) {
        const ctx = document.getElementById("chartWiener").getContext("2d");
        const labels = path.map((_, i) => i);

        if (chart) chart.destroy();

        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Wiener Process',
                    data: path,
                    borderColor: 'rgba(75, 0, 130, 1)',
                    backgroundColor: 'rgba(75, 0, 130, 0.2)',
                    borderWidth: 2,
                    pointRadius: 0,
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: { display: true, title: { display: true, text: 'Step' } },
                    y: { display: true, title: { display: true, text: 'Value' } }
                }
            }
        });
    }

    // Button click
    document.getElementById("runWiener").addEventListener("click", () => {
        const T = parseFloat(document.getElementById("T").value);
        const N = parseInt(document.getElementById("N").value);
        const path = simulateWiener(T, N);
        drawChart(path);
    });

});
