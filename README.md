# Site institucional do Aulexis

Página única feita com Vite, GSAP (animações de rolagem) e Lenis (rolagem suave).

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
- `src/main.js`: abertura, sistema orbital, ciclo, simulação de fluência, painéis e formulário.
- `src/graficos.js`: os gráficos da seção de painéis. Os dados são fictícios.
- `public/marca`: a logo.

A abertura aparece uma vez por sessão do navegador. Para ver de novo, abra uma aba anônima.
