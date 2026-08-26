import { db, ref, onValue } from "./firebase-config.js";

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

    // 1. Escuta o HISTÓRICO para montar a linha do gráfico
    const historicoRef = ref(db, 'historico');
    onValue(historicoRef, (snapshot) => {
        const dadosHistorico = snapshot.val();

        if (dadosHistorico) {
            const listaLabels = [];
            const listaValores = [];

            Object.keys(dadosHistorico).forEach(idUnico => {
                const leitura = dadosHistorico[idUnico];
                
                // Mapeia o campo do vento no histórico
                const valVento = leitura.vento ?? leitura.velocidade ?? leitura.vel_vento;

                if (valVento !== undefined && valVento !== null && leitura.datahora) {
                    const valor = parseFloat(valVento);
                    const partes = leitura.datahora.split(' ');
                    const dia = partes[0] ? partes[0].split('-')[0] : ''; 
                    const horaMinuto = partes[1] ? partes[1].substring(0, 5) : ''; 
                    
                    listaLabels.push(`${dia} às ${horaMinuto}`);
                    listaValores.push(valor.toFixed(1));
                }
            });

            if (listaLabels.length > 0) {
                meuGrafico.data.labels = listaLabels.slice(-60);
                meuGrafico.data.datasets[0].data = listaValores.slice(-60);
                meuGrafico.update();
            }
        }
    });

    // 2. Escuta o mesmo nó do PAINEL DE MONITORAMENTO para atualizar o número no topo
    // (Ajuste 'estacao' para o caminho exato que seu monitoramento.js usa)
    const tempoRealRef = ref(db, 'estacao');
    onValue(tempoRealRef, (snapshot) => {
        const dados = snapshot.val();
        if (dados) {
            const ventoAtual = dados.vento ?? dados.velocidade ?? dados.vel_vento;
            if (ventoAtual !== undefined && valorDestaque) {
                valorDestaque.innerText = parseFloat(ventoAtual).toFixed(1);
            }
        }
    });
}