// script.js — Homework 4: Law of Large Numbers simulation

function runSimulation() {
  const totalTosses = 1000;
  let headsCount = 0;
  const relativeFreq = [];

  for (let i = 1; i <= totalTosses; i++) {
    const toss = Math.random() < 0.5 ? 1 : 0;
    headsCount += toss;
    relativeFreq.push(headsCount / i);
  }

  drawChart(relativeFreq);
}

let chartInstance;

function drawChart(data) {
  const ctx = document.getElementById('llnChart').getContext('2d');

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array.from({ length: data.length }, (_, i) => i + 1),
      datasets: [
        {
          label: 'Relative Frequency of Heads',
          data: data,
          borderColor: '#7289da',
          fill: false,
          tension: 0.1,
          borderWidth: 2,
        },
        {
          label: 'Expected Value (0.5)',
          data: Array(data.length).fill(0.5),
          borderColor: '#f05454',
          borderDash: [6, 4],
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 1,
          title: { display: true, text: 'Relative Frequency' },
        },
        x: {
          title: { display: true, text: 'Number of Trials (n)' },
        },
      },
    },
  });
}
