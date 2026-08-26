import { db, ref, onValue } from "./firebase-config.js";

const canvasElement = document.getElementById('graficoCanvas');
const valorAtualElement = document.getElementById('valor-atual-destaque');

if (canvasElement) {
    const ctx = canvasElement.getContext('2d');

    const meuGrafico = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Velocidade do Vento (km/h)',
                data: [],
                borderColor: '#00E5FF',
                backgroundColor: 'rgba(0, 229, 255, 0.15)',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointRadius: 4,
                pointBackgroundColor: '#00E5FF'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { 
                    ticks: { color: '#9ba6b5' }, 
                    grid: { color: 'rgba(255, 255, 255, 0.05)' } 
                },
                y: { 
                    beginAtZero: true,
                    ticks: { color: '#9ba6b5' }, 
                    grid: { color: 'rgba(255, 255, 255, 0.05)' } 
                }
            },
            plugins: {
                legend: { 
                    labels: { color: '#ffffff', font: { family: 'Poppins' } } 
                }
            }
        }
    });

    // Certifique-se de que o caminho do nó corresponde ao cadastrado no Firebase
    const ventoRef = ref(db, 'estacao/vento');

    onValue(ventoRef, (snapshot) => {
        const data = snapshot.val();
        console.log("Dados recebidos do Firebase:", data); // Verifique no F12 -> Console

        if (data !== null && data !== undefined) {
            let rotulos = [];
            let valores = [];

            if (typeof data === 'object' && !Array.isArray(data)) {
                Object.keys(data).forEach((key) => {
                    const item = data[key];
                    rotulos.push(item.hora || item.timestamp || key);
                    const val = typeof item === 'object' ? (item.valor ?? item.velocidade ?? 0) : item;
                    valores.push(Number(val) || 0);
                });
            } else if (Array.isArray(data)) {
                data.forEach((item, index) => {
                    rotulos.push(`Leitura ${index + 1}`);
                    const val = typeof item === 'object' ? (item.valor ?? item.velocidade ?? 0) : item;
                    valores.push(Number(val) || 0);
                });
            } else {
                rotulos = ['Agora'];
                valores = [Number(data) || 0];
            }

            const ultimoValor = valores[valores.length - 1];
            if (valorAtualElement) {
                valorAtualElement.textContent = ultimoValor.toFixed(2);
            }

            meuGrafico.data.labels = rotulos.slice(-15);
            meuGrafico.data.datasets[0].data = valores.slice(-15);
            meuGrafico.update();
        }
    }, (error) => {
        console.error("Erro no Firebase:", error);
    });
}