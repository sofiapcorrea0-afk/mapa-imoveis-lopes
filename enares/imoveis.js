// ============================================================
//  IMÓVEIS DE EXEMPLO
//  Enquanto não houver planilha configurada (config.js), o site
//  mostra estes imóveis. Fotos e dados são apenas ilustrativos.
//
//  finalidade: 'aluguel' ou 'venda'
//  origem:     'imobiliaria' (carteira própria) ou 'incorporador'
//  preco:      aluguel mensal (aluguel) ou valor de venda (venda);
//              em lançamentos, é o valor "a partir de"
//  iptu:       valor MENSAL
// ============================================================
(function () {
  const f = id => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=70`;

  const SALA1 = f('photo-1502672260266-1c1ef2d93688');
  const SALA2 = f('photo-1560448204-e02f11c3d0e2');
  const SALA3 = f('photo-1493809842364-78817add7ffb');
  const SALA4 = f('photo-1554995207-c18c203602cb');
  const SALA5 = f('photo-1586023492125-27b2c045efd7');
  const APTO = f('photo-1522708323590-d24dbb6b0267');
  const COZ1 = f('photo-1484154218962-a197022b5858');
  const COZ2 = f('photo-1556912173-3bb406ef7e77');
  const QUARTO = f('photo-1505691938895-1758d7feb511');
  const INT1 = f('photo-1600566753190-17f0baa2a6c3');
  const INT2 = f('photo-1600607687939-ce8a6c25118c');
  const CASA1 = f('photo-1600585154340-be6161a56a0c');
  const CASA2 = f('photo-1600596542815-ffad4c1539a9');
  const CASA3 = f('photo-1512917774080-9991f1c4c750');
  const CASA4 = f('photo-1613490493576-7fde63acd811');
  const PREDIO1 = f('photo-1545324418-cc1a3fa10c00');
  const PREDIO2 = f('photo-1460317442991-0ec209397118');
  const PREDIO3 = f('photo-1574362848149-11496d93a7c7');

  window.ENARES_IMOVEIS = [
    {
      id: 'ap-pinheiros-68', titulo: 'Apartamento com varanda a 5 min do metrô',
      finalidade: 'aluguel', tipo: 'Apartamento', origem: 'imobiliaria',
      bairro: 'Pinheiros', cidade: 'São Paulo', endereco: 'Rua dos Pinheiros',
      lat: -23.5662, lng: -46.6919,
      preco: 4200, condominio: 980, iptu: 160,
      area: 68, quartos: 2, suites: 1, banheiros: 2, vagas: 1, andar: 7,
      pet: true, mobiliado: false, metro: true, destaque: true,
      fotos: [SALA1, COZ1, QUARTO, SALA2, APTO],
      descricao: 'Apartamento claro, com varanda gourmet e vista livre. Sala integrada à cozinha americana, suíte com armários e segundo quarto que funciona bem como escritório. A poucos minutos a pé do metrô Fradique Coutinho, de padarias, restaurantes e do Largo da Batata.',
      caracteristicas: ['Varanda gourmet', 'Armários planejados', 'Portaria 24h', 'Academia', 'Bicicletário', 'Lavanderia'],
    },
    {
      id: 'st-consolacao-28', titulo: 'Studio mobiliado pronto para morar',
      finalidade: 'aluguel', tipo: 'Studio', origem: 'imobiliaria',
      bairro: 'Consolação', cidade: 'São Paulo', endereco: 'Rua Augusta',
      lat: -23.5530, lng: -46.6600,
      preco: 2300, condominio: 650, iptu: 70,
      area: 28, quartos: 1, suites: 0, banheiros: 1, vagas: 0, andar: 12,
      pet: true, mobiliado: true, metro: true, destaque: true,
      fotos: [SALA4, COZ2, SALA5],
      descricao: 'Studio completo, com cama, sofá, cozinha equipada e máquina de lavar. Prédio novo com coworking, lavanderia e rooftop. Ideal para quem quer morar perto da Paulista e chegar a pé ao metrô.',
      caracteristicas: ['Mobiliado', 'Coworking', 'Rooftop', 'Lavanderia coletiva', 'Fechadura digital'],
    },
    {
      id: 'cs-vilamadalena-140', titulo: 'Casa com quintal em rua tranquila',
      finalidade: 'aluguel', tipo: 'Casa', origem: 'imobiliaria',
      bairro: 'Vila Madalena', cidade: 'São Paulo', endereco: 'Rua Harmonia',
      lat: -23.5530, lng: -46.6913,
      preco: 7800, condominio: 0, iptu: 420,
      area: 140, quartos: 3, suites: 1, banheiros: 3, vagas: 2,
      pet: true, mobiliado: false, metro: false, destaque: true,
      fotos: [CASA1, SALA3, COZ1, QUARTO],
      descricao: 'Sobrado reformado, com quintal arborizado e churrasqueira. Três quartos, sendo uma suíte com closet, sala em dois ambientes e lavabo. Rua residencial e silenciosa, perto da Praça do Pôr do Sol.',
      caracteristicas: ['Quintal', 'Churrasqueira', 'Closet', 'Lavabo', 'Edícula'],
    },
    {
      id: 'ap-moema-95', titulo: 'Apartamento familiar perto do Ibirapuera',
      finalidade: 'aluguel', tipo: 'Apartamento', origem: 'imobiliaria',
      bairro: 'Moema', cidade: 'São Paulo', endereco: 'Alameda dos Arapanés',
      lat: -23.6000, lng: -46.6650,
      preco: 6200, condominio: 1400, iptu: 290,
      area: 95, quartos: 3, suites: 1, banheiros: 2, vagas: 2, andar: 4,
      pet: false, mobiliado: false, metro: true, destaque: false,
      fotos: [SALA2, INT1, COZ2, QUARTO],
      descricao: 'Três dormitórios em prédio com lazer completo: piscina, quadra e playground. A poucas quadras do Parque Ibirapuera e da estação Moema da linha 5.',
      caracteristicas: ['Piscina', 'Playground', 'Quadra', 'Salão de festas', 'Depósito privativo'],
    },
    {
      id: 'ap-tatuape-62', titulo: 'Apartamento 2 quartos com lazer completo',
      finalidade: 'aluguel', tipo: 'Apartamento', origem: 'imobiliaria',
      bairro: 'Tatuapé', cidade: 'São Paulo', endereco: 'Rua Tuiuti',
      lat: -23.5400, lng: -46.5760,
      preco: 2900, condominio: 620, iptu: 95,
      area: 62, quartos: 2, suites: 0, banheiros: 1, vagas: 1, andar: 9,
      pet: true, mobiliado: false, metro: true, destaque: false,
      fotos: [APTO, COZ1, SALA4],
      descricao: 'Ótima planta, com sala ampla e cozinha separada. Condomínio com piscina, academia e espaço gourmet. Perto do metrô Tatuapé e de shoppings.',
      caracteristicas: ['Piscina', 'Academia', 'Espaço gourmet', 'Portaria 24h'],
    },
    {
      id: 'sl-itaim-45', titulo: 'Sala comercial no coração do Itaim',
      finalidade: 'aluguel', tipo: 'Sala comercial', origem: 'imobiliaria',
      bairro: 'Itaim Bibi', cidade: 'São Paulo', endereco: 'Rua Joaquim Floriano',
      lat: -23.5850, lng: -46.6780,
      preco: 3800, condominio: 900, iptu: 210,
      area: 45, quartos: 0, suites: 0, banheiros: 1, vagas: 1, andar: 15,
      pet: false, mobiliado: false, metro: false, destaque: false,
      fotos: [INT2, PREDIO3],
      descricao: 'Conjunto comercial com piso elevado, ar-condicionado e copa. Edifício com recepção, controle de acesso e auditório compartilhado.',
      caracteristicas: ['Ar-condicionado', 'Piso elevado', 'Recepção', 'Auditório', 'Gerador'],
    },
    {
      id: 'ap-perdizes-82', titulo: 'Apartamento reformado com suíte',
      finalidade: 'venda', tipo: 'Apartamento', origem: 'imobiliaria',
      bairro: 'Perdizes', cidade: 'São Paulo', endereco: 'Rua Cardoso de Almeida',
      lat: -23.5370, lng: -46.6780,
      preco: 980000, condominio: 1100, iptu: 260,
      area: 82, quartos: 2, suites: 1, banheiros: 2, vagas: 1, andar: 6,
      pet: true, mobiliado: false, metro: false, destaque: true,
      fotos: [SALA3, COZ2, QUARTO, SALA1],
      descricao: 'Totalmente reformado, com piso de madeira, cozinha nova e iluminação embutida. Prédio bem conservado, em rua arborizada perto da PUC e do Allianz Parque.',
      caracteristicas: ['Reformado', 'Piso de madeira', 'Varanda', 'Portaria 24h', 'Salão de festas'],
    },
    {
      id: 'cb-jardins-210', titulo: 'Cobertura duplex com terraço e piscina',
      finalidade: 'venda', tipo: 'Cobertura', origem: 'imobiliaria',
      bairro: 'Jardim Paulista', cidade: 'São Paulo', endereco: 'Alameda Lorena',
      lat: -23.5700, lng: -46.6600,
      preco: 3400000, condominio: 3200, iptu: 1100,
      area: 210, quartos: 3, suites: 3, banheiros: 4, vagas: 3, andar: 18,
      pet: true, mobiliado: false, metro: true, destaque: true,
      fotos: [CASA4, SALA2, INT1, QUARTO, COZ1],
      descricao: 'Cobertura com terraço, piscina privativa e vista para a cidade. Três suítes, home office e living com pé-direito duplo. Entre a Oscar Freire e a Avenida Paulista.',
      caracteristicas: ['Piscina privativa', 'Terraço', 'Pé-direito duplo', 'Home office', 'Churrasqueira', 'Depósito'],
    },
    {
      id: 'cs-butanta-180', titulo: 'Casa em condomínio fechado',
      finalidade: 'venda', tipo: 'Casa', origem: 'imobiliaria',
      bairro: 'Butantã', cidade: 'São Paulo', endereco: 'Rua Camargo',
      lat: -23.5710, lng: -46.7080,
      preco: 1450000, condominio: 850, iptu: 380,
      area: 180, quartos: 3, suites: 1, banheiros: 3, vagas: 2,
      pet: true, mobiliado: false, metro: true, destaque: false,
      fotos: [CASA3, SALA5, COZ2],
      descricao: 'Casa em condomínio com segurança 24h e área verde. Jardim, varanda e espaço gourmet. Perto da USP e da estação Butantã.',
      caracteristicas: ['Condomínio fechado', 'Jardim', 'Espaço gourmet', 'Segurança 24h'],
    },

    // ---------- Lançamentos de incorporadores ----------
    {
      id: 'lc-aurora-vilamariana', titulo: 'Residencial Aurora',
      finalidade: 'venda', tipo: 'Apartamento', origem: 'incorporador',
      incorporador: 'Vértice Incorporadora', empreendimento: 'Residencial Aurora',
      status: 'Na planta', entrega: 'Dez/2028', tipologias: '2 e 3 quartos · 58 a 86 m²',
      bairro: 'Vila Mariana', cidade: 'São Paulo', endereco: 'Rua Domingos de Morais',
      lat: -23.5890, lng: -46.6340,
      preco: 720000, condominio: 0, iptu: 0,
      area: 58, quartos: 2, suites: 1, banheiros: 2, vagas: 1,
      pet: true, mobiliado: false, metro: true, destaque: true,
      fotos: [PREDIO1, SALA1, COZ1],
      descricao: 'Lançamento a 400 m do metrô Vila Mariana. Plantas de 2 e 3 dormitórios, varanda com churrasqueira e lazer no rooftop. Condições especiais de pagamento direto com a incorporadora durante a obra.',
      caracteristicas: ['Rooftop', 'Piscina', 'Pet place', 'Coworking', 'Varanda gourmet', 'Vaga para carro elétrico'],
    },
    {
      id: 'lc-parque-brooklin', titulo: 'Brooklin Parque',
      finalidade: 'venda', tipo: 'Apartamento', origem: 'incorporador',
      incorporador: 'Construtora Horizonte', empreendimento: 'Brooklin Parque',
      status: 'Em obras', entrega: 'Jun/2027', tipologias: '2 e 3 suítes · 74 a 118 m²',
      bairro: 'Brooklin', cidade: 'São Paulo', endereco: 'Rua Barão do Triunfo',
      lat: -23.6170, lng: -46.6880,
      preco: 1050000, condominio: 0, iptu: 0,
      area: 74, quartos: 2, suites: 2, banheiros: 3, vagas: 2,
      pet: true, mobiliado: false, metro: true, destaque: true,
      fotos: [PREDIO2, INT2, SALA2],
      descricao: 'Empreendimento em obras, ao lado de um parque linear. Apartamentos com 2 e 3 suítes, terraço e lazer completo com piscina aquecida, spa e quadra de beach tennis.',
      caracteristicas: ['Piscina aquecida', 'Spa', 'Beach tennis', 'Brinquedoteca', 'Terraço'],
    },
    {
      id: 'lc-vista-santana', titulo: 'Vista Santana',
      finalidade: 'venda', tipo: 'Apartamento', origem: 'incorporador',
      incorporador: 'Alto Urbano Incorporadora', empreendimento: 'Vista Santana',
      status: 'Pronto para morar', entrega: 'Entregue', tipologias: '2 quartos · 52 m²',
      bairro: 'Santana', cidade: 'São Paulo', endereco: 'Rua Voluntários da Pátria',
      lat: -23.5020, lng: -46.6250,
      preco: 560000, condominio: 520, iptu: 110,
      area: 52, quartos: 2, suites: 1, banheiros: 2, vagas: 1,
      pet: true, mobiliado: false, metro: true, destaque: false,
      fotos: [PREDIO3, APTO, COZ2],
      descricao: 'Últimas unidades prontas para morar, a 300 m do metrô Santana. Aceita financiamento bancário e FGTS.',
      caracteristicas: ['Pronto para morar', 'Aceita FGTS', 'Piscina', 'Academia', 'Salão de festas'],
    },
  ];
})();
