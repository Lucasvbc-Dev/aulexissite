# Site institucional do Aulexis

Página única feita com Vite e JavaScript puro, sem outras dependências.

A capa escura traz o sistema orbital com os módulos girando em volta da logo e o título "Cada ___ conta.". Depois, a ideia central: cada ponto na tela é um aluno (fictício). Conforme a página rola, os mesmos pontos viram um cartão-resposta, são lidos pela câmera, formam a curva da TRI, se separam por nível, se espalham pelo mapa das escolas e terminam em um único aluno.

## Rodar

```bash
npm install
npm run dev
```

Abre em http://localhost:5181

## Publicar

```bash
npm run build
```

Os arquivos finais saem na pasta `dist/`.

## Antes de publicar

Em `src/config.js`:

- `URL_PLATAFORMA`: endereço da tela de login usado pelos botões "Entrar".
- `EMAIL_CONTATO`: e-mail que recebe os pedidos de demonstração.

## Estrutura

- `index.html`: o conteúdo de todas as seções.
- `src/estilo.css`: o visual.
- `src/historia.js`: a história em pontos (canvas), com as sete formações e a dica ao passar o mouse.
- `src/main.js`: capa (céu de estrelas, órbita e palavra que troca), topo, marca-texto, simulação de fluência, cards dos módulos, papéis e o contador da rede no contato.
- `public/marca`: a logo.

Todos os alunos, escolas e números da história são fictícios.
