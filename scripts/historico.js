import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, get, set, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDq0D0kz59B3nkMMyIwW5SeHG01_wJPTcM",
    authDomain: "lecitech-78671.firebaseapp.com",
    databaseURL: "https://lecitech-78671-default-rtdb.firebaseio.com",
    projectId: "lecitech-78671",
    storageBucket: "lecitech-78671.firebasestorage.app",
    messagingSenderId: "693126140232",
    appId: "1:693126140232:web:943dfc132719f9904ba37d"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const database = getDatabase(app);

const listaEl = document.getElementById('lista-historico');

// Converte "DD-MM-AAAA" em um objeto Date de verdade, pra dar pra ordenar/comparar
function parseDataBR(dataStr) {
    const [dia, mes, ano] = dataStr.split('-').map(Number);
    return new Date(ano, mes - 1, dia);
}

function formatarDataExtenso(dataStr) {
    const d = parseDataBR(dataStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function maximo(lista) {
    return lista.length ? Math.max(...lista).toFixed(1) : '--';
}
function minimo(lista) {
    return lista.length ? Math.min(...lista).toFixed(1) : '--';
}

async function processarHistorico() {
    const historicoSnap = await get(ref(database, 'historico'));
    const dadosHistorico = historicoSnap.val();

    if (!dadosHistorico) {
        listaEl.innerHTML = '<p style="text-align:center;color:#9ba6b5;padding:40px;">Nenhum dado histórico encontrado ainda.</p>';
        return;
    }

    // 1. Agrupa todas as leituras por dia (chave = "DD-MM-AAAA")
    const porDia = {};
    Object.keys(dadosHistorico).forEach((chave) => {
        const leitura = dadosHistorico[chave];
        if (!leitura.datahora) return;

        const dataDaLeitura = leitura.datahora.split(' ')[0]; // "DD-MM-AAAA"
        if (!porDia[dataDaLeitura]) {
            porDia[dataDaLeitura] = { temp: [], umid: [], chuva: [], vento: [] };
        }

        const grupo = porDia[dataDaLeitura];
        const t = parseFloat(leitura.temperatura);
        const u = parseFloat(leitura.umidade);
        const c = parseFloat(leitura.chuva);
        const v = parseFloat(leitura.vento ?? leitura.velocidade ?? leitura.vel_vento);

        if (!isNaN(t)) grupo.temp.push(t);
        if (!isNaN(u)) grupo.umid.push(u);
        if (!isNaN(c)) grupo.chuva.push(c);
        if (!isNaN(v)) grupo.vento.push(v);
    });

    // 2. Calcula o resumo (máx/mín) de cada dia
    const resumos = {};
    Object.keys(porDia).forEach((data) => {
        const g = porDia[data];
        resumos[data] = {
            tempMax: maximo(g.temp), tempMin: minimo(g.temp),
            umidMax: maximo(g.umid), umidMin: minimo(g.umid),
            chuvaMax: maximo(g.chuva), chuvaMin: minimo(g.chuva),
            ventoMax: maximo(g.vento), ventoMin: minimo(g.vento)
        };
    });

    // 3. Salva cada resumo em 'relatorios/{data}'
    await Promise.all(
        Object.keys(resumos).map((data) => set(ref(database, 'relatorios/' + data), resumos[data]))
    );

    // 4. Ordena as datas da mais recente pra mais antiga
    const datasOrdenadas = Object.keys(resumos).sort((a, b) => parseDataBR(b) - parseDataBR(a));

    // 5. Mantém só os 5 dias mais recentes; o resto é descartado (relatório + leituras cruas)
    const manter = datasOrdenadas.slice(0, 5);
    const descartar = datasOrdenadas.slice(5);

    if (descartar.length > 0) {
        const remocoes = descartar.map((data) => remove(ref(database, 'relatorios/' + data)));

        Object.keys(dadosHistorico).forEach((chave) => {
            const leitura = dadosHistorico[chave];
            if (leitura.datahora) {
                const dataDaLeitura = leitura.datahora.split(' ')[0];
                if (descartar.includes(dataDaLeitura)) {
                    remocoes.push(remove(ref(database, 'historico/' + chave)));
                }
            }
        });

        await Promise.all(remocoes);
    }

    renderizarLista(manter, resumos);
}

function renderizarLista(datas, resumos) {
    if (datas.length === 0) {
        listaEl.innerHTML = '<p style="text-align:center;color:#9ba6b5;padding:40px;">Nenhum dado histórico encontrado ainda.</p>';
        return;
    }

    listaEl.innerHTML = '';

    datas.forEach((data, indice) => {
        const r = resumos[data];
        const diaAnterior = datas[indice + 1]; // o próximo da lista é o dia anterior (mais antigo)
        let balao = '';

        if (diaAnterior && resumos[diaAnterior]) {
            const hojeMax = parseFloat(r.tempMax);
            const ontemMax = parseFloat(resumos[diaAnterior].tempMax);

            if (!isNaN(hojeMax) && !isNaN(ontemMax)) {
                const diferenca = +(hojeMax - ontemMax).toFixed(1);
                if (diferenca > 0) {
                    balao = `<div class="balao-comparacao">💬 Esse dia foi <strong>${diferenca}°C mais quente</strong> que o dia anterior.</div>`;
                } else if (diferenca < 0) {
                    balao = `<div class="balao-comparacao">💬 Esse dia foi <strong>${Math.abs(diferenca)}°C mais fresco</strong> que o dia anterior.</div>`;
                } else {
                    balao = `<div class="balao-comparacao">💬 A temperatura máxima ficou igual à do dia anterior.</div>`;
                }
            }
        }

        const card = document.createElement('div');
        card.className = 'dia-card';
        card.innerHTML = `
            <div class="dia-cabecalho">
                <span class="dia-data"><i class="fa-solid fa-calendar-day"></i> ${formatarDataExtenso(data)}</span>
                ${indice === 0 ? '<span class="etiqueta-recente">Mais recente</span>' : ''}
            </div>
            <div class="dia-metricas">
                <div class="metrica-mini">
                    <div class="rotulo"><i class="fa-solid fa-temperature-half" style="color:#FF4B4B;"></i> Temperatura</div>
                    <div class="valores">
                        <span class="max-valor">Máx: ${r.tempMax} °C</span>
                        <span class="min-valor">Mín: ${r.tempMin} °C</span>
                    </div>
                </div>
                <div class="metrica-mini">
                    <div class="rotulo"><i class="fa-solid fa-droplet" style="color:#00E5FF;"></i> Umidade</div>
                    <div class="valores">
                        <span class="max-valor">Máx: ${r.umidMax} %</span>
                        <span class="min-valor">Mín: ${r.umidMin} %</span>
                    </div>
                </div>
                <div class="metrica-mini">
                    <div class="rotulo"><i class="fa-solid fa-cloud-showers-heavy" style="color:#4FC3F7;"></i> Chuva</div>
                    <div class="valores">
                        <span class="max-valor">Máx: ${r.chuvaMax} mm</span>
                        <span class="min-valor">Mín: ${r.chuvaMin} mm</span>
                    </div>
                </div>
                <div class="metrica-mini">
                    <div class="rotulo"><i class="fa-solid fa-wind" style="color:#B0BEC5;"></i> Vento</div>
                    <div class="valores">
                        <span class="max-valor">Máx: ${r.ventoMax} km/h</span>
                        <span class="min-valor">Mín: ${r.ventoMin} km/h</span>
                    </div>
                </div>
            </div>
            ${balao}
        `;
        listaEl.appendChild(card);
    });
}

processarHistorico().catch((erro) => {
    console.error('Erro ao processar histórico:', erro);
    listaEl.innerHTML = '<p style="text-align:center;color:#FF4B4B;padding:40px;">Erro ao carregar o histórico. Veja o console (F12) para detalhes.</p>';
});