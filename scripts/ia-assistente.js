// ---------------------------------------------------------
// CONFIGURAÇÃO DA IA
// A chave já está aqui. Não precisa editar nada neste arquivo.
// ---------------------------------------------------------
const GEMINI_API_KEY = "AQ.Ab8RN6I-BopUH747TPreJTBTFWcwyyz91nFfJirE72_ZO2n7BQ";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

// Só considera "sem chave" se estiver vazia ou curta demais
const chaveConfigurada = GEMINI_API_KEY.trim().length > 20;

// Impede que texto digitado vire código HTML na tela
function escaparHTML(texto) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Função para abrir e fechar a janela do chat
function toggleChat() {
  const chatBox = document.getElementById("chat-box");
  if (chatBox) {
    chatBox.classList.toggle("ativo");
  }
}

// Função para enviar mensagem capturando dinamicamente os dados do painel da ESP32
async function enviarMensagemIA() {
  const inputEl = document.getElementById("chat-input");
  const messagesEl = document.getElementById("chat-messages");
  const textoUsuario = inputEl.value.trim();

  if (!textoUsuario) return;

  // Leitura dinâmica do painel (puxa o que a ESP32 atualizar na tela)
  const temperatura = document.querySelector(".card-temperatura")?.innerText || document.querySelector("#temp")?.innerText || "--";
  const umidade = document.querySelector(".card-umidade")?.innerText || document.querySelector("#umid")?.innerText || "--";
  const chuva = document.querySelector(".card-chuva")?.innerText || document.querySelector("#chuva")?.innerText || "--";
  const vento = document.querySelector(".card-vento")?.innerText || document.querySelector("#vento")?.innerText || "--";
  const pressao = document.querySelector(".card-pressao")?.innerText || document.querySelector("#pressao")?.innerText || "--";
  const co2 = document.querySelector(".card-co2")?.innerText || document.querySelector("#co2")?.innerText || "--";
  const amoniaVal = document.querySelector(".card-amonia")?.innerText || document.querySelector("#nh3")?.innerText || "--";
  const qualidade = document.querySelector(".card-qualidade")?.innerText || document.querySelector("#qualidade")?.innerText || "--";

  messagesEl.innerHTML += `
    <div class="msg user-msg">
      <b>Você:</b> ${escaparHTML(textoUsuario)}
    </div>
  `;

  inputEl.value = "";
  messagesEl.scrollTop = messagesEl.scrollHeight;

  const loadingId = "loading-" + Date.now();
  messagesEl.innerHTML += `
    <div class="msg ia-msg" id="${loadingId}">
      <b>IA Lecitech:</b> Pensando<span class="loading-dots"><span>.</span><span>.</span><span>.</span></span>
    </div>
  `;
  messagesEl.scrollTop = messagesEl.scrollHeight;

  const contextoDados = `
[DADOS ATUAIS DA ESTAÇÃO ESP32 - LECITECH]
- Temperatura: ${temperatura}
- Umidade: ${umidade}
- Chuva: ${chuva}
- Vento: ${vento}
- Pressão: ${pressao}
- CO2: ${co2}
- Amônia: ${amoniaVal}
- Qualidade do Ar: ${qualidade}
  `;

  try {
    if (!chaveConfigurada) {
      throw new Error("Nenhuma API key configurada. Cole sua chave do Gemini no topo do arquivo ia-assistente.js.");
    }

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{
            text: "Você é um professor de geografia experiente, especialista em climatologia e meteorologia, " +
                  "conversando com estudantes e visitantes de uma feira de robótica escolar (Lecitech). " +
                  "Sua missão é explicar os dados climáticos da estação meteorológica de forma clara, didática " +
                  "e acessível, como faria em sala de aula. Use os dados atuais da estação fornecidos no contexto " +
                  "para responder de forma concreta e educativa. Seja breve (2 a 4 frases), evite jargão técnico " +
                  "excessivo e, quando fizer sentido, relacione o dado com conceitos de geografia (clima, umidade, " +
                  "pressão atmosférica, qualidade do ar etc.)."
          }]
        },
        contents: [{
          role: "user",
          parts: [{ text: `${contextoDados}\n\nPergunta do usuário: ${textoUsuario}` }]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `Erro HTTP ${response.status}`);
    }

    const respostaIA = data.candidates?.[0]?.content?.parts?.[0]?.text || "Não consegui processar a resposta.";

    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) {
      loadingEl.innerHTML = `<b>IA Lecitech:</b> ${escaparHTML(respostaIA)}`;
    }
  } catch (error) {
    console.error("Erro na comunicação com o Gemini:", error);
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) {
      loadingEl.className = "msg ia-msg error";
      loadingEl.innerHTML = `❌ Erro: ${escaparHTML(error.message)}`;
    }
  }

  messagesEl.scrollTop = messagesEl.scrollHeight;
}