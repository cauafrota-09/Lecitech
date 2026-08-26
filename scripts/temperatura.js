import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Credenciais Firebase
const firebaseConfig = {
    apiKey: "AIzaSyD507yI1k5nIKAHit-xNEglMfbvyU-mwjo",
   databaseURL: "https://lecitech-78671-default-rtdb.firebaseio.com/",
projectId: "lecitech-78671"
   
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Referências
// Mude para ficar exatamente assim:
const historicoRef = ref(database, 'historico');
const relatoriosRef = ref(database, 'relatorios');

// Elementos da Interface
const valorDestaque = document.getElementById('valor-atual-destaque');
const corpoTabelaRelatorios = document.getElementById('corpo-tabela-relatorios');

// ================= INICIALIZAÇÃO DO CHART.JS =================
const ctx = document.getElementById('graficoCanvas').getContext('2d');
const meuGrafico = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [], 
        datasets: [{
            label: 'Temperatura',
            data: [], 
            borderColor: '#FF4B4B',
            backgroundColor: 'rgba(255, 75, 75, 0.08)',
            borderWidth: 3,
            pointBackgroundColor: '#1a2430',
            pointBorderColor: '#FF4B4B',
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
            y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#9ba6b5' } },
            x: { grid: { display: false }, ticks: { color: '#9ba6b5', maxTicksLimit: 12 } }
        },
        plugins: { legend: { display: false } }
    }
});

// ================= ESCUTA DO HISTÓRICO (GRÁFICO DE LINHA) =================
onValue(historicoRef, (snapshot) => {
    const dadosHistorico = snapshot.val();

    if (dadosHistorico) {
        const listaLabels = [];
        const listaValores = [];
        let ultimaTemp = 0;

        Object.keys(dadosHistorico).forEach(idUnico => {
            const leitura = dadosHistorico[idUnico];
            
            if (leitura.temperatura && leitura.datahora) {
                const valor = parseFloat(leitura.temperatura);
                
                const partes = leitura.datahora.split(' ');
                const dia = partes[0].split('-')[0]; 
                const horaMinuto = partes[1].substring(0, 5); 
                
                listaLabels.push(`${dia} às ${horaMinuto}`);
                listaValores.push(valor.toFixed(1));
                ultimaTemp = valor.toFixed(1);
            }
        });

        if (listaLabels.length > 60) {
            meuGrafico.data.labels = listaLabels.slice(-60);
            meuGrafico.data.datasets[0].data = listaValores.slice(-60);
        } else {
            meuGrafico.data.labels = listaLabels;
            meuGrafico.data.datasets[0].data = listaValores;
        }

        valorDestaque.innerText = `${ultimaTemp} °C`;
        meuGrafico.update();
    } else {
        valorDestaque.innerText = `-- °C`;
    }
});

// ================= ESCUTA DOS RELATÓRIOS (TABELA DE RECORDES) =================
onValue(relatoriosRef, (snapshot) => {
    const dadosRelatorios = snapshot.val();

    if (dadosRelatorios) {
        corpoTabelaRelatorios.innerHTML = ""; // Limpa a mensagem de carregamento

        const datasArquivadas = Object.keys(dadosRelatorios).reverse();

        datasArquivadas.forEach(data => {
            const relatorio = dadosRelatorios[data];

            const linha = document.createElement('tr');
            linha.innerHTML = `
                <td><strong>${data}</strong></td>
                <td class="temp-max-celula">${parseFloat(relatorio.tempMaxima).toFixed(1)} °C</td>
                <td class="temp-min-celula">${parseFloat(relatorio.tempMinima).toFixed(1)} °C</td>
            `;
            corpoTabelaRelatorios.appendChild(linha);
        });
    } else {
        corpoTabelaRelatorios.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; color: #9ba6b5; padding: 20px;">
                    Nenhum relatório diário consolidado ainda. Aguardando a próxima Meia-Noite!
                </td>
            </tr>
        `;
    }
});