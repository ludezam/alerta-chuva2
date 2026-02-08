// ================= CONFIGURAÇÃO =================
const INTERVALO = 300; // segundos

let LAT = -20.8113;
let LON = -49.3758;
let restante = INTERVALO;
let alertaDisparado = false;

// ================= ELEMENTOS =================
const cidadeAtualEl = document.getElementById("cidadeAtual");
const statusEl = document.getElementById("status");
const detalheEl = document.getElementById("detalhe");
const contadorEl = document.getElementById("contador");
const mapaEl = document.getElementById("mapa");

const cidadeInput = document.getElementById("cidade");
const btnBuscar = document.getElementById("btnBuscar");
const btnGPS = document.getElementById("btnGPS");

// ================= EVENTOS =================
btnBuscar.addEventListener("click", buscarCidade);
btnGPS.addEventListener("click", usarGPS);

// ================= FUNÇÕES =================
function mostrarCidade(nome) {
  cidadeAtualEl.innerHTML = `📍 Cidade: <b>${nome}</b>`;
}

function atualizarMapa() {
  const src = `https://embed.rainviewer.com/?loc=${LAT},${LON},7&layer=radar&smooth=1&snow=0&_=${Date.now()}`;
  mapaEl.src = src;
}

function definirStatus(prob, chuva) {
  if (chuva > 0.5) return "🔴 Chuva forte ⛈️";
  if (prob >= 40) return "🟠 Chuva se aproximando";
  if (prob >= 20) return "🟡 Chuva possível";
  return "🟢 Sem chuva";
}

async function buscarCidade() {
  try {
    const nome = cidadeInput.value.trim();
    if (!nome) throw "Digite a cidade";

    statusEl.innerText = "⏳ Buscando cidade...";

    const r = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(nome)}&count=1&language=pt`
    );

    if (!r.ok) throw "Erro ao buscar cidade";

    const data = await r.json();
    if (!data.results) throw "Cidade não encontrada";

    LAT = data.results[0].latitude;
    LON = data.results[0].longitude;

    mostrarCidade(data.results[0].name);
    atualizarTudo();
  } catch (e) {
    alert(e);
  }
}

function usarGPS() {
  if (!navigator.geolocation) {
    alert("Geolocalização não suportada");
    return;
  }

  navigator.geolocation.getCurrentPosition(async pos => {
    LAT = pos.coords.latitude;
    LON = pos.coords.longitude;

    try {
      const r = await fetch(
        `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${LAT}&longitude=${LON}&language=pt`
      );

      if (r.ok) {
        const data = await r.json();
        if (data.results) mostrarCidade(data.results[0].name);       atualizarTudo();
      }
    } catch {
      atualizarTudo();
    }
  }, () => alert("Permissão de localização negada"));
}

async function atualizarPrevisao() {
  const r = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&minutely_15=precipitation_probability,precipitation&timezone=America/Sao_Paulo`
  );

  const data = await r.json();

  const prob = Math.max(...data.minutely_15.precipitation_probability.slice(0, 4));
  const chuva = Math.max(...data.minutely_15.precipitation.slice(0, 4));

dispararAlerta(prob, chuva);
if (prob < 20 && chuva === 0) {
  alertaDisparado = false;
}

  statusEl.innerText = definirStatus(prob, chuva);
  detalheEl.innerHTML = `
    Probabilidade máx.: <b>${prob}%</b><br>
    Precipitação: <b>${chuva.toFixed(2)} mm</b>
  `;

  restante = INTERVALO;
}

function atualizarContador() {
  const m = Math.floor(restante / 60);
  const s = restante % 60;

  contadorEl.innerText =
    `🔄 Próxima atualização em ${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

  if (restante > 0) restante--;
}

function atualizarTudo() {
  atualizarPrevisao();
  atualizarMapa();
}

function dispararAlerta(prob, chuva) {
  if (alertaDisparado) return;

  if (prob >= 40 || chuva > 0.5) {
    alertaDisparado = true;

    alert(
      `⛈️ ALERTA DE CHUVA!\n\nProbabilidade: ${prob}%\nPrecipitação: ${chuva.toFixed(2)} mm`
    );
  }
}

// ================= INICIALIZAÇÃO =================
mostrarCidade("São José do Rio Preto");
atualizarTudo();

setInterval(atualizarPrevisao, INTERVALO * 1000);
setInterval(atualizarContador, 1000);