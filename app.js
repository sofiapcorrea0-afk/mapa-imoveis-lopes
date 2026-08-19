// Link da planilha publicada como CSV (Arquivo > Compartilhar > Publicar na web)
const URL_PLANILHA = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSW_uNgZOC0GgsH91RblCQXRKBiPFNTdm3agRxnyDmk03OpZ3syftbnCWheQczAhKgsjsc3kJI6Ag97/pub?output=csv";

// Web app do Apps Script que grava lat/lng de volta na planilha (Deploy > Web app)
const URL_SCRIPT = "https://script.google.com/macros/s/AKfycbzsjZa-Tssu8IUaYgbG7L8aGO82E8xBB33ywcG7l3LjWLdVibkvOJb37VdqDZN4aSwj/exec";

// Senha só pra decidir se mostra o botão de arrastar no navegador — a
// checagem que realmente protege a planilha acontece dentro do Apps Script.
const SENHA_EDICAO = "1234";

let modoEdicao = false;
let todosItens = [];

const map = L.map('map').setView([-23.5505, -46.6333], 13);

const camadaMapa = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

const camadaSatelite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 19,
  attribution: 'Tiles &copy; Esri'
});

camadaMapa.addTo(map);

// Botão no canto do mapa pra alternar entre visão de ruas e satélite
L.control.layers({ 'Mapa': camadaMapa, 'Satélite': camadaSatelite }).addTo(map);

// Grupo simples (sem agrupar em bolhas) — só existe pra poder esconder/
// mostrar vários pins de uma vez quando um filtro é aplicado.
const grupoMarcadores = L.layerGroup();
map.addLayer(grupoMarcadores);

const listaEl = document.getElementById('lista-imoveis');
const filtrosEl = document.getElementById('filtros');

// Faz o split de uma linha CSV respeitando aspas (um campo entre aspas pode
// conter vírgulas sem que isso quebre em colunas erradas)
function parseLinhaCSV(linha) {
  const valores = [];
  let atual = '';
  let dentroDeAspas = false;

  for (const char of linha) {
    if (char === '"') {
      dentroDeAspas = !dentroDeAspas;
    } else if (char === ',' && !dentroDeAspas) {
      valores.push(atual);
      atual = '';
    } else {
      atual += char;
    }
  }
  valores.push(atual);
  return valores;
}

function parseCSV(texto) {
  const linhas = texto.trim().split('\n');
  const cabecalho = parseLinhaCSV(linhas[0]).map(c => c.trim());

  return linhas.slice(1).map(linha => {
    const valores = parseLinhaCSV(linha);
    const objeto = {};
    cabecalho.forEach((coluna, i) => {
      objeto[coluna] = (valores[i] || '').trim();
    });
    return objeto;
  });
}

// A planilha às vezes formata número como moeda ("R$ 23,55"); isso remove
// tudo que não for dígito, ponto ou sinal de menos antes de converter.
function numero(texto) {
  return parseFloat(String(texto).replace(/[^0-9.-]/g, ''));
}

function formatarPreco(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function montarPopup(imovel) {
  return `
    <div class="popup-imovel">
      <img src="${imovel.foto}" alt="${imovel.nome}" loading="lazy">
      <h3>${imovel.nome}</h3>
      <p class="preco">${formatarPreco(imovel.preco)}${Number.isNaN(imovel.metragem) ? '' : ` · ${imovel.metragem}m²`}</p>
      <p class="endereco">${imovel.endereco}</p>
      <p class="atualizacoes">${imovel.atualizacoes}</p>
      <p class="incorporador">Incorporador: ${imovel.incorporador}</p>
      <a href="${imovel.linkAnuncio}" target="_blank" rel="noopener">Ver anúncio</a>
    </div>
  `;
}

function renderizarImoveis(imoveis) {
  const itens = imoveis.map(imovel => {
    // Começa travado (draggable: false) — só fica arrastável depois que
    // alguém digitar a senha certa no botão "Editar posições".
    const marker = L.marker([imovel.lat, imovel.lng], { draggable: false })
      .bindPopup(montarPopup(imovel));

    marker.on('dragend', async () => {
      const { lat, lng } = marker.getLatLng();
      const coords = `lat: ${lat.toFixed(6)}<br>lng: ${lng.toFixed(6)}`;
      marker
        .bindTooltip(`Salvando...<br>${coords}`, { permanent: true, direction: 'top', className: 'tooltip-coordenadas' })
        .openTooltip();

      try {
        const resposta = await fetch(URL_SCRIPT, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ id: imovel.id, lat, lng, senha: SENHA_EDICAO })
        });
        const resultado = await resposta.json();
        marker.setTooltipContent(
          resultado.ok
            ? `✅ Posição salva na planilha<br>${coords}`
            : `⚠️ Não salvou (${resultado.erro || 'erro'}) — copie manualmente:<br>${coords}`
        );
      } catch {
        marker.setTooltipContent(`⚠️ Não conectou ao script — copie manualmente:<br>${coords}`);
      }
    });

    grupoMarcadores.addLayer(marker);

    const card = document.createElement('div');
    card.className = 'card-imovel';
    card.innerHTML = `
      <img src="${imovel.foto}" alt="${imovel.nome}" loading="lazy">
      <div>
        <h4>${imovel.nome}</h4>
        <p class="preco">${formatarPreco(imovel.preco)}${Number.isNaN(imovel.metragem) ? '' : ` · ${imovel.metragem}m²`}</p>
        <p class="endereco">${imovel.endereco}</p>
      </div>
    `;
    listaEl.appendChild(card);

    const item = { imovel, marker, card };

    card.addEventListener('click', () => selecionar(item));
    marker.on('click', () => selecionar(item));

    return item;
  });

  function selecionar(item) {
    itens.forEach(i => i.card.classList.toggle('selecionado', i === item));
    item.card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    map.flyTo([item.imovel.lat, item.imovel.lng], 15);
    item.marker.openPopup();
  }

  return itens;
}

