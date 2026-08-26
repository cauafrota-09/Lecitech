import { db, ref, onValue } from "./firebase-config.js";

// Referência ao nó 'historico' (mesma estrutura usada na temperatura)
const historicoRef = ref(db, 'historico');

// Elementos da Interface
const valorDestaque = document.getElementById('valor-atual-destaque');
const canvasElement = document.getElementById('graficoCanvas');

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
                backgroundColor: 'rgba(0, 229, 255, 0.08)',
                borderWidth: 3,
                pointBackgroundColor: '#1a2430',
                pointBorderColor: '#00E5FF',
                pointBorderWidth: 2,
                pointRadius: 3,
                fill: true,
                tension: 0.3 
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { 
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }, 
                    ticks: { color: '#9ba6b5' } 
                },
                x: { 
                    grid: { display: false }, 
                    ticks: { color: '#9ba6b5', maxTicksLimit: 12 } 
                }
            },
            plugins: { 
                legend: { display: false } 
            }
        }
    });

    // Escuta em tempo real o histórico do Firebase
    onValue(historicoRef, (snapshot) => {
        const dadosHistorico = snapshot.val();

        if (dadosHistorico) {
            const listaLabels = [];
            const listaValores = [];
            let ultimoVento = 0;

            Object.keys(dadosHistorico).forEach(idUnico => {
                const leitura = dadosHistorico[idUnico];
                
                // Busca a propriedade 'vento' ou 'velocidade' dentro da leitura
                const valorVento = leitura.vento ?? leitura.velocidade;
                
                if (valorVento !== undefined && leitura.datahora) {
                    const valor = parseFloat(valorVento);
                    
                    // Formatação da data/hora (ex: "24 às 04:29")
                    const partes = leitura.datahora.split(' ');
                    const dia = partes[0].split('-')[0]; 
                    const horaMinuto = partes[1] ? partes[1].substring(0, 5) : ''; 
                    
                    listaLabels.push(`${dia} às ${horaMinuto}`);
                    listaValores.push(valor.toFixed(1));
                    ultimoVento = valor.toFixed(1);
                }
            });

            // Mantém os últimos 60 registros no gráfico
            if (listaLabels.length > 60) {
                meuGrafico.data.labels = listaLabels.slice(-60);
                meuGrafico.data.datasets[0].data = listaValores.slice(-60);
            } else {
                meuGrafico.data.labels = listaLabels;
                meuGrafico.data.datasets[0].data = listaValores;
            }

            if (valorDestaque) {
                valorDestaque.innerText = ultimoVento;
            }
            meuGrafico.update();
        } else {
            if (valorDestaque) {
                valorDestaque.innerText = "--";
            }
        }
    });
} 