# Site Enares Real Estate

Site de imóveis para **alugar e comprar**, com imóveis da imobiliária e **lançamentos de incorporadores**.
Funciona sem servidor e sem mensalidade: são arquivos estáticos que podem ser hospedados de graça (por exemplo, no GitHub Pages).

## O que o site tem

- **Página inicial** com busca rápida (Alugar / Comprar / Lançamentos) e vitrines de destaque
- **Busca com filtros**: localização, tipo, valor, quartos, vagas, área, aceita pet, mobiliado, perto do metrô e só lançamentos. Os resultados aparecem em lista e num mapa com o preço em cada pino
- **Página do imóvel**: galeria de fotos com tela cheia, valor total do aluguel (aluguel + condomínio + IPTU), características, mapa com a localização aproximada e imóveis parecidos
- **Agendar visita**: o cliente escolhe o dia e o horário, e a mensagem chega pronta no WhatsApp da imobiliária
- **Fazer proposta**, também enviada pelo WhatsApp
- **Simulador de financiamento** (tabela SAC) nos imóveis à venda
- **Lançamentos** com incorporador, estágio da obra e previsão de entrega
- **Favoritos**: o cliente salva imóveis com o coração (ficam guardados no navegador dele)
- **Anunciar imóvel**: formulário para proprietários
- **Sobre / contato**
- Funciona bem no celular

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `config.js` | **Comece por aqui.** WhatsApp, telefone, e-mail, endereço, CRECI e o link da planilha |
| `imoveis.js` | Imóveis de exemplo (usados enquanto não houver planilha) |
| `modelo-planilha.csv` | Modelo para importar no Google Planilhas |
| `estilo.css` | Visual do site. As cores ficam no topo do arquivo (`--verde`, `--dourado`) |
| `app.js` | Funcionamento do site. O texto da página "Sobre" fica na função `paginaSobre` |

## Como cadastrar imóveis pela planilha do Google

1. No Google Planilhas: **Arquivo → Importar → Fazer upload** e escolha `modelo-planilha.csv`.
2. Troque os imóveis de exemplo pelos seus. Uma linha é um imóvel.
3. **Arquivo → Compartilhar → Publicar na web**, escolha a aba e o formato **CSV**, e copie o link.
4. Cole o link em `urlPlanilha`, dentro do `config.js`.

Pronto: ao adicionar ou editar uma linha na planilha, o site é atualizado (o Google pode levar alguns minutos para publicar a mudança).

### Colunas da planilha

- `id`: identificador único, sem espaços (aparece no link do imóvel). Ex.: `ap-pinheiros-68`
- `finalidade`: `aluguel` ou `venda`
- `origem`: `imobiliaria` ou `incorporador`
- `incorporador`, `empreendimento`, `status` (Na planta / Em obras / Pronto para morar), `entrega`, `tipologias`: só para lançamentos
- `preco`: aluguel mensal ou valor de venda. Em lançamentos, é o valor "a partir de". Aceita `4200`, `4.200` ou `R$ 1.250.000,00`
- `condominio`, `iptu`: valores **mensais**
- `lat`, `lng`: coordenadas. No Google Maps, clique com o botão direito no local e copie os números
- `pet`, `mobiliado`, `metro`, `destaque`: `sim` ou `não`. Os imóveis em destaque aparecem primeiro
- `fotos`: links das fotos separados por `|`. A primeira é a capa
- `caracteristicas`: separadas por `;`

## Como publicar de graça (GitHub Pages)

1. No GitHub, abra o repositório → **Settings → Pages**.
2. Em *Branch*, escolha a branch e a pasta `/ (root)` e salve.
3. O site fica em `https://<seu-usuario>.github.io/<repositorio>/enares/`.

Para usar um domínio próprio (ex.: `enaresrealestate.com.br`), registre-o no Registro.br e configure-o em **Settings → Pages → Custom domain**.

## Próximas fases (ideias)

- Login de clientes, com favoritos sincronizados entre aparelhos
- Painel para o proprietário acompanhar visitas e propostas
- Contrato com assinatura digital (Clicksign, D4Sign)
- Cobrança do aluguel e repasse (Asaas, Iugu)
- Garantia locatícia por meio de seguradoras ou garantidoras parceiras
