// ============================================================
//  ENARES REAL ESTATE · aplicação
//  Site de uma página só (SPA) com rotas pelo "#" da URL, para
//  funcionar em qualquer hospedagem estática (ex.: GitHub Pages).
//
//  Rotas:
//    #/                  página inicial
//    #/busca?f=aluguel   busca com filtros (f=aluguel | venda)
//    #/imovel/<id>       página do imóvel
//    #/lancamentos       lançamentos de incorporadores
//    #/favoritos         imóveis favoritados (salvos no navegador)
//    #/anunciar          formulário para proprietários
//    #/sobre             sobre a imobiliária e contato
// ============================================================
(function () {
  'use strict';

  const C = window.ENARES_CONFIG;
  const app = document.getElementById('app');
  let IMOVEIS = [];
  let mapaAtivo = null; // mapa Leaflet da página atual (destruído ao trocar de página)

  // ---------------------------------------------------------- utilidades
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const brl = v => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  const total = i => i.preco + (i.condominio || 0) + (i.iptu || 0);
  const ehLancamento = i => i.origem === 'incorporador';
  const precoCurto = v => v >= 1e6
    ? `R$ ${(v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} mi`
    : v >= 1e3 ? `R$ ${(v / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil` : brl(v);

  function whatsLink(msg) {
    return `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(msg)}`;
  }
  function abrirWhats(msg) {
    window.open(whatsLink(msg), '_blank', 'noopener');
  }
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('mostrar');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('mostrar'), 2600);
  }
  const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

  // ---------------------------------------------------------- ícones
  const ICONES = {
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    filtro: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    cama: '<path d="M3 19v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 16h18M6 10V7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v3"/>',
    banho: '<path d="M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-2zM6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2"/>',
    carro: '<path d="M5 16h14M4 16v3h3v-2M17 17v2h3v-3M4 16l1.5-5.5A2 2 0 0 1 7.4 9h9.2a2 2 0 0 1 1.9 1.5L20 16M7.5 13h.01M16.5 13h.01"/>',
    area: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    pin: '<path d="M12 21s7-6 7-11.5a7 7 0 1 0-14 0C5 15 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    pata: '<circle cx="7" cy="9" r="1.8"/><circle cx="11" cy="6" r="1.8"/><circle cx="15.5" cy="7" r="1.8"/><circle cx="18" cy="11" r="1.8"/><path d="M8.5 17.5c0-2.5 2-5 4.5-5s3.8 2.6 3.6 4.4c-.2 1.8-1.6 2.6-3.1 2.1-1-.3-1.7-.3-2.6.1-1.5.6-2.4-.3-2.4-1.6z"/>',
    sofa: '<path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3M3 13a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v5H3zM6 18v2M18 18v2"/>',
    metro: '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M9 14h.01M15 14h.01M8 21l2-4M16 21l-2-4"/>',
    predio: '<path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 10h4a1 1 0 0 1 1 1v10M3 21h18M8 8h3M8 12h3M8 16h3"/>',
    calendario: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    chat: '<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>',
    escudo: '<path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
    chave: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l2 2M15 8l2 2"/>',
    compartilhar: '<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M12 3v12M8 7l4-4 4 4"/>',
    esq: '<path d="M15 5l-7 7 7 7"/>',
    dir: '<path d="M9 5l7 7-7 7"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    fotos: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/>',
    mapa: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/>',
    lista: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    tel: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    estrela: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
  };
  const ic = (nome, cls = '') =>
    `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[nome] || ''}</svg>`;
  function preencherIcones(raiz = document) {
    $$('[data-icone]', raiz).forEach(el => { el.outerHTML = ic(el.dataset.icone); });
  }

  // Foto que não carregar vira uma ilustração com as cores da marca.
  const CORES_PH = [['#0E3B39', '#2F6E64'], ['#1E4E5A', '#4C8291'], ['#3D4A3A', '#7C8E6A'], ['#5A4528', '#B8935A']];
  function placeholder(seed) {
    let h = 0;
    for (const c of String(seed)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const [a, b] = CORES_PH[h % CORES_PH.length];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><path d="M150 170l50-40 50 40v50h-100z" fill="none" stroke="#D9B25F" stroke-width="6" stroke-linejoin="round" opacity=".85"/><path d="M188 220v-26h24v26" fill="none" stroke="#D9B25F" stroke-width="6" opacity=".85"/></svg>`;
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }
  document.addEventListener('error', e => {
    const el = e.target;
    if (el.tagName === 'IMG' && !el.dataset.ph && !el.classList.contains('leaflet-tile')) {
      el.dataset.ph = '1';
      el.src = placeholder(el.alt || el.src);
    }
  }, true);
  const foto = (src, alt, extra = '') => `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" ${extra}>`;

  // ---------------------------------------------------------- favoritos
  const FAV = 'enares:favoritos';
  const lerFavs = () => { try { return JSON.parse(localStorage.getItem(FAV)) || []; } catch { return []; } };
  const salvarFavs = a => { try { localStorage.setItem(FAV, JSON.stringify(a)); } catch { /* navegador sem armazenamento */ } };
  const ehFav = id => lerFavs().includes(id);
  function alternarFav(id) {
    const favs = lerFavs();
    const pos = favs.indexOf(id);
    if (pos >= 0) favs.splice(pos, 1); else favs.push(id);
    salvarFavs(favs);
    atualizarContadorFav();
    toast(pos >= 0 ? 'Removido dos favoritos' : 'Salvo nos favoritos');
    return pos < 0;
  }
  function atualizarContadorFav() {
    const n = lerFavs().filter(id => IMOVEIS.some(i => i.id === id)).length;
    const el = $('#contador-fav');
    el.textContent = n;
    el.hidden = n === 0;
  }
  // Um único "ouvinte" trata todos os corações do site.
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-fav]');
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    const ativo = alternarFav(b.dataset.fav);
    $$(`[data-fav="${CSS.escape(b.dataset.fav)}"]`).forEach(x => {
      x.classList.toggle('ativo', ativo);
      x.setAttribute('aria-pressed', ativo);
    });
    if (rotaAtual().caminho === 'favoritos') render();
  });

  // ---------------------------------------------------------- card
  function card(i) {
    const fav = ehFav(i.id);
    const selos = [];
    if (ehLancamento(i)) selos.push(`<span class="selo selo-dourado">${esc(i.status || 'Lançamento')}</span>`);
    if (i.mobiliado) selos.push('<span class="selo">Mobiliado</span>');
    if (i.pet && !ehLancamento(i)) selos.push('<span class="selo">Aceita pet</span>');

    let preco;
    if (i.finalidade === 'aluguel') {
      preco = `<div class="card-preco"><strong>${brl(total(i))}</strong><span>total/mês</span></div>
               <div class="card-sub">Aluguel ${brl(i.preco)}</div>`;
    } else if (ehLancamento(i)) {
      preco = `<div class="card-preco"><span>a partir de</span><strong>${brl(i.preco)}</strong></div>
               <div class="card-incorp">${esc(i.incorporador)}</div>`;
    } else {
      preco = `<div class="card-preco"><strong>${brl(i.preco)}</strong></div>
               <div class="card-sub">Cond. ${brl(i.condominio)} · IPTU ${brl(i.iptu)}</div>`;
    }

    const fatos = [`<span>${ic('area')}${ehLancamento(i) ? 'desde ' : ''}${i.area} m²</span>`];
    if (i.quartos) fatos.push(`<span>${ic('cama')}${plural(i.quartos, 'quarto', 'quartos')}</span>`);
    fatos.push(`<span>${ic('carro')}${i.vagas ? plural(i.vagas, 'vaga', 'vagas') : 'Sem vaga'}</span>`);

    return `
      <a class="card" href="#/imovel/${encodeURIComponent(i.id)}" data-id="${esc(i.id)}">
        <div class="card-foto">
          ${foto(i.fotos[0], i.titulo)}
          <div class="selos">${selos.join('')}</div>
          <button class="btn-fav ${fav ? 'ativo' : ''}" data-fav="${esc(i.id)}" aria-pressed="${fav}" aria-label="Favoritar">${ic('heart')}</button>
        </div>
        <div class="card-corpo">
          ${preco}
          <div class="card-titulo">${esc(ehLancamento(i) ? i.tipologias || i.titulo : i.titulo)}</div>
          <div class="card-local">${esc(i.tipo)} · ${esc(i.bairro)}, ${esc(i.cidade)}</div>
          <div class="card-fatos">${fatos.join('')}</div>
        </div>
      </a>`;
  }

  // ---------------------------------------------------------- página inicial
  function paginaInicio() {
    const bairros = [...new Set(IMOVEIS.map(i => i.bairro))].sort();
    const tipos = [...new Set(IMOVEIS.map(i => i.tipo))].sort();
    const aluguel = IMOVEIS.filter(i => i.finalidade === 'aluguel').sort((a, b) => b.destaque - a.destaque).slice(0, 8);
    const venda = IMOVEIS.filter(i => i.finalidade === 'venda' && !ehLancamento(i)).sort((a, b) => b.destaque - a.destaque).slice(0, 8);
    const lanc = IMOVEIS.filter(ehLancamento).slice(0, 8);

    app.innerHTML = `
      <section class="hero">
        <img class="hero-foto" src="https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=2000&q=70" alt="" onerror="this.remove()">
        <div class="hero-in">
          <h1>Encontre o lugar <em>certo</em> para a sua próxima fase.</h1>
          <p>Apartamentos, casas e lançamentos para alugar ou comprar. Escolha, agende a visita online e fale direto com um corretor.</p>

          <form class="busca-rapida" id="busca-rapida">
            <div class="abas" role="tablist">
              <button type="button" class="aba ativa" data-f="aluguel" role="tab">Alugar</button>
              <button type="button" class="aba" data-f="venda" role="tab">Comprar</button>
              <button type="button" class="aba" data-f="lancamentos" role="tab">Lançamentos</button>
            </div>
            <div class="busca-campos">
              <div class="campo-busca">
                <label for="hq">Onde?</label>
                <input id="hq" name="q" list="lista-bairros" placeholder="Bairro, cidade ou empreendimento" autocomplete="off">
                <datalist id="lista-bairros">${bairros.map(b => `<option value="${esc(b)}">`).join('')}</datalist>
              </div>
              <div class="campo-busca">
                <label for="htipo">Tipo</label>
                <select id="htipo" name="tipo"><option value="">Todos</option>${tipos.map(t => `<option>${esc(t)}</option>`).join('')}</select>
              </div>
              <div class="campo-busca">
                <label for="hquartos">Quartos</label>
                <select id="hquartos" name="quartos"><option value="">Qualquer</option><option value="1">1+</option><option value="2">2+</option><option value="3">3+</option><option value="4">4+</option></select>
              </div>
              <button class="btn btn-primario" type="submit">${ic('search')} Buscar</button>
            </div>
          </form>

          <div class="hero-numeros">
            <div><b>${IMOVEIS.filter(i => i.finalidade === 'aluguel').length}</b><span>imóveis para alugar</span></div>
            <div><b>${IMOVEIS.filter(i => i.finalidade === 'venda' && !ehLancamento(i)).length}</b><span>imóveis à venda</span></div>
            <div><b>${new Set(IMOVEIS.filter(ehLancamento).map(i => i.incorporador)).size}</b><span>incorporadores parceiros</span></div>
          </div>
        </div>
      </section>

      <div class="container">
        ${secaoTrilho('Para alugar', 'O valor mostrado já inclui condomínio e IPTU. Sem surpresas.', aluguel, '#/busca?f=aluguel')}
        ${secaoTrilho('Para comprar', 'Imóveis selecionados da nossa carteira.', venda, '#/busca?f=venda')}
        ${secaoTrilho('Lançamentos', 'Empreendimentos na planta, em obras e prontos, direto dos incorporadores.', lanc, '#/lancamentos')}

        <section class="secao">
          <div class="secao-cab"><div><h2>Por que a Enares</h2></div></div>
          <div class="beneficios">
            ${beneficio('calendario', 'Visita no seu horário', 'Escolha o dia e a hora pelo site e um corretor confirma com você.')}
            ${beneficio('chat', 'Atendimento direto', 'Fale com quem conhece o imóvel, sem intermediários e sem demora.')}
            ${beneficio('escudo', 'Imóveis verificados', 'Documentação conferida e fotos reais antes de cada anúncio.')}
            ${beneficio('predio', 'Lançamentos exclusivos', 'Acesso antecipado a condições especiais dos nossos incorporadores parceiros.')}
          </div>
        </section>

        <section class="cta">
          <div class="cta-in">
            <div>
              <h2>Tem um imóvel para alugar ou vender?</h2>
              <p>Anuncie com a Enares. Cuidamos das fotos, da divulgação, das visitas e de toda a negociação.</p>
            </div>
            <div class="cta-acoes">
              <a href="#/anunciar" class="btn btn-dourado">Anunciar meu imóvel</a>
              <a class="btn btn-contorno" href="${whatsLink('Olá! Sou incorporador e gostaria de apresentar um empreendimento à Enares.')}" target="_blank" rel="noopener">Sou incorporador</a>
            </div>
          </div>
        </section>
      </div>`;

    let f = 'aluguel';
    const form = $('#busca-rapida');
    $$('.aba', form).forEach(b => b.addEventListener('click', () => {
      f = b.dataset.f;
      $$('.aba', form).forEach(x => x.classList.toggle('ativa', x === b));
    }));
    form.addEventListener('submit', e => {
      e.preventDefault();
      const p = new URLSearchParams();
      p.set('f', f === 'lancamentos' ? 'venda' : f);
      if (f === 'lancamentos') p.set('lanc', '1');
      ['q', 'tipo', 'quartos'].forEach(k => { if (form[k].value) p.set(k, form[k].value); });
      location.hash = '#/busca?' + p;
    });
  }

  function secaoTrilho(titulo, sub, lista, link) {
    if (!lista.length) return '';
    return `
      <section class="secao">
        <div class="secao-cab">
          <div><h2>${titulo}</h2><p>${sub}</p></div>
          <a class="link" href="${link}">Ver todos →</a>
        </div>
        <div class="trilho">${lista.map(card).join('')}</div>
      </section>`;
  }
  const beneficio = (icone, t, d) => `<div class="beneficio"><div class="bolha">${ic(icone)}</div><h3>${t}</h3><p>${d}</p></div>`;

  // ---------------------------------------------------------- busca
  const FAIXAS = {
    aluguel: [1500, 2500, 3500, 5000, 7000, 10000, 15000],
    venda: [400000, 600000, 800000, 1000000, 1500000, 2000000, 3000000, 5000000],
  };
  const normalizar = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  function filtrar(p) {
    const f = p.get('f') || 'aluguel';
    const q = normalizar(p.get('q'));
    const tipo = p.get('tipo');
    const max = Number(p.get('max')) || 0;
    const quartos = Number(p.get('quartos')) || 0;
    const vagas = Number(p.get('vagas')) || 0;
    const areaMin = Number(p.get('area')) || 0;

    let lista = IMOVEIS.filter(i => {
      if (i.finalidade !== f) return false;
      if (q && !normalizar([i.bairro, i.cidade, i.endereco, i.titulo, i.empreendimento, i.incorporador].join(' ')).includes(q)) return false;
      if (tipo && i.tipo !== tipo) return false;
      if (max && (f === 'aluguel' ? total(i) : i.preco) > max) return false;
      if (quartos && i.quartos < quartos) return false;
      if (vagas && i.vagas < vagas) return false;
      if (areaMin && i.area < areaMin) return false;
      if (p.get('pet') && !i.pet) return false;
      if (p.get('mob') && !i.mobiliado) return false;
      if (p.get('metro') && !i.metro) return false;
      if (p.get('lanc') && !ehLancamento(i)) return false;
      return true;
    });

    const valor = i => (f === 'aluguel' ? total(i) : i.preco);
    const ordem = p.get('ordem');
    if (ordem === 'menor') lista.sort((a, b) => valor(a) - valor(b));
    else if (ordem === 'maior') lista.sort((a, b) => valor(b) - valor(a));
    else if (ordem === 'area') lista.sort((a, b) => b.area - a.area);
    else lista.sort((a, b) => (b.destaque === true) - (a.destaque === true));
    return lista;
  }

  function paginaBusca(params) {
    const p = new URLSearchParams(params);
    if (!p.get('f')) p.set('f', 'aluguel');
    const tipos = [...new Set(IMOVEIS.map(i => i.tipo))].sort();
    const bairros = [...new Set(IMOVEIS.map(i => i.bairro))].sort();

    app.innerHTML = `
      <div class="busca com-mapa" id="busca">
        <aside class="filtros" id="filtros" aria-label="Filtros">
          <div class="filtros-cab"><h2>Filtros</h2><button class="btn-icone" id="fechar-filtros" aria-label="Fechar filtros">${ic('x')}</button></div>
          <form id="form-filtros">
            <div class="filtro">
              <div class="segmentado" id="seg-f">
                <button type="button" data-f="aluguel">Alugar</button>
                <button type="button" data-f="venda">Comprar</button>
              </div>
            </div>
            <div class="filtro">
              <label for="fq">Localização</label>
              <input class="entrada" id="fq" name="q" list="fl-bairros" placeholder="Bairro ou cidade" autocomplete="off">
              <datalist id="fl-bairros">${bairros.map(b => `<option value="${esc(b)}">`).join('')}</datalist>
            </div>
            <div class="filtro">
              <label for="ftipo">Tipo de imóvel</label>
              <select class="entrada" id="ftipo" name="tipo"><option value="">Todos</option>${tipos.map(t => `<option>${esc(t)}</option>`).join('')}</select>
            </div>
            <div class="filtro">
              <label for="fmax" id="rotulo-max">Valor total até</label>
              <select class="entrada" id="fmax" name="max"></select>
            </div>
            <div class="filtro">
              <span class="rotulo">Quartos</span>
              <div class="chips" data-grupo="quartos">${['', '1', '2', '3', '4'].map(v => `<button type="button" class="chip" data-v="${v}">${v ? v + '+' : 'Todos'}</button>`).join('')}</div>
            </div>
            <div class="filtro">
              <span class="rotulo">Vagas</span>
              <div class="chips" data-grupo="vagas">${['', '1', '2', '3'].map(v => `<button type="button" class="chip" data-v="${v}">${v ? v + '+' : 'Todas'}</button>`).join('')}</div>
            </div>
            <div class="filtro">
              <label for="farea">Área mínima</label>
              <select class="entrada" id="farea" name="area"><option value="">Qualquer</option>${[30, 50, 70, 90, 120, 150, 200].map(a => `<option value="${a}">${a} m² ou mais</option>`).join('')}</select>
            </div>
            <div class="filtro">
              <label class="check"><input type="checkbox" name="pet"> Aceita pet</label>
              <label class="check"><input type="checkbox" name="mob"> Mobiliado</label>
              <label class="check"><input type="checkbox" name="metro"> Perto do metrô</label>
              <label class="check" id="check-lanc"><input type="checkbox" name="lanc"> Só lançamentos</label>
            </div>
            <div class="filtro">
              <button type="button" class="btn btn-contorno btn-sm btn-bloco" id="limpar">Limpar filtros</button>
            </div>
            <div class="filtros-rodape so-mobile"><button type="button" class="btn btn-primario btn-bloco" id="ver-resultados">Ver imóveis</button></div>
          </form>
        </aside>

        <section class="resultados">
          <div class="resultados-cab">
            <div><h1 id="titulo-res"></h1><p id="sub-res"></p></div>
            <div class="resultados-acoes">
              <button class="btn btn-contorno btn-sm btn-filtros-mobile" id="abrir-filtros">${ic('filtro')} Filtros</button>
              <select class="entrada" id="ordem" aria-label="Ordenar">
                <option value="">Mais relevantes</option>
                <option value="menor">Menor preço</option>
                <option value="maior">Maior preço</option>
                <option value="area">Maior área</option>
              </select>
            </div>
          </div>
          <div class="grade" id="grade"></div>
        </section>

        <div class="mapa-busca"><div id="mapa"></div></div>
        <button class="btn btn-primario btn-alternar-mapa" id="alternar-mapa">${ic('mapa')} Ver mapa</button>
      </div>`;

    const form = $('#form-filtros');
    const busca = $('#busca');

    // Preenche o formulário com o que veio na URL
    form.q.value = p.get('q') || '';
    form.tipo.value = p.get('tipo') || '';
    form.area.value = p.get('area') || '';
    ['pet', 'mob', 'metro', 'lanc'].forEach(k => { form[k].checked = !!p.get(k); });
    $('#ordem').value = p.get('ordem') || '';

    function montarFaixas() {
      const f = p.get('f');
      $('#rotulo-max').textContent = f === 'aluguel' ? 'Valor total até (por mês)' : 'Valor até';
      form.max.innerHTML = '<option value="">Sem limite</option>' + FAIXAS[f].map(v => `<option value="${v}">${brl(v)}</option>`).join('');
      form.max.value = FAIXAS[f].includes(Number(p.get('max'))) ? p.get('max') : '';
      $('#check-lanc').hidden = f !== 'venda';
      $$('#seg-f button').forEach(b => b.classList.toggle('ativo', b.dataset.f === f));
    }
    function marcarChips() {
      $$('.chips[data-grupo]', form).forEach(g => {
        const v = p.get(g.dataset.grupo) || '';
        $$('.chip', g).forEach(c => c.classList.toggle('ativo', c.dataset.v === v));
      });
    }

    // Mapa
    let marcadores = new Map();
    if (window.L) {
      mapaAtivo = L.map('mapa', { zoomControl: true, scrollWheelZoom: true }).setView(C.centroMapa, 12);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19, subdomains: 'abcd',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(mapaAtivo);
    }

    function atualizar() {
      const lista = filtrar(p);
      const f = p.get('f');
      const local = p.get('q') ? ` em ${p.get('q')}` : '';
      $('#titulo-res').textContent = `${plural(lista.length, 'imóvel', 'imóveis')} ${f === 'aluguel' ? 'para alugar' : 'à venda'}${local}`;
      $('#sub-res').textContent = f === 'aluguel' ? 'Valores com condomínio e IPTU incluídos' : (p.get('lanc') ? 'Lançamentos de incorporadores parceiros' : 'Imóveis prontos e lançamentos');
      document.title = `${$('#titulo-res').textContent} · ${C.nome}`;

      $('#grade').innerHTML = lista.length ? lista.map(card).join('') : `
        <div class="vazio" style="grid-column:1/-1">
          <h3>Nenhum imóvel com esses filtros</h3>
          <p>Tente ampliar a busca, ou conte para a gente o que procura que avisamos quando aparecer.</p>
          <p style="margin-top:16px"><a class="btn btn-primario btn-sm" target="_blank" rel="noopener" href="${whatsLink(`Olá! Estou procurando um imóvel para ${f === 'aluguel' ? 'alugar' : 'comprar'}${local}. Podem me avisar quando tiverem opções?`)}">Avise-me de novos imóveis</a></p>
        </div>`;

      $('#ver-resultados').textContent = `Ver ${plural(lista.length, 'imóvel', 'imóveis')}`;

      if (mapaAtivo) {
        marcadores.forEach(m => m.remove());
        marcadores = new Map();
        lista.forEach(i => {
          const valor = f === 'aluguel' ? total(i) : i.preco;
          const m = L.marker([i.lat, i.lng], {
            icon: L.divIcon({ className: 'pin-preco', html: `<span>${precoCurto(valor)}</span>`, iconSize: [0, 0] }),
            riseOnHover: true,
          }).addTo(mapaAtivo);
          m.bindPopup(`<a class="popup-mini" href="#/imovel/${encodeURIComponent(i.id)}">${foto(i.fotos[0], i.titulo)}<div><strong>${brl(valor)}${f === 'aluguel' ? '/mês' : ''}</strong><span>${esc(i.tipo)} · ${i.area} m² · ${esc(i.bairro)}</span></div></a>`, { closeButton: false, offset: [0, -24] });
          m.on('mouseover', () => $(`.card[data-id="${CSS.escape(i.id)}"]`)?.classList.add('realce'));
          m.on('mouseout', () => $(`.card[data-id="${CSS.escape(i.id)}"]`)?.classList.remove('realce'));
          marcadores.set(i.id, m);
        });
        if (lista.length) mapaAtivo.fitBounds(L.latLngBounds(lista.map(i => [i.lat, i.lng])).pad(0.15), { maxZoom: 15 });
      }
      $$('#grade .card').forEach(c => {
        const m = marcadores.get(c.dataset.id);
        if (!m) return;
        c.addEventListener('mouseenter', () => { m.getElement()?.classList.add('ativo'); m.setZIndexOffset(1000); });
        c.addEventListener('mouseleave', () => { m.getElement()?.classList.remove('ativo'); m.setZIndexOffset(0); });
      });

      history.replaceState(null, '', '#/busca?' + p);
    }

    function definir(chave, valor) {
      if (valor) p.set(chave, valor); else p.delete(chave);
      atualizar();
    }

    $$('#seg-f button').forEach(b => b.addEventListener('click', () => {
      p.set('f', b.dataset.f);
      p.delete('max');
      if (b.dataset.f === 'aluguel') { p.delete('lanc'); form.lanc.checked = false; }
      montarFaixas();
      atualizar();
    }));
    $$('.chips[data-grupo]', form).forEach(g => g.addEventListener('click', e => {
      const c = e.target.closest('.chip');
      if (!c) return;
      p.set(g.dataset.grupo, c.dataset.v);
      if (!c.dataset.v) p.delete(g.dataset.grupo);
      marcarChips();
      atualizar();
    }));
    let espera;
    form.q.addEventListener('input', () => { clearTimeout(espera); espera = setTimeout(() => definir('q', form.q.value.trim()), 250); });
    form.tipo.addEventListener('change', () => definir('tipo', form.tipo.value));
    form.max.addEventListener('change', () => definir('max', form.max.value));
    form.area.addEventListener('change', () => definir('area', form.area.value));
    ['pet', 'mob', 'metro', 'lanc'].forEach(k => form[k].addEventListener('change', () => definir(k, form[k].checked ? '1' : '')));
    form.addEventListener('submit', e => e.preventDefault());
    $('#ordem').addEventListener('change', e => definir('ordem', e.target.value));
    $('#limpar').addEventListener('click', () => {
      const f = p.get('f');
      [...p.keys()].forEach(k => p.delete(k));
      p.set('f', f);
      form.reset();
      montarFaixas(); marcarChips(); atualizar();
    });

    // Mobile: filtros em painel e alternância lista/mapa
    const filtros = $('#filtros');
    $('#abrir-filtros').addEventListener('click', () => filtros.classList.add('aberto'));
    $('#fechar-filtros').addEventListener('click', () => filtros.classList.remove('aberto'));
    $('#ver-resultados').addEventListener('click', () => filtros.classList.remove('aberto'));
    $('#alternar-mapa').addEventListener('click', () => {
      const mapa = busca.classList.toggle('ver-mapa');
      $('#alternar-mapa').innerHTML = mapa ? `${ic('lista')} Ver lista` : `${ic('mapa')} Ver mapa`;
      if (mapa && mapaAtivo) setTimeout(() => { mapaAtivo.invalidateSize(); atualizar(); }, 50);
    });

    montarFaixas();
    marcarChips();
    atualizar();
  }

  // ---------------------------------------------------------- página do imóvel
  function paginaImovel(id) {
    const i = IMOVEIS.find(x => x.id === id);
    if (!i) return paginaNaoEncontrada();
    document.title = `${i.titulo} · ${i.bairro} · ${C.nome}`;
    const aluguel = i.finalidade === 'aluguel';
    const lanc = ehLancamento(i);
    const fav = ehFav(i.id);
    const n = Math.min(i.fotos.length, 5);
    const link = location.href.split('#')[0] + '#/imovel/' + encodeURIComponent(i.id);

    const fatos = [
      ['area', `${lanc ? 'desde ' : ''}${i.area} m²`, 'Área útil'],
      i.quartos ? ['cama', plural(i.quartos, 'quarto', 'quartos'), i.suites ? plural(i.suites, 'suíte', 'suítes') : 'Sem suíte'] : null,
      ['banho', plural(i.banheiros, 'banheiro', 'banheiros'), 'Banheiros'],
      ['carro', i.vagas ? plural(i.vagas, 'vaga', 'vagas') : 'Sem vaga', 'Garagem'],
      i.andar ? ['predio', `${i.andar}º andar`, 'Andar'] : null,
      ['pata', i.pet ? 'Aceita' : 'Não aceita', 'Pets'],
      !lanc ? ['sofa', i.mobiliado ? 'Mobiliado' : 'Sem mobília', 'Mobília'] : null,
      i.metro ? ['metro', 'Perto', 'do metrô'] : null,
    ].filter(Boolean);

    let precoHtml;
    if (aluguel) {
      precoHtml = `
        <div class="linha-valor"><span>Aluguel</span><span>${brl(i.preco)}</span></div>
        <div class="linha-valor"><span>Condomínio</span><span>${i.condominio ? brl(i.condominio) : 'Não tem'}</span></div>
        <div class="linha-valor"><span>IPTU</span><span>${brl(i.iptu)}</span></div>
        <div class="linha-valor total"><span>Total por mês</span><span>${brl(total(i))}</span></div>`;
    } else if (lanc) {
      precoHtml = `<div class="preco-grande"><small>a partir de</small>${brl(i.preco)}</div>
        <div class="linha-valor" style="margin-top:8px"><span>Incorporador</span><span>${esc(i.incorporador)}</span></div>
        <div class="linha-valor"><span>Entrega</span><span>${esc(i.entrega)}</span></div>`;
    } else {
      precoHtml = `<div class="preco-grande"><small>Valor de venda</small>${brl(i.preco)}</div>
        <div class="linha-valor" style="margin-top:8px"><span>Condomínio</span><span>${i.condominio ? brl(i.condominio) + '/mês' : 'Não tem'}</span></div>
        <div class="linha-valor"><span>IPTU</span><span>${brl(i.iptu)}/mês</span></div>`;
    }

    const similares = IMOVEIS
      .filter(x => x.id !== i.id && x.finalidade === i.finalidade)
      .map(x => ({ x, s: (x.bairro === i.bairro ? 2 : 0) + (x.tipo === i.tipo ? 1 : 0) + (Math.abs(x.quartos - i.quartos) <= 1 ? 1 : 0) }))
      .sort((a, b) => b.s - a.s).slice(0, 4).map(o => o.x);

    app.innerHTML = `
      <div class="container pagina-imovel">
        <nav class="migalhas" aria-label="Você está em">
          <a href="#/">Início</a> › <a href="#/busca?f=${i.finalidade}">${aluguel ? 'Alugar' : 'Comprar'}</a> ›
          <a href="#/busca?f=${i.finalidade}&q=${encodeURIComponent(i.bairro)}">${esc(i.bairro)}</a>
        </nav>

        <div class="galeria g${n}">
          ${i.fotos.slice(0, 5).map((src, k) => `<button type="button" data-foto="${k}" aria-label="Ampliar foto ${k + 1}">${foto(src, `${i.titulo}, foto ${k + 1}`, k === 0 ? 'loading="eager"' : '')}</button>`).join('')}
          ${i.fotos.length > 1 ? `<button type="button" class="btn btn-contorno btn-sm ver-fotos" style="background:#fff" data-foto="0">${ic('fotos')} Ver ${i.fotos.length} fotos</button>` : ''}
        </div>

        <div class="imovel">
          <div>
            <div class="imovel-cab">
              <div>
                <div class="imovel-tipo">${esc(i.tipo)} ${aluguel ? 'para alugar' : lanc ? '· lançamento' : 'à venda'}</div>
                <h1>${esc(i.titulo)}</h1>
                <div class="imovel-local">${ic('pin')} ${esc(i.endereco)}, ${esc(i.bairro)} · ${esc(i.cidade)}</div>
              </div>
              <div class="imovel-botoes">
                <button class="btn-icone" id="compartilhar" aria-label="Compartilhar">${ic('compartilhar')}</button>
                <button class="btn-icone ${fav ? 'ativo' : ''}" data-fav="${esc(i.id)}" aria-pressed="${fav}" aria-label="Favoritar">${ic('heart')}</button>
              </div>
            </div>

            <div class="fatos">${fatos.map(([icone, b, s]) => `<div class="fato">${ic(icone)}<div><b>${b}</b><small>${s}</small></div></div>`).join('')}</div>

            ${lanc ? `
              <div class="bloco">
                <h2>Sobre o empreendimento</h2>
                <div class="empreendimento">
                  <div><small>Incorporador</small><b>${esc(i.incorporador)}</b></div>
                  <div><small>Estágio da obra</small><b>${esc(i.status)}</b></div>
                  <div><small>Entrega</small><b>${esc(i.entrega)}</b></div>
                  ${i.tipologias ? `<div style="grid-column:1/-1"><small>Plantas</small><b>${esc(i.tipologias)}</b></div>` : ''}
                </div>
              </div>` : ''}

            <div class="bloco"><h2>Descrição</h2><p>${esc(i.descricao)}</p></div>

            ${i.caracteristicas?.length ? `<div class="bloco"><h2>O que tem no imóvel e no condomínio</h2>
              <div class="lista-carac">${i.caracteristicas.map(c => `<span>${ic('check')}${esc(c)}</span>`).join('')}</div></div>` : ''}

            ${!aluguel ? `
              <div class="bloco">
                <h2>Simule o financiamento</h2>
                <div class="simulador" id="simulador">
                  <div class="sim-grade">
                    <label>Entrada: <span id="sim-ent-txt"></span><input type="range" id="sim-ent" min="20" max="80" step="5" value="30"></label>
                    <label>Prazo<select class="entrada" id="sim-prazo">${[10, 15, 20, 25, 30, 35].map(a => `<option value="${a}" ${a === 30 ? 'selected' : ''}>${a} anos</option>`).join('')}</select></label>
                    <label>Juros ao ano (%)<input class="entrada" id="sim-juros" type="number" min="1" max="30" step="0.1" value="11.5"></label>
                  </div>
                  <div class="sim-resultado">
                    <div><small>Valor financiado</small><b id="sim-fin"></b></div>
                    <div><small>1ª parcela (SAC)</small><b id="sim-sac"></b></div>
                    <div><small>Última parcela (SAC)</small><b id="sim-ult"></b></div>
                  </div>
                  <p class="nota">Estimativa sem seguros e taxas. O valor final depende da análise de crédito do banco. Aceitamos FGTS.</p>
                </div>
              </div>` : ''}

            <div class="bloco">
              <h2>Localização</h2>
              <div id="mapa-imovel"></div>
              <p class="nota">Localização aproximada. O endereço completo é enviado quando a visita é confirmada.</p>
            </div>
          </div>

          <aside class="painel" id="painel">
            <div class="painel-preco">${precoHtml}</div>
            <div class="abas">
              <button type="button" class="aba ativa" data-aba="visita">Agendar visita</button>
              <button type="button" class="aba" data-aba="proposta">Fazer proposta</button>
            </div>

            <form id="form-visita" class="form-grade" novalidate>
              <span class="rotulo-sec">Escolha um dia</span>
              <div class="dias" id="dias"></div>
              <span class="rotulo-sec" style="margin-top:8px">Horário</span>
              <div class="horarios" id="horarios"></div>
              <label>Seu nome<input class="entrada" name="nome" autocomplete="name" required></label>
              <label>Telefone / WhatsApp<input class="entrada" name="tel" type="tel" autocomplete="tel" inputmode="tel" required></label>
              <button class="btn btn-primario btn-bloco" type="submit">${ic('calendario')} Agendar visita</button>
              <p class="aviso-form">Você confirma pelo WhatsApp com um corretor. Grátis e sem compromisso.</p>
            </form>

            <form id="form-proposta" class="form-grade" novalidate hidden>
              <label>Valor que você propõe ${aluguel ? '(aluguel mensal)' : ''}<input class="entrada" name="valor" inputmode="numeric" placeholder="${brl(i.preco)}" required></label>
              ${aluguel ? '<label>Data em que quer se mudar<input class="entrada" name="mudanca" type="date"></label>' : '<label>Forma de pagamento<select class="entrada" name="pagto"><option>Financiamento</option><option>À vista</option><option>Permuta + complemento</option><option>Ainda não sei</option></select></label>'}
              <label>Mensagem (opcional)<textarea class="entrada" name="msg" placeholder="Ex.: preciso que o imóvel esteja pintado"></textarea></label>
              <label>Seu nome<input class="entrada" name="nome" autocomplete="name" required></label>
              <label>Telefone / WhatsApp<input class="entrada" name="tel" type="tel" autocomplete="tel" inputmode="tel" required></label>
              <button class="btn btn-primario btn-bloco" type="submit">${ic('chat')} Enviar proposta</button>
              <p class="aviso-form">O corretor leva sua proposta ao proprietário e te responde.</p>
            </form>
          </aside>
        </div>

        ${similares.length ? `<section class="secao" style="padding-top:24px">
          <div class="secao-cab"><div><h2>Você também pode gostar</h2></div></div>
          <div class="trilho">${similares.map(card).join('')}</div></section>` : ''}
      </div>

      <div class="barra-mobile">
        <div><b>${aluguel ? brl(total(i)) : brl(i.preco)}</b><small>${aluguel ? 'total por mês' : lanc ? 'a partir de' : 'valor de venda'}</small></div>
        <button class="btn btn-primario" id="ir-agendar">Agendar visita</button>
      </div>`;
    document.body.classList.add('tem-barra');

    // Galeria
    $$('[data-foto]').forEach(b => b.addEventListener('click', () => abrirLightbox(i, Number(b.dataset.foto))));

    // Compartilhar
    $('#compartilhar').addEventListener('click', async () => {
      if (navigator.share) {
        try { await navigator.share({ title: i.titulo, url: link }); } catch { /* cancelado */ }
      } else {
        try { await navigator.clipboard.writeText(link); toast('Link copiado'); } catch { prompt('Copie o link:', link); }
      }
    });

    // Abas do painel
    $$('#painel .aba').forEach(b => b.addEventListener('click', () => {
      $$('#painel .aba').forEach(x => x.classList.toggle('ativa', x === b));
      $('#form-visita').hidden = b.dataset.aba !== 'visita';
      $('#form-proposta').hidden = b.dataset.aba !== 'proposta';
    }));
    $('#ir-agendar').addEventListener('click', () => {
      $('#painel .aba[data-aba="visita"]').click();
      $('#painel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Dias e horários de visita
    const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
    const dias = [];
    for (let d = new Date(), k = 0; dias.length < 12; k++) {
      const dia = new Date(d.getFullYear(), d.getMonth(), d.getDate() + k + 1);
      if (dia.getDay() !== 0) dias.push(dia); // sem visitas aos domingos
    }
    let diaSel = 0, horaSel = null;
    $('#dias').innerHTML = dias.map((d, k) => `<button type="button" class="dia ${k === 0 ? 'ativo' : ''}" data-k="${k}"><small>${DIAS[d.getDay()]}</small><b>${d.getDate()}</b><small>${d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</small></button>`).join('');
    function montarHorarios() {
      const sabado = dias[diaSel].getDay() === 6;
      const horas = sabado ? ['09:00', '10:00', '11:00', '12:00', '13:00'] : ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
      if (!horas.includes(horaSel)) horaSel = null;
      $('#horarios').innerHTML = horas.map(h => `<button type="button" class="chip ${h === horaSel ? 'ativo' : ''}" data-h="${h}">${h}</button>`).join('');
    }
    $('#dias').addEventListener('click', e => {
      const b = e.target.closest('.dia'); if (!b) return;
      diaSel = Number(b.dataset.k);
      $$('#dias .dia').forEach(x => x.classList.toggle('ativo', x === b));
      montarHorarios();
    });
    $('#horarios').addEventListener('click', e => {
      const b = e.target.closest('.chip'); if (!b) return;
      horaSel = b.dataset.h;
      $$('#horarios .chip').forEach(x => x.classList.toggle('ativo', x === b));
    });
    montarHorarios();

    const resumo = `${i.titulo} (${i.tipo}, ${i.bairro}) · ${aluguel ? brl(total(i)) + '/mês' : brl(i.preco)}\n${link}`;
    $('#form-visita').addEventListener('submit', e => {
      e.preventDefault();
      const f = e.target;
      if (!validar(f)) return;
      if (!horaSel) { toast('Escolha um horário para a visita'); return; }
      const data = dias[diaSel].toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
      abrirWhats(`Olá! Quero agendar uma visita.\n\nImóvel: ${resumo}\n\nDia: ${data} às ${horaSel}\nNome: ${f.nome.value}\nTelefone: ${f.tel.value}`);
    });
    $('#form-proposta').addEventListener('submit', e => {
      e.preventDefault();
      const f = e.target;
      if (!validar(f)) return;
      const extra = aluguel
        ? (f.mudanca.value ? `\nMudança prevista: ${new Date(f.mudanca.value + 'T12:00').toLocaleDateString('pt-BR')}` : '')
        : `\nPagamento: ${f.pagto.value}`;
      abrirWhats(`Olá! Quero fazer uma proposta.\n\nImóvel: ${resumo}\n\nValor proposto: ${f.valor.value}${extra}${f.msg.value ? `\nObservações: ${f.msg.value}` : ''}\nNome: ${f.nome.value}\nTelefone: ${f.tel.value}`);
    });

    // Simulador de financiamento (sistema SAC, o mais usado pelos bancos)
    if (!aluguel) {
      const calc = () => {
        const ent = Number($('#sim-ent').value) / 100;
        const anos = Number($('#sim-prazo').value);
        const jurosAno = Math.max(0, Number($('#sim-juros').value) || 0) / 100;
        const jm = Math.pow(1 + jurosAno, 1 / 12) - 1;
        const fin = i.preco * (1 - ent);
        const meses = anos * 12;
        const amort = fin / meses;
        $('#sim-ent-txt').textContent = `${Math.round(ent * 100)}% (${brl(i.preco * ent)})`;
        $('#sim-fin').textContent = brl(fin);
        $('#sim-sac').textContent = brl(amort + fin * jm);
        $('#sim-ult').textContent = brl(amort + amort * jm);
      };
      ['sim-ent', 'sim-prazo', 'sim-juros'].forEach(id => $('#' + id).addEventListener('input', calc));
      calc();
    }

    // Mapa com área aproximada
    if (window.L) {
      mapaAtivo = L.map('mapa-imovel', { scrollWheelZoom: false }).setView([i.lat, i.lng], 15);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19, subdomains: 'abcd',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(mapaAtivo);
      L.circle([i.lat, i.lng], { radius: 280, color: '#0E3B39', weight: 2, fillColor: '#165A55', fillOpacity: .18 }).addTo(mapaAtivo);
    }
  }

  function validar(form) {
    let ok = true;
    $$('[required]', form).forEach(el => {
      const vazio = !el.value.trim();
      el.classList.toggle('erro-campo', vazio);
      if (vazio && ok) { el.focus(); ok = false; }
    });
    if (!ok) toast('Preencha os campos destacados');
    return ok;
  }

  function abrirLightbox(i, inicio) {
    let k = inicio;
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-label', 'Fotos do imóvel');
    lb.innerHTML = `
      <div class="lightbox-topo"><span id="lb-cont"></span><button class="btn-icone" id="lb-fechar" aria-label="Fechar">${ic('x')}</button></div>
      <div class="lightbox-foto">
        <img id="lb-img" alt="">
        ${i.fotos.length > 1 ? `<button class="lightbox-nav ant" aria-label="Foto anterior">${ic('esq')}</button><button class="lightbox-nav prox" aria-label="Próxima foto">${ic('dir')}</button>` : ''}
      </div>
      <div class="lightbox-miniaturas">${i.fotos.map((s, n) => `<button data-n="${n}" aria-label="Foto ${n + 1}">${foto(s, `${i.titulo}, foto ${n + 1}`)}</button>`).join('')}</div>`;
    document.body.appendChild(lb);
    document.body.style.overflow = 'hidden';
    const mostrar = () => {
      const img = $('#lb-img', lb);
      delete img.dataset.ph;
      img.src = i.fotos[k];
      img.alt = `${i.titulo}, foto ${k + 1}`;
      $('#lb-cont', lb).textContent = `${k + 1} / ${i.fotos.length}`;
      $$('.lightbox-miniaturas button', lb).forEach((b, n) => b.classList.toggle('ativo', n === k));
    };
    const mover = d => { k = (k + d + i.fotos.length) % i.fotos.length; mostrar(); };
    const fechar = () => { lb.remove(); document.body.style.overflow = ''; document.removeEventListener('keydown', tecla); };
    const tecla = e => { if (e.key === 'Escape') fechar(); if (e.key === 'ArrowLeft') mover(-1); if (e.key === 'ArrowRight') mover(1); };
    $('#lb-fechar', lb).addEventListener('click', fechar);
    $('.ant', lb)?.addEventListener('click', () => mover(-1));
    $('.prox', lb)?.addEventListener('click', () => mover(1));
    $('.lightbox-miniaturas', lb).addEventListener('click', e => { const b = e.target.closest('button'); if (b) { k = Number(b.dataset.n); mostrar(); } });
    lb.addEventListener('click', e => { if (e.target.classList.contains('lightbox-foto')) fechar(); });
    document.addEventListener('keydown', tecla);
    mostrar();
    $('#lb-fechar', lb).focus();
  }

  // ---------------------------------------------------------- lançamentos
  function paginaLancamentos(params) {
    const p = new URLSearchParams(params);
    const status = p.get('status') || '';
    const todos = IMOVEIS.filter(ehLancamento);
    const estagios = [...new Set(todos.map(i => i.status).filter(Boolean))];
    const lista = status ? todos.filter(i => i.status === status) : todos;
    document.title = `Lançamentos · ${C.nome}`;

    app.innerHTML = `
      <section class="cab-pagina">
        <div class="container">
          <h1>Lançamentos dos melhores incorporadores</h1>
          <p>Imóveis na planta, em obras e prontos para morar, com condições exclusivas para clientes Enares.</p>
          <div class="chips">
            <a class="chip ${!status ? 'ativo' : ''}" href="#/lancamentos" style="text-decoration:none">Todos</a>
            ${estagios.map(s => `<a class="chip ${s === status ? 'ativo' : ''}" style="text-decoration:none" href="#/lancamentos?status=${encodeURIComponent(s)}">${esc(s)}</a>`).join('')}
          </div>
        </div>
      </section>
      <div class="container">
        <section class="secao">
          <div class="grade">${lista.map(card).join('') || '<div class="vazio" style="grid-column:1/-1"><h3>Nenhum lançamento neste estágio no momento</h3></div>'}</div>
        </section>
        <section class="cta">
          <div class="cta-in">
            <div>
              <h2>Você é incorporador?</h2>
              <p>Divulgamos seu empreendimento para uma base qualificada de compradores, com equipe de corretores dedicada.</p>
            </div>
            <div class="cta-acoes">
              <a class="btn btn-dourado" target="_blank" rel="noopener" href="${whatsLink('Olá! Sou incorporador e gostaria de apresentar um empreendimento à Enares.')}">Quero ser parceiro</a>
            </div>
          </div>
        </section>
      </div>`;
  }

  // ---------------------------------------------------------- favoritos
  function paginaFavoritos() {
    const favs = lerFavs();
    const lista = IMOVEIS.filter(i => favs.includes(i.id));
    document.title = `Favoritos · ${C.nome}`;
    app.innerHTML = `
      <section class="cab-pagina"><div class="container">
        <h1>Seus favoritos</h1>
        <p>${lista.length ? `Você salvou ${plural(lista.length, 'imóvel', 'imóveis')}. Eles ficam guardados neste navegador.` : 'Toque no coração de um imóvel para guardá-lo aqui.'}</p>
      </div></section>
      <div class="container"><section class="secao">
        ${lista.length
          ? `<div class="grade">${lista.map(card).join('')}</div>
             <p style="margin-top:28px"><a class="btn btn-primario" target="_blank" rel="noopener" href="${whatsLink('Olá! Gostaria de visitar estes imóveis:\n\n' + lista.map(i => `• ${i.titulo} (${i.bairro})`).join('\n'))}">${ic('calendario')} Agendar visita a todos</a></p>`
          : `<div class="vazio"><h3>Nenhum favorito ainda</h3><p>Explore os imóveis e salve os que você mais gostar.</p>
             <p style="margin-top:16px"><a class="btn btn-primario btn-sm" href="#/busca?f=aluguel">Ver imóveis para alugar</a> <a class="btn btn-contorno btn-sm" href="#/busca?f=venda">Ver imóveis à venda</a></p></div>`}
      </section></div>`;
  }

  // ---------------------------------------------------------- anunciar
  function paginaAnunciar() {
    document.title = `Anuncie seu imóvel · ${C.nome}`;
    app.innerHTML = `
      <section class="cab-pagina"><div class="container">
        <h1>Anuncie seu imóvel com a Enares</h1>
        <p>Alugue ou venda com segurança. A gente cuida de tudo, das fotos até a assinatura do contrato.</p>
      </div></section>
      <div class="container duas-colunas">
        <div>
          <h2 style="font-size:30px;margin-bottom:22px">Como funciona</h2>
          <div class="passos">
            <div class="passo"><div><h3>Você nos conta sobre o imóvel</h3><p>Preencha o formulário. Um corretor entra em contato em até 1 dia útil.</p></div></div>
            <div class="passo"><div><h3>Avaliação e fotos profissionais</h3><p>Visitamos o imóvel, sugerimos o melhor preço com base no mercado e fazemos as fotos.</p></div></div>
            <div class="passo"><div><h3>Divulgação e visitas</h3><p>Anunciamos no nosso site e nos principais portais. Acompanhamos todas as visitas.</p></div></div>
            <div class="passo"><div><h3>Negociação e contrato</h3><p>Analisamos o cadastro dos interessados, negociamos e cuidamos da documentação.</p></div></div>
          </div>
        </div>
        <div class="caixa">
          <h2>Conte sobre o seu imóvel</h2>
          <p>Leva menos de um minuto.</p>
          <form id="form-anunciar" class="form-2" novalidate>
            <label>Quero<select class="entrada" name="finalidade"><option>Alugar</option><option>Vender</option><option>Alugar ou vender</option></select></label>
            <label>Tipo<select class="entrada" name="tipo"><option>Apartamento</option><option>Casa</option><option>Studio</option><option>Cobertura</option><option>Sala comercial</option><option>Terreno</option><option>Outro</option></select></label>
            <label class="inteiro">Bairro e cidade<input class="entrada" name="local" required placeholder="Ex.: Pinheiros, São Paulo"></label>
            <label>Área (m²)<input class="entrada" name="area" inputmode="numeric"></label>
            <label>Quartos<input class="entrada" name="quartos" inputmode="numeric"></label>
            <label class="inteiro">Valor desejado (opcional)<input class="entrada" name="valor" placeholder="Se não souber, ajudamos a avaliar"></label>
            <label>Seu nome<input class="entrada" name="nome" autocomplete="name" required></label>
            <label>Telefone / WhatsApp<input class="entrada" name="tel" type="tel" autocomplete="tel" required></label>
            <button class="btn btn-primario btn-bloco inteiro" type="submit">Enviar pelo WhatsApp</button>
          </form>
        </div>
      </div>`;
    $('#form-anunciar').addEventListener('submit', e => {
      e.preventDefault();
      const f = e.target;
      if (!validar(f)) return;
      abrirWhats(`Olá! Quero anunciar meu imóvel com a Enares.\n\nFinalidade: ${f.finalidade.value}\nTipo: ${f.tipo.value}\nLocal: ${f.local.value}` +
        (f.area.value ? `\nÁrea: ${f.area.value} m²` : '') + (f.quartos.value ? `\nQuartos: ${f.quartos.value}` : '') +
        (f.valor.value ? `\nValor desejado: ${f.valor.value}` : '') + `\n\nNome: ${f.nome.value}\nTelefone: ${f.tel.value}`);
    });
  }

  // ---------------------------------------------------------- sobre
  function paginaSobre() {
    document.title = `Sobre · ${C.nome}`;
    app.innerHTML = `
      <section class="cab-pagina"><div class="container">
        <h1>Sobre a Enares Real Estate</h1>
        <p>Uma imobiliária que une atendimento próximo e a praticidade de resolver tudo online.</p>
      </div></section>
      <div class="container duas-colunas">
        <div class="texto-longo">
          <h2>Nossa história</h2>
          <p>A Enares nasceu para simplificar a busca por um imóvel. Reunimos a nossa carteira de imóveis para alugar e vender com os lançamentos dos melhores incorporadores, tudo num só lugar.</p>
          <p>Acreditamos em informação clara: o valor total do aluguel aparece logo de cara, as fotos são reais e você agenda a visita no horário que preferir.</p>
          <p>Por trás do site existe uma equipe de corretores que conhece cada bairro e acompanha você do primeiro contato até a entrega das chaves.</p>
          <p style="font-size:13px;color:var(--tinta-3)">Edite este texto com a história real da imobiliária no arquivo app.js (função paginaSobre).</p>
        </div>
        <div class="caixa">
          <h2>Fale com a gente</h2>
          <p>Atendimento de segunda a sábado.</p>
          <div class="contato-lista">${contatos()}</div>
        </div>
      </div>`;
  }

  function contatos() {
    return `
      <a href="${whatsLink('Olá! Vim pelo site da Enares.')}" target="_blank" rel="noopener"><span class="bolha">${ic('chat')}</span><span><small>WhatsApp</small>${esc(C.telefone)}</span></a>
      <a href="tel:+${esc(C.whatsapp)}"><span class="bolha">${ic('tel')}</span><span><small>Telefone</small>${esc(C.telefone)}</span></a>
      <a href="mailto:${esc(C.email)}"><span class="bolha">${ic('email')}</span><span><small>E-mail</small>${esc(C.email)}</span></a>
      <div><span class="bolha">${ic('pin')}</span><span><small>Endereço</small>${esc(C.endereco)}</span></div>`;
  }

  function paginaNaoEncontrada() {
    document.title = `Página não encontrada · ${C.nome}`;
    app.innerHTML = `<div class="container"><div class="vazio" style="margin:60px 0"><h3>Não encontramos esta página</h3>
      <p>O imóvel pode ter sido alugado ou vendido.</p><p style="margin-top:16px"><a class="btn btn-primario btn-sm" href="#/">Voltar ao início</a></p></div></div>`;
  }

  // ---------------------------------------------------------- rotas
  function rotaAtual() {
    const h = location.hash.replace(/^#\/?/, '');
    const [caminho, query = ''] = h.split('?');
    const partes = caminho.split('/').filter(Boolean);
    return { caminho: partes[0] || '', arg: partes[1] ? decodeURIComponent(partes[1]) : '', query };
  }

  function render() {
    if (mapaAtivo) { mapaAtivo.remove(); mapaAtivo = null; }
    document.body.classList.remove('tem-barra');
    $('#menu').classList.remove('aberto');
    $('#abrir-menu').setAttribute('aria-expanded', 'false');

    const { caminho, arg, query } = rotaAtual();
    const f = new URLSearchParams(query).get('f');
    $$('#menu a').forEach(a => a.classList.toggle('ativo',
      a.dataset.rota === (caminho === 'busca' ? (f || 'aluguel') : caminho)));

    switch (caminho) {
      case '': document.title = `${C.nome} · Imóveis para alugar e comprar`; paginaInicio(); break;
      case 'busca': paginaBusca(query); break;
      case 'imovel': paginaImovel(arg); break;
      case 'lancamentos': paginaLancamentos(query); break;
      case 'favoritos': paginaFavoritos(); break;
      case 'anunciar': paginaAnunciar(); break;
      case 'sobre': paginaSobre(); break;
      default: paginaNaoEncontrada();
    }
    window.scrollTo(0, 0);
  }

  // ---------------------------------------------------------- planilha (opcional)
  // Lê CSV respeitando aspas, inclusive campos com vírgula e quebra de linha.
  function lerCSV(texto) {
    const linhas = [];
    let linha = [], campo = '', aspas = false;
    for (let k = 0; k < texto.length; k++) {
      const c = texto[k];
      if (aspas) {
        if (c === '"' && texto[k + 1] === '"') { campo += '"'; k++; }
        else if (c === '"') aspas = false;
        else campo += c;
      } else if (c === '"') aspas = true;
      else if (c === ',') { linha.push(campo); campo = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && texto[k + 1] === '\n') k++;
        linha.push(campo); linhas.push(linha); linha = []; campo = '';
      } else campo += c;
    }
    if (campo || linha.length) { linha.push(campo); linhas.push(linha); }
    const [cab, ...resto] = linhas;
    const chaves = cab.map(c => c.trim());
    return resto.filter(l => l.some(v => v.trim())).map(l => Object.fromEntries(chaves.map((ch, n) => [ch, (l[n] || '').trim()])));
  }
  // Aceita "R$ 1.250.000,00", "1250000", "4.200" etc.
  function dinheiro(v) {
    let s = String(v || '').replace(/[^\d.,-]/g, '');
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    return Number(s) || 0;
  }
  const coord = v => parseFloat(String(v || '').replace(',', '.'));
  const sim = v => /^(sim|s|x|1|true|verdadeiro)$/i.test(String(v || '').trim());
  const inteiro = v => parseInt(v, 10) || 0;

  function deLinhaPlanilha(l) {
    return {
      id: l.id, titulo: l.titulo, finalidade: normalizar(l.finalidade).startsWith('vend') ? 'venda' : 'aluguel',
      tipo: l.tipo || 'Apartamento', origem: normalizar(l.origem).startsWith('incorp') ? 'incorporador' : 'imobiliaria',
      incorporador: l.incorporador, empreendimento: l.empreendimento, status: l.status, entrega: l.entrega, tipologias: l.tipologias,
      bairro: l.bairro, cidade: l.cidade, endereco: l.endereco, lat: coord(l.lat), lng: coord(l.lng),
      preco: dinheiro(l.preco), condominio: dinheiro(l.condominio), iptu: dinheiro(l.iptu),
      area: inteiro(l.area), quartos: inteiro(l.quartos), suites: inteiro(l.suites), banheiros: inteiro(l.banheiros),
      vagas: inteiro(l.vagas), andar: inteiro(l.andar),
      pet: sim(l.pet), mobiliado: sim(l.mobiliado), metro: sim(l.metro), destaque: sim(l.destaque),
      fotos: String(l.fotos || '').split(/[|\n]/).map(s => s.trim()).filter(Boolean),
      descricao: l.descricao, caracteristicas: String(l.caracteristicas || '').split(';').map(s => s.trim()).filter(Boolean),
    };
  }

  function imovelValido(i) {
    if (!i.id || !i.titulo) return false;
    if (Number.isNaN(i.lat) || Number.isNaN(i.lng)) { console.warn(`Imóvel "${i.titulo}" sem lat/lng válidos: não será exibido.`); return false; }
    if (!i.fotos.length) i.fotos = [''];
    return true;
  }

  async function carregarImoveis() {
    if (C.urlPlanilha) {
      try {
        const r = await fetch(C.urlPlanilha);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const lista = lerCSV(await r.text()).map(deLinhaPlanilha).filter(imovelValido);
        if (lista.length) return lista;
        console.warn('Planilha sem imóveis válidos; usando imoveis.js');
      } catch (erro) {
        console.error('Não foi possível ler a planilha; usando imoveis.js', erro);
      }
    }
    return (window.ENARES_IMOVEIS || []).filter(imovelValido);
  }

  // ---------------------------------------------------------- início
  async function iniciar() {
    preencherIcones();
    $('#topo-whats').href = whatsLink('Olá! Vim pelo site da Enares.');
    $('#rodape-contato').insertAdjacentHTML('beforeend', `
      <a href="${whatsLink('Olá! Vim pelo site da Enares.')}" target="_blank" rel="noopener">WhatsApp ${esc(C.telefone)}</a>
      <a href="mailto:${esc(C.email)}">${esc(C.email)}</a>
      <a>${esc(C.endereco)}</a>
      ${C.instagram ? `<a href="${esc(C.instagram)}" target="_blank" rel="noopener">Instagram</a>` : ''}`);
    $('#rodape-base').innerHTML = `<span>© ${new Date().getFullYear()} ${esc(C.nome)} · ${esc(C.creci)}</span><span>Valores e disponibilidade sujeitos a alteração.</span>`;
    $('#abrir-menu').addEventListener('click', () => {
      const aberto = $('#menu').classList.toggle('aberto');
      $('#abrir-menu').setAttribute('aria-expanded', aberto);
    });

    app.innerHTML = '<div class="carregando">Carregando imóveis…</div>';
    IMOVEIS = await carregarImoveis();
    atualizarContadorFav();
    window.addEventListener('hashchange', render);
    render();
  }

  iniciar();
})();
