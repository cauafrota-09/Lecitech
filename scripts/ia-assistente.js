const API_KEY = "AQ.Ab8RN6Lhz1QBZ6dWlGgwWRFe2VmGrvojAXJ6besSaksjhTomOw";

// Função para abrir e fechar a janela do chat
function toggleChat() {
  const chatBox = document.getElementById("chat-box");
  if (chatBox) {
    chatBox.classList.toggle("ativo");
  }
}

// Função para enviar mensagem para a IA do Gemini
async function enviarMensagemIA() {
  const inputEl = document.getElementById("chat-input");
  const messagesEl = document.getElementById("chat-messages");
  const textoUsuario = inputEl.value.trim();

  if (!textoUsuario) return;

  // Mensagem do usuário
  messagesEl.innerHTML += `
    <div class="msg user-msg">
      <b>Você:</b> ${textoUsuario}
    </div>
  `;

  inputEl.value = "";
  messagesEl.scrollTop = messagesEl.scrollHeight;

  // Indicador de "Pensando..."
  const loadingId = "loading-" + Date.now();
  messagesEl.innerHTML += `
    <div class="msg ia-msg" id="${loadingId}">
      <b>IA Lecitech:</b> Pensando...
    </div>
  `;
  messagesEl.scrollTop = messagesEl.scrollHeight;

  // URL corrigida incluindo o caminho models/
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Você é o assistente virtual da estação meteorológica LECITECH. Responda de forma sucinta e amigável sobre dados climáticos.\n\nPergunta do usuário: ${textoUsuario}`
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const msgErro = data.error?.message || `Erro HTTP ${response.status}`;
      throw new Error(msgErro);
    }

    const respostaIA = data.candidates?.[0]?.content?.parts?.[0]?.text || "Não consegui processar a resposta.";

    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) {
      loadingEl.innerHTML = `<b>IA Lecitech:</b> ${respostaIA}`;
    }
  } catch (error) {
    console.error("Erro na API do Gemini:", error);
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) {
      loadingEl.className = "msg ia-msg error";
      loadingEl.innerHTML = `❌ Erro na consulta: ${error.message}`;
    }
  }

  messagesEl.scrollTop = messagesEl.scrollHeight;
}