import './estilo.css';
import { URL_PLATAFORMA, EMAIL_CONTATO } from './config.js';
import { criarHistoria } from './historia.js';

const $ = (sel, raiz = document) => raiz.querySelector(sel);
const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];
const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const formatar = (n) => n.toLocaleString('pt-BR');

/* ---------- Links configuráveis ---------- */

$$('[data-plataforma]').forEach((a) => { a.href = URL_PLATAFORMA; });
$$('[data-email]').forEach((a) => { a.href = `mailto:${EMAIL_CONTATO}`; a.textContent = EMAIL_CONTATO; });
$('#ano').textContent = new Date().getFullYear();

/* ---------- Topo e gaveta do celular ---------- */

const topo = $('.topo');
const botaoMenu = $('.topo__menu');
const gaveta = $('.gaveta');

const fecharGaveta = () => {
  gaveta.classList.remove('aberta');
  gaveta.setAttribute('aria-hidden', 'true');
  botaoMenu.setAttribute('aria-expanded', 'false');
  atualizarTopo();
};
botaoMenu.addEventListener('click', () => {
  if (gaveta.classList.contains('aberta')) return fecharGaveta();
  gaveta.classList.add('aberta');
  gaveta.setAttribute('aria-hidden', 'false');
  botaoMenu.setAttribute('aria-expanded', 'true');
  atualizarTopo();
});
$$('a', gaveta).forEach((a) => a.addEventListener('click', fecharGaveta));

const secoesEscuras = $$('.capa, .fluencia, .contato, .rodape');
const atualizarTopo = () => {
  topo.classList.toggle('topo--rolado', window.scrollY > 10);
  const sobreEscura = secoesEscuras.some((sec) => {
    const r = sec.getBoundingClientRect();
    return r.top <= 32 && r.bottom >= 32;
  });
  topo.classList.toggle('topo--escuro', sobreEscura && !gaveta.classList.contains('aberta'));
};
window.addEventListener('scroll', atualizarTopo, { passive: true });
atualizarTopo();

const linksTopo = $$('.topo__links a');
const observadorSecoes = new IntersectionObserver((entradas) => {
  entradas.forEach((e) => {
    if (e.isIntersecting) linksTopo.forEach((a) => a.classList.toggle('ativo', a.getAttribute('href') === `#${e.target.id}`));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
['historia', 'fluencia', 'modulos', 'papeis', 'perguntas'].forEach((id) => observadorSecoes.observe(document.getElementById(id)));

/* ---------- Marca-texto passa quando o trecho aparece ---------- */

const observadorMarcas = new IntersectionObserver((entradas) => {
  entradas.forEach((e) => { if (e.isIntersecting) e.target.classList.add('passou'); });
}, { threshold: 0.8 });
$$('mark').forEach((m) => observadorMarcas.observe(m));

/* ---------- Capa: céu de alunos, luz do mouse, órbita e a palavra que troca ---------- */

const capa = $('.capa');
const temMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

if (temMouse && !semMovimento) {
  capa.addEventListener('pointermove', (e) => {
    const r = capa.getBoundingClientRect();
    capa.style.setProperty('--mx', `${e.clientX - r.left}px`);
    capa.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
}

// Estrelas: pontinhos que piscam e fogem do mouse
const ceu = $('.capa__estrelas');
const ctxCeu = ceu.getContext('2d');
const CORES_CEU = ['52,211,153', '45,212,191', '56,189,248', '148,163,184', '226,232,240'];
let estrelas = [];
let mouseCeu = { x: -999, y: -999 };
let capaVisivel = true;

function prepararCeu() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  ceu.width = ceu.clientWidth * dpr;
  ceu.height = ceu.clientHeight * dpr;
  ctxCeu.setTransform(dpr, 0, 0, dpr, 0, 0);
  const total = Math.round((ceu.clientWidth * ceu.clientHeight) / 5200);
  estrelas = Array.from({ length: total }, () => ({
    x: Math.random() * ceu.clientWidth,
    y: Math.random() * ceu.clientHeight,
    r: 0.6 + Math.random() * 1.6,
    cor: CORES_CEU[Math.floor(Math.random() * CORES_CEU.length)],
    fase: Math.random() * Math.PI * 2,
    vel: 0.6 + Math.random() * 1.4,
    ex: 0, ey: 0,
  }));
}

function desenharCeu(agora) {
  if (!capaVisivel) return;
  const t = agora / 1000;
  ctxCeu.clearRect(0, 0, ceu.clientWidth, ceu.clientHeight);
  for (const e of estrelas) {
    let ax = 0, ay = 0;
    const dx = e.x - mouseCeu.x; const dy = e.y - mouseCeu.y;
    const d = Math.hypot(dx, dy);
    if (d < 120) { const f = (1 - d / 120) * 34; ax = (dx / (d || 1)) * f; ay = (dy / (d || 1)) * f; }
    e.ex += (ax - e.ex) * 0.1; e.ey += (ay - e.ey) * 0.1;
    const brilho = semMovimento ? 0.6 : 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * e.vel + e.fase));
    ctxCeu.fillStyle = `rgba(${e.cor},${brilho.toFixed(2)})`;
    ctxCeu.beginPath();
    ctxCeu.arc(e.x + e.ex, e.y + e.ey, e.r, 0, Math.PI * 2);
    ctxCeu.fill();
  }
  if (!semMovimento) requestAnimationFrame(desenharCeu);
}

ceu.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  const r = ceu.getBoundingClientRect();
  mouseCeu = { x: e.clientX - r.left, y: e.clientY - r.top };
});
ceu.addEventListener('pointerleave', () => { mouseCeu = { x: -999, y: -999 }; });
new IntersectionObserver(([e]) => {
  const voltou = e.isIntersecting && !capaVisivel;
  capaVisivel = e.isIntersecting;
  if (voltou) requestAnimationFrame(desenharCeu);
}).observe(capa);
prepararCeu();
requestAnimationFrame(desenharCeu);

// Órbita: os oito módulos girando em volta da logo
const SATELITES = [
  { nome: 'Avaliações', icone: 'i-prova', anel: 0, fase: 0.3, desc: 'Crie, aplique e acompanhe avaliações da rede.' },
  { nome: 'Banco de questões', icone: 'i-banco', anel: 0, fase: Math.PI + 0.3, desc: 'Questões por habilidade da BNCC, série e dificuldade.' },
  { nome: 'Leitor de gabaritos', icone: 'i-camera', anel: 1, fase: 1.1, desc: 'O celular lê o cartão-resposta pela câmera.' },
  { nome: 'Digitação', icone: 'i-teclado', anel: 1, fase: 1.1 + (2 * Math.PI) / 3, desc: 'Lançamento rápido das respostas pelo teclado.' },
  { nome: 'Fluência leitora', icone: 'i-leitura', anel: 1, fase: 1.1 + (4 * Math.PI) / 3, desc: 'Palavras por minuto, precisão e nível de leitura.' },
  { nome: 'Análise TRI', icone: 'i-tri', anel: 2, fase: 0.6, desc: 'Proficiência pela Teoria de Resposta ao Item.' },
  { nome: 'Painéis da rede', icone: 'i-painel', anel: 2, fase: 0.6 + (2 * Math.PI) / 3, desc: 'Dez painéis, da rede inteira até o aluno.' },
  { nome: 'Turmas e alunos', icone: 'i-turmas', anel: 2, fase: 0.6 + (4 * Math.PI) / 3, desc: 'Escolas, turmas e alunos organizados.' },
];
// Mesmas elipses do SVG (viewBox de 1200 x 400)
const ANEIS = [
  { rx: 250, ry: 62, vel: 0.2 },
  { rx: 400, ry: 102, vel: -0.13 },
  { rx: 560, ry: 146, vel: 0.085 },
];
const PALAVRA_SATELITE = { avaliação: 0, questão: 1, gabarito: 2, resposta: 3, leitura: 4, habilidade: 5, escola: 6, aluno: 7 };

const orbital = $('.orbital');
const dicaOrbita = $('.orbital__dica');
const elsSatelites = SATELITES.map((sat, i) => {
  const el = document.createElement('div');
  el.className = 'satelite';
  el.tabIndex = 0;
  el.innerHTML = `<span class="satelite__icone"><svg><use href="#${sat.icone}" /></svg></span><span class="satelite__rotulo">${sat.nome}</span>`;
  el.addEventListener('pointerenter', () => focarSatelite(i, true));
  el.addEventListener('pointerleave', soltarSatelite);
  el.addEventListener('focus', () => focarSatelite(i, true));
  el.addEventListener('blur', soltarSatelite);
  $('.orbital__satelites').append(el);
  return el;
});

let tempoOrbita = 0;
let satAtivo = -1;
let mouseNoSatelite = false;

function focarSatelite(i, peloMouse = false) {
  if (peloMouse) mouseNoSatelite = true;
  satAtivo = i;
  elsSatelites.forEach((el, j) => el.classList.toggle('ativo', j === i));
  $('strong', dicaOrbita).textContent = SATELITES[i].nome;
  $('span', dicaOrbita).textContent = SATELITES[i].desc;
  dicaOrbita.classList.add('visivel');
}

function soltarSatelite() {
  mouseNoSatelite = false;
}

let ultimo = performance.now();
function girarOrbita(agora) {
  const dt = Math.min(0.05, (agora - ultimo) / 1000);
  ultimo = agora;
  if (capaVisivel) {
    if (!mouseNoSatelite && !semMovimento) tempoOrbita += dt;
    const w = orbital.clientWidth;
    const h = orbital.clientHeight;
    const esc = Math.min(w / 1200, h / 400);
    SATELITES.forEach((sat, i) => {
      const anel = ANEIS[sat.anel];
      const t = sat.fase + tempoOrbita * anel.vel;
      const el = elsSatelites[i];
      const meio = el.offsetWidth / 2 + 4;
      const x = Math.min(window.innerWidth / 2 + w / 2 - meio, Math.max(w / 2 - window.innerWidth / 2 + meio, w / 2 + Math.cos(t) * anel.rx * esc));
      const y = h / 2 + Math.sin(t) * anel.ry * esc;
      // A órbita nasce no pé da capa: o arco de cima é o lado visível, "da frente"
      const frente = (1 - Math.sin(t)) / 2;
      const destaque = i === satAtivo ? 1.08 : 1;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${((0.8 + frente * 0.22) * destaque).toFixed(3)})`;
      el.style.opacity = i === satAtivo ? 1 : (0.5 + frente * 0.5).toFixed(2);
      el.style.zIndex = Math.sin(t) < 0.15 || i === satAtivo ? 10 : 2;
      el.classList.toggle('atras', Math.sin(t) > 0.2 && i !== satAtivo);
    });
  }
  requestAnimationFrame(girarOrbita);
}
requestAnimationFrame(girarOrbita);

// A palavra do título troca a cada 3,2 s e acende o satélite do mesmo módulo
const palavraGiro = $('.palavra-giro');
const PALAVRAS_GIRO = palavraGiro.dataset.palavras.split(',');
let indicePalavra = 0;
focarSatelite(PALAVRA_SATELITE[PALAVRAS_GIRO[0]]);
setInterval(() => {
  if (mouseNoSatelite || !capaVisivel) return;
  indicePalavra = (indicePalavra + 1) % PALAVRAS_GIRO.length;
  const nova = PALAVRAS_GIRO[indicePalavra];
  focarSatelite(PALAVRA_SATELITE[nova]);
  if (semMovimento) { palavraGiro.textContent = nova; return; }
  palavraGiro.classList.remove('entrando');
  palavraGiro.classList.add('saindo');
  setTimeout(() => {
    palavraGiro.textContent = nova;
    palavraGiro.classList.remove('saindo');
    void palavraGiro.offsetWidth;
    palavraGiro.classList.add('entrando');
  }, 400);
}, 3200);

let esperaCeu = 0;
window.addEventListener('resize', () => { clearTimeout(esperaCeu); esperaCeu = setTimeout(prepararCeu, 150); });

/* ---------- A história em pontos ---------- */

const historia = criarHistoria({
  canvas: $('.palco__tela'),
  secao: $('.historia'),
  dica: $('.dica'),
  cartao: $('.cartao-aluno'),
  trilho: $$('.trilho li'),
});
$('.contador-alunos').textContent = formatar(historia.total);

/* ---------- Fluência: simulação de leitura ---------- */

const leituraTexto = $('.leitura__texto');
const PALAVRAS = leituraTexto.dataset.texto.split(' ');
const ERROS = new Set([11, 22]); // "passarinhos" e "sombra" saem com tropeço
leituraTexto.innerHTML = PALAVRAS.map((p) => `<span>${p}</span>`).join(' ');
const spans = $$('span', leituraTexto);
const onda = $('.leitura__onda');
onda.innerHTML = '<i></i>'.repeat(72);
const barras = $$('i', onda);
const botaoLeitura = $('.leitura__botao');
const ppmEl = $('.leitura__ppm');
const precisaoEl = $('.leitura__precisao');
const nivelEl = $('.leitura__nivel');
let lendo = false;

async function simularLeitura() {
  if (lendo) return;
  lendo = true;
  botaoLeitura.disabled = true;
  $('span:last-child', botaoLeitura).textContent = 'Ouvindo…';
  spans.forEach((s) => s.classList.remove('lida', 'atual', 'erro'));
  ppmEl.textContent = '0';
  precisaoEl.textContent = '—';
  nivelEl.textContent = 'Analisando…';
  onda.classList.add('ativa');

  const timerOnda = setInterval(() => {
    barras.forEach((b, i) => {
      const base = Math.sin(Date.now() / 140 + i * 0.5) * 0.5 + 0.5;
      b.style.height = `${10 + base * 50 + Math.random() * 40}%`;
    });
  }, 90);

  const inicio = performance.now();
  let erros = 0;
  for (let i = 0; i < spans.length; i++) {
    spans[i].classList.add('atual');
    // Ritmo de um leitor de 2º ano (~85 palavras por minuto)
    let tempo = 400 + PALAVRAS[i].length * 42;
    if (ERROS.has(i)) tempo += 520;
    if (/[.,]$/.test(PALAVRAS[i])) tempo += 320;
    await esperar(semMovimento ? 10 : tempo);
    spans[i].classList.remove('atual');
    spans[i].classList.add(ERROS.has(i) ? 'erro' : 'lida');
    if (ERROS.has(i)) erros += 1;
    const minutos = (performance.now() - inicio) / 60000;
    if (i >= 3) ppmEl.textContent = Math.round((i + 1 - erros) / minutos);
    precisaoEl.textContent = `${Math.round(((i + 1 - erros) / (i + 1)) * 100)}%`;
  }

  clearInterval(timerOnda);
  barras.forEach((b) => { b.style.height = ''; });
  onda.classList.remove('ativa');
  if (semMovimento) ppmEl.textContent = '86';
  nivelEl.textContent = 'Leitor fluente';
  botaoLeitura.disabled = false;
  $('span:last-child', botaoLeitura).textContent = 'Ouvir de novo';
  lendo = false;
}

botaoLeitura.addEventListener('click', simularLeitura);
new IntersectionObserver(([e], obs) => {
  if (e.isIntersecting) { obs.disconnect(); simularLeitura(); }
}, { threshold: 0.5 }).observe($('.leitura'));

/* ---------- Módulos: a luz do card segue o mouse ---------- */

$$('.mod').forEach((card) => {
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--x', `${e.clientX - r.left}px`);
    card.style.setProperty('--y', `${e.clientY - r.top}px`);
  });
});

/* ---------- Papéis ---------- */

const PAPEIS = [
  {
    frase: 'A rede inteira em uma tela — e as escolas que precisam de apoio primeiro.',
    itens: [
      ['Painel geral', 'com os resultados consolidados de cada edição.'],
      ['Comparativo e mapa', 'para ver escolas lado a lado e no território.'],
      ['Equidade', 'para saber quem está ficando para trás.'],
    ],
  },
  {
    frase: 'Cada turma da escola, antes que o bimestre acabe.',
    itens: [
      ['Resultados por turma', 'e por habilidade da BNCC.'],
      ['Série histórica', 'para ver se o reforço está funcionando.'],
      ['Correção pela câmera', 'sem esperar a secretaria.'],
    ],
  },
  {
    frase: 'O que cada aluno errou — e o que retomar amanhã.',
    itens: [
      ['Resultado por aluno', 'com as habilidades que mais pesaram.'],
      ['Evolução individual', 'ao longo das avaliações.'],
      ['Fluência leitora', 'da turma, em palavras por minuto.'],
    ],
  },
  {
    frase: 'No celular, só o que importa na escola.',
    itens: [
      ['Leitor de gabaritos', 'pela câmera, cartão por cartão.'],
      ['Aplicação da fluência', 'gravando a leitura do aluno.'],
      ['Tudo sincronizado', 'com os painéis da rede.'],
    ],
  },
];

const abasPapel = $$('.papeis__seletor button');
const caixaPapel = $('.papel');
const fraseEl = $('.papel__frase');
const listaEl = $('.papel__lista');

function mostrarPapel(i, animar = true) {
  abasPapel.forEach((b, j) => b.setAttribute('aria-selected', String(i === j)));
  const preencher = () => {
    fraseEl.textContent = PAPEIS[i].frase;
    listaEl.innerHTML = PAPEIS[i].itens.map(([t, d]) => `<li><span><b>${t}</b> ${d}</span></li>`).join('');
    caixaPapel.classList.remove('trocando');
  };
  if (!animar || semMovimento) return preencher();
  caixaPapel.classList.add('trocando');
  setTimeout(preencher, 220);
}
abasPapel.forEach((b, i) => b.addEventListener('click', () => mostrarPapel(i)));
mostrarPapel(0, false);

/* ---------- Contato: quantos alunos tem a sua rede ---------- */

const campoNumero = $('.contato__numero input');
const faixa = $('.contato__faixa');
const totalEl = $('.contato__total');
const escalaEl = $('.contato__escala');
const telaRede = $('.contato__pontos');
const ctxRede = telaRede.getContext('2d');
const CORES_REDE = ['#10b981', '#0d9488', '#0284c7', '#38bdf8', '#34d399'];
let alunosRede = 8500;
let mostrados = 0;
let animacaoRede = 0;

// Escala fixa: cada ponto = 10 alunos e a área inteira = 30 mil alunos, para que uma rede
// maior ocupe mais espaço. Acima disso cada ponto passa a valer mais.
const ALUNOS_POR_PONTO = 10;
const PONTOS_NA_AREA = 3000;
const escala = (n) => (n <= ALUNOS_POR_PONTO * PONTOS_NA_AREA ? ALUNOS_POR_PONTO : Math.ceil(n / PONTOS_NA_AREA / 10) * 10);

function desenharRede() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = telaRede.clientWidth;
  const h = telaRede.clientHeight;
  if (telaRede.width !== w * dpr) { telaRede.width = w * dpr; telaRede.height = h * dpr; }
  const passo = Math.sqrt(((w - 12) * (h - 12)) / PONTOS_NA_AREA);
  const colunas = Math.max(1, Math.floor((w - 12) / passo));
  const k = escala(alunosRede);
  const pontos = Math.ceil(alunosRede / k);
  const alvo = pontos;
  mostrados = Math.min(alvo, mostrados);
  cancelAnimationFrame(animacaoRede);

  const quadro = () => {
    mostrados = Math.min(alvo, mostrados + Math.max(20, Math.ceil(alvo / 45)));
    ctxRede.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctxRede.clearRect(0, 0, w, h);
    const r = Math.max(1, passo * 0.32);
    for (let i = 0; i < mostrados; i++) {
      const x = (i % colunas) * passo + passo / 2 + (w - colunas * passo) / 2;
      const y = Math.floor(i / colunas) * passo + passo / 2 + 6;
      ctxRede.fillStyle = CORES_REDE[(i * 7 + Math.floor(i / colunas)) % CORES_REDE.length];
      ctxRede.globalAlpha = 0.9;
      ctxRede.beginPath();
      ctxRede.arc(x, y, r, 0, Math.PI * 2);
      ctxRede.fill();
    }
    if (mostrados < alvo && !semMovimento) animacaoRede = requestAnimationFrame(quadro);
  };
  if (semMovimento) mostrados = alvo;
  quadro();
  escalaEl.textContent = k === 1 ? 'Cada ponto = 1 aluno' : `Cada ponto = ${k} alunos`;
}

function atualizarRede(valor, origem) {
  const n = Math.max(50, Math.min(200000, Math.round(Number(valor) || 0)));
  alunosRede = n;
  if (origem !== 'numero') campoNumero.value = formatar(n);
  if (origem !== 'faixa') faixa.value = Math.min(n, Number(faixa.max));
  totalEl.textContent = formatar(n);
  desenharRede();
}

// O campo aceita "8.500" ou "8500"
const lerNumero = () => campoNumero.value.replace(/\D/g, '');
campoNumero.addEventListener('input', () => { if (lerNumero()) atualizarRede(lerNumero(), 'numero'); });
campoNumero.addEventListener('blur', () => atualizarRede(lerNumero()));
faixa.addEventListener('input', () => atualizarRede(faixa.value, 'faixa'));
new IntersectionObserver(([e], obs) => {
  if (e.isIntersecting) { obs.disconnect(); mostrados = 0; desenharRede(); }
}, { threshold: 0.3 }).observe(telaRede);
window.addEventListener('resize', () => { mostrados = Infinity; desenharRede(); });

/* ---------- Formulário: abre o e-mail com a mensagem pronta ---------- */

const form = $('.formulario');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const campos = Object.fromEntries(new FormData(form));
  let valido = true;
  $$('input[required]', form).forEach((input) => {
    const ok = input.value.trim() && (input.type !== 'email' || /\S+@\S+\.\S+/.test(input.value));
    input.classList.toggle('invalido', !ok);
    if (!ok) valido = false;
  });
  if (!valido) { $('input.invalido', form)?.focus(); return; }

  const assunto = `Demonstração do Aulexis — ${campos.rede}`;
  const corpo = [
    'Olá! Gostaria de conhecer o Aulexis.',
    '',
    `Nome: ${campos.nome}`,
    `Município/rede: ${campos.rede}`,
    campos.cargo ? `Cargo: ${campos.cargo}` : null,
    `E-mail: ${campos.email}`,
    `Alunos na rede: cerca de ${formatar(alunosRede)}`,
  ].filter((l) => l !== null).join('\n');
  window.location.href = `mailto:${EMAIL_CONTATO}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
});
$$('input', form).forEach((input) => input.addEventListener('input', () => input.classList.remove('invalido')));
