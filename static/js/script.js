let chartInstance = null;
let lastData = null;

// --- THEME TOGGLE LOGIC ---
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

// Check for saved theme in localStorage
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
    body.classList.add('light-mode');
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('light-mode');
    
    // Save preference
    if (body.classList.contains('light-mode')) {
        localStorage.setItem('theme', 'light');
    } else {
        localStorage.setItem('theme', 'dark');
    }

    // Optional: Update Chart colors if light mode is active
    if (chartInstance) {
        updateChartTheme();
    }
});

// Update chart colors dynamically when theme changes
function updateChartTheme() {
    const isLight = body.classList.contains('light-mode');
    chartInstance.options.scales.x.ticks.color = isLight ? '#1e293b' : '#ffffff';
    chartInstance.options.scales.y.ticks.color = isLight ? '#1e293b' : '#ffffff';
    chartInstance.update();
}

document.getElementById('calc-btn').addEventListener('click', async () => {
    const payload = {
        function: document.getElementById('func-input').value,
        lower: document.getElementById('lower-a').value,
        upper: document.getElementById('upper-b').value,
        precision: document.getElementById('precision').value
    };

    const res = await fetch('/calculate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
        lastData = data;
        document.getElementById('results-area').style.display = 'block';
        renderResults(data.steps);
        renderGraph(data.graph);
    } else {
        alert("Error: " + data.error);
    }
});

function renderResults(s) {
    const out = document.getElementById('steps-output');
    let rows = s.table.map(r => `<tr><td>x<sub>${r.i}</sub></td><td>${r.x}</td><td>${r.fx}</td></tr>`).join('');

    out.innerHTML = `
        <div class="step-box"><h4>1. Step Size</h4><p>\\[ ${s.h_step} \\]</p></div>
        <div class="step-box"><h4>2. Evaluated Points</h4><table><tr><th>Point</th><th>x</th><th>f(x)</th></tr>${rows}</table></div>
        <div class="step-box"><h4>3. Substitution</h4><p style="font-size:0.9rem;">\\[ ${s.s1} \\]</p></div>
        <div class="step-box"><h4>4. Intermediate Products</h4><p>\\[ ${s.s2} \\]</p></div>
        <div class="step-box"><h4>5. Final Result</h4><p class="highlight">I ≈ ${s.result}</p></div>
    `;
    MathJax.typesetPromise();
}

// Function to handle "Clear All"
document.getElementById('clear-btn').addEventListener('click', () => {
    // Reset Inputs
    document.getElementById('func-input').value = "";
    document.getElementById('lower-a').value = "0";
    document.getElementById('upper-b').value = "0";
    
    // Hide Results and clear chart
    document.getElementById('results-area').style.display = 'none';
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
    
    // Provide a small visual feedback
    console.log("Calculator Reset");
});

function renderGraph(g) {
    const ctx = document.getElementById('integrationChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: g.x.map(v => v.toFixed(2)),
            datasets: [{
                label: 'Area under f(x)',
                data: g.y,
                borderColor: '#00d2ff',
                backgroundColor: 'rgba(0, 210, 255, 0.2)',
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

document.getElementById('download-pdf').addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const s = lastData.steps;

    doc.setFontSize(18);
    doc.text("Boole's Rule Integration Report", 20, 20);
    doc.setFontSize(12);
    doc.text(`Function: ${s.interpreted}`, 20, 35);
    doc.text(`Result: ${s.result}`, 20, 42);

    doc.autoTable({
        startY: 50,
        head: [['i', 'x', 'f(x)']],
        body: s.table.map(r => [r.i, r.x, r.fx]),
    });

    const canvas = document.getElementById('integrationChart');
    const img = canvas.toDataURL("image/png");
    doc.text("Graph Visualization:", 20, doc.lastAutoTable.finalY + 15);
    doc.addImage(img, 'PNG', 20, doc.lastAutoTable.finalY + 20, 170, 80);

    doc.save("Boole_Rule_Report.pdf");
});