// Cria os botões de tipo e o dropdown de bairro, e mantém os dois filtros
// combinados: um imóvel só fica visível se bater com ambos.
function renderizarFiltros(imoveis, itens) {
  let tipoAtual = 'Todos';
  let bairroAtual = 'Todos';

  const tiposEl = document.createElement('div');
  tiposEl.id = 'filtro-tipos';

  const tipos = ['Todos', ...new Set(imoveis.map(i => i.tipo))];
  tipos.forEach(tipo => {
    const botao = document.createElement('button');
    botao.textContent = tipo;
    if (tipo === 'Todos') botao.classList.add('ativo');

    botao.addEventListener('click', () => {
      [...tiposEl.children].forEach(b => b.classList.toggle('ativo', b === botao));
      tipoAtual = tipo;
      aplicarFiltros();
    });

    tiposEl.appendChild(botao);
  });

  // Dropdown em vez de botões porque a lista de bairros tende a crescer
  // muito mais do que a de tipos, e não caberia numa fileira.
  const bairroEl = document.createElement('select');
  bairroEl.id = 'filtro-bairro';
  const bairros = ['Todos os bairros', ...new Set(imoveis.map(i => i.bairro).filter(Boolean))];
  bairros.forEach(bairro => {
    const opcao = document.createElement('option');
    opcao.textContent = bairro;
    opcao.value = bairro === 'Todos os bairros' ? 'Todos' : bairro;
    bairroEl.appendChild(opcao);
  });
  bairroEl.addEventListener('change', () => {
    bairroAtual = bairroEl.value;
    aplicarFiltros();
  });

  filtrosEl.append(tiposEl, bairroEl);

  function aplicarFiltros() {
    itens.forEach(({ imovel, marker, card }) => {
      const bateTipo = tipoAtual === 'Todos' || imovel.tipo === tipoAtual;
      const bateBairro = bairroAtual === 'Todos' || imovel.bairro === bairroAtual;
      const visivel = bateTipo && bateBairro;

      card.style.display = visivel ? '' : 'none';
      if (visivel) grupoMarcadores.addLayer(marker);
      else grupoMarcadores.removeLayer(marker);
    });
  }
}

fetch(URL_PLANILHA)
  .then(resposta => resposta.text())
  .then(texto => {
    const linhas = parseCSV(texto);
    const imoveis = linhas
      .map(linha => ({
        id: linha.id,
        nome: linha.nome,
        tipo: linha.tipo,
        bairro: linha.bairro,
        endereco: linha.endereco,
        lat: numero(linha.lat),
        lng: numero(linha.lng),
        preco: numero(linha.preco),
        metragem: numero(linha.metragem),
        foto: linha.fotos,
        linkAnuncio: linha.linkAnuncio,
        incorporador: linha.incorporador,
        atualizacoes: linha.atualizacoes
      }))
      // Ignora linhas sem nome (linhas em branco) ou sem lat/lng válidos —
      // um imóvel incompleto na planilha não pode derrubar os outros.
      .filter(imovel => {
        if (!imovel.nome) return false;
        if (Number.isNaN(imovel.lat) || Number.isNaN(imovel.lng)) {
          console.warn(`Imóvel "${imovel.nome}" sem lat/lng válidos — não será exibido.`);
          return false;
        }
        return true;
      });
    todosItens = renderizarImoveis(imoveis);
    renderizarFiltros(imoveis, todosItens);
  })
  .catch(erro => {
    listaEl.innerHTML = '<p style="padding:12px">Não foi possível carregar os imóveis da planilha.</p>';
    console.error('Erro ao carregar planilha:', erro);
  });

const botaoEdicao = document.getElementById('botao-edicao');

botaoEdicao.addEventListener('click', () => {
  if (modoEdicao) {
    modoEdicao = false;
    botaoEdicao.textContent = '🔒 Editar posições';
    botaoEdicao.classList.remove('ativo');
  } else {
    const senha = prompt('Senha pra editar a posição dos imóveis:');
    if (senha === null) return;
    if (senha !== SENHA_EDICAO) {
      alert('Senha incorreta.');
      return;
    }
    modoEdicao = true;
    botaoEdicao.textContent = '🔓 Modo edição ativo';
    botaoEdicao.classList.add('ativo');
  }

  todosItens.forEach(({ marker }) => {
    marker.options.draggable = modoEdicao;
    if (marker.dragging) {
      if (modoEdicao) marker.dragging.enable();
      else marker.dragging.disable();
    }
  });
});
