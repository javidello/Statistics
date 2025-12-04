// ===========================
//  SIMPLE WIENER PROCESS SIM
// ===========================

function simulateWiener() {
    const n = parseInt(document.getElementById("steps").value);
    const T = parseFloat(document.getElementById("T").value);
    const dt = T / n;
    
    let W = [0];
    
    for (let i = 0; i < n; i++) {
        let Z = Math.sqrt(dt) * randn();
        W.push(W[W.length - 1] + Z);
    }

    draw("plotW", W, "Wiener Process");
}


// ===========================
//   GENERAL SDE SIMULATOR
// ===========================

function simulateSDE() {
    const μ_expr = document.getElementById("drift").value;
    const σ_expr = document.getElementById("diffusion").value;
    const x0 = parseFloat(document.getElementById("x0").value);

    const n = 2000;
    const T = 1;
    const dt = T / n;
    
    let X = [x0];

    for (let i = 0; i < n; i++) {
        let t = i * dt;
        let x = X[X.length - 1];
        
        let μ = eval(μ_expr);
        let σ = eval(σ_expr);

        let Z = randn();

        let next = x + μ * dt + σ * Math.sqrt(dt) * Z;
        X.push(next);
    }

    draw("plotSDE", X, "General SDE Simulation");
}


// ===========================
//     HELPER FUNCTIONS
// ===========================

// Standard normal via Box–Muller
function randn() {
    let u = Math.random();
    let v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Canvas plotter
function draw(canvasId, data, label) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let w = canvas.width;
    let h = canvas.height;

    // Scale values
    let minVal = Math.min(...data);
    let maxVal = Math.max(...data);

    ctx.beginPath();
    ctx.strokeStyle = "#6d4ccf";
    ctx.lineWidth = 2;

    for (let i = 0; i < data.length; i++) {
        let x = (i / data.length) * w;
        let y = h - ((data[i] - minVal) / (maxVal - minVal)) * h;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = "#6d4ccf";
    ctx.font = "16px Inter";
    ctx.fillText(label, 20, 30);
}
