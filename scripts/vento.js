import { db, ref, onValue } from "./firebase-config.js";

const ctx = document.getElementById('graficoCanvas').getContext('2d');
const valorAtualElement = document.getElementById('valor-atual-destaque');

// 1. Inicializa o Chart.js
const meuGrafico = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Velocidade do Vento (km/h)',
            data: [],
            borderColor: '#00E5FF',
            backgroundColor: 'rgba(0, 229, 255, 0.1)',
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

// 2. Conecta ao Firebase e atualiza o gráfico em tempo real
const ventoRef = ref(db, 'estacao/vento');

onValue(ventoRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        let rotulos = [];
        let valores = [];

        if (typeof data === 'object' && !Array.isArray(data)) {
            // Se o Firebase retornar um objeto com chave/valor
            Object.keys(data).forEach(key => {
                const item = data[key];
                rotulos.push(item.hora || key);
                valores.push(item.valor !== undefined ? item.valor : item);
            });
        } else if (Array.isArray(data)) {
            // Se for uma lista
            data.forEach((item, index) => {
                rotulos.push(`Registro ${index + 1}`);
                valores.push(item);
            });
        } else {
            // Se for um único valor direto
            rotulos = ['Atual'];
            valores = [data];
        }

        // Atualiza o destaque numérico do topo (formatado com 2 casas decimais)
        const ultimoValor = valores[valores.length - 1];
        if (valorAtualElement) {
            valorAtualElement.textContent = Number(ultimoValor).toFixed(2);
        }

        // Atualiza os dados do gráfico (pega os últimos 15 registros)
        meuGrafico.data.labels = rotulos.slice(-15);
        meuGrafico.data.datasets[0].data = valores.slice(-15);
        meuGrafico.update();
    }
});