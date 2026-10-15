import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import './estilo.css';
import { URL_PLATAFORMA, EMAIL_CONTATO } from './config.js';
import { GRAFICOS } from './graficos.js';

gsap.registerPlugin(ScrollTrigger);

const $ = (sel, raiz = document) => raiz.querySelector(sel);
const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];
const semAnimacao = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const temMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------- Links e textos configuráveis ---------- */

$$('[data-plataforma]').forEach((a) => { a.href = URL_PLATAFORMA; });
$$('[data-email]').forEach((a) => { a.href = `mailto:${EMAIL_CONTATO}`; a.textContent = EMAIL_CONTATO; });
$('#ano').textContent = new Date().getFullYear();

/* ---------- Rolagem suave ---------- */

let lenis = null;
if (!semAnimacao) {
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.9 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

const rolarPara = (alvo) => {
  if (lenis) lenis.scrollTo(alvo, { offset: alvo === '#topo' ? 0 : -80, duration: 1.4 });
  else document.querySelector(alvo)?.scrollIntoView({ behavior: 'smooth' });
};

$$('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const alvo = a.getAttribute('href');
    if (alvo.length < 2 || !document.querySelector(alvo)) return;
    e.preventDefault();
    fecharMenu();
    rolarPara(alvo);
  });
});

/* ---------- Navegação ---------- */

const nav = $('.nav');
const botaoMenu = $('.nav__menu');
const menuMovel = $('.menu-movel');

function fecharMenu() {
  menuMovel.classList.remove('aberto');
  menuMovel.setAttribute('aria-hidden', 'true');
  botaoMenu.setAttribute('aria-expanded', 'false');
  lenis?.start();
  atualizarTemaNav();
}

botaoMenu.addEventListener('click', () => {
  const abrir = !menuMovel.classList.contains('aberto');
  if (!abrir) return fecharMenu();
  menuMovel.classList.add('aberto');
  menuMovel.setAttribute('aria-hidden', 'false');
  botaoMenu.setAttribute('aria-expanded', 'true');
  lenis?.stop();
  atualizarTemaNav();
});

// Some ao descer, volta ao subir
let ultimoY = 0;
window.addEventListener('scroll', () => {
  const yAtual = window.scrollY;
  const descendo = yAtual > ultimoY && yAtual > 200;
  nav.classList.toggle('nav--escondida', descendo && !menuMovel.classList.contains('aberto'));
  ultimoY = yAtual;
}, { passive: true });

// Sobre as seções escuras a barra fica escura; sobre as claras, vidro claro
const secoesEscuras = $$('.heroi, .fluencia, .final, .rodape');
const atualizarTemaNav = () => {
  const yNav = 40;
  const sobreEscura = secoesEscuras.some((sec) => {
    const r = sec.getBoundingClientRect();
    return r.top <= yNav && r.bottom >= yNav;
  });
  nav.classList.toggle('nav--clara', !sobreEscura && !menuMovel.classList.contains('aberto'));
};
window.addEventListener('scroll', atualizarTemaNav, { passive: true });
atualizarTemaNav();

// Link da seção visível fica marcado
const linksNav = $$('.nav__links a');
const observadorSecoes = new IntersectionObserver((entradas) => {
  entradas.forEach((entrada) => {
    if (!entrada.isIntersecting) return;
    linksNav.forEach((a) => a.classList.toggle('ativo', a.getAttribute('href') === `#${entrada.target.id}`));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
['como-funciona', 'modulos', 'fluencia', 'paineis', 'para-quem'].forEach((id) => observadorSecoes.observe(document.getElementById(id)));

/* ---------- Abertura + entrada do herói ---------- */

function entradaDoHeroi() {
  if (semAnimacao) return;
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from('.heroi__titulo .linha > span', { yPercent: 110, duration: 1.2, stagger: 0.09 })
    .from('.selo-topo', { y: 16, opacity: 0, duration: 0.8 }, 0.1)
    .from(['.heroi__sub', '.heroi__acoes', '.heroi__provas'], { y: 24, opacity: 0, duration: 1, stagger: 0.08 }, 0.35)
    .from('.orbital', { scale: 0.86, opacity: 0, duration: 1.6 }, 0.15)
    .from('.nav', { opacity: 0, duration: 1 }, 0.2);
}

function abertura() {
  const tela = $('.abertura');
  let jaViu = false;
  try { jaViu = sessionStorage.getItem('aulexis-abertura') === '1'; } catch { /* sem storage */ }

  if (semAnimacao || jaViu) {
    tela.remove();
    entradaDoHeroi();
    return;
  }
  try { sessionStorage.setItem('aulexis-abertura', '1'); } catch { /* sem storage */ }

  document.body.classList.add('abrindo');
  lenis?.stop();

  const terminar = () => {
    document.body.classList.remove('abrindo');
    lenis?.start();
    tela.remove();
  };

  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.to('.abertura__anel circle', { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' })
    .to('.abertura__logo', { opacity: 1, scale: 1, duration: 0.9, startAt: { scale: 0.6 } }, 0.15)
    .to('.abertura__nome span', { y: 0, duration: 0.9, stagger: 0.04 }, 0.45)
    .to('.abertura__frase', { opacity: 1, y: 0, duration: 0.8, startAt: { y: 10 } }, 0.85)
    .add(() => {
      // A cortina se fecha sobre a logo da barra do topo
      const alvo = $('.nav__logo').getBoundingClientRect();
      const cx = alvo.left + alvo.width / 2;
      const cy = alvo.top + alvo.height / 2;
      const raio = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy));
      gsap.timeline({ onComplete: terminar })
        .to('.abertura__conteudo', { scale: 0.92, opacity: 0, duration: 0.5, ease: 'power2.in' })
        .fromTo(tela, { clipPath: `circle(${raio}px at ${cx}px ${cy}px)` },
          { clipPath: `circle(0px at ${cx}px ${cy}px)`, duration: 1, ease: 'expo.inOut' }, 0.15);
      gsap.delayedCall(0.55, entradaDoHeroi);
    }, '+=0.5');

  tela.addEventListener('click', () => tl.progress(1), { once: true });
}

/* ---------- Herói: luz do mouse ---------- */

const heroi = $('.heroi');
if (temMouse && !semAnimacao) {
  heroi.addEventListener('pointermove', (e) => {
    const r = heroi.getBoundingClientRect();
    heroi.style.setProperty('--mx', `${e.clientX - r.left}px`);
    heroi.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
}

/* ---------- Sistema orbital + palavra que gira ---------- */

const SATELITES = [
  { nome: 'Avaliações', icone: 'i-prova', anel: 0, fase: 0.2, desc: 'Crie, aplique e acompanhe avaliações da rede.' },
  { nome: 'Banco de questões', icone: 'i-banco', anel: 0, fase: Math.PI + 0.2, desc: 'Questões por habilidade da BNCC, série e dificuldade.' },
  { nome: 'Leitor de gabaritos', icone: 'i-camera', anel: 1, fase: 1.1, desc: 'O celular lê o cartão-resposta pela câmera.' },
  { nome: 'Digitação', icone: 'i-teclado', anel: 1, fase: 1.1 + (2 * Math.PI) / 3, desc: 'Lançamento rápido das respostas pelo teclado.' },
  { nome: 'Fluência leitora', icone: 'i-leitura', anel: 1, fase: 1.1 + (4 * Math.PI) / 3, desc: 'Palavras por minuto, precisão e nível de leitura.' },
  { nome: 'Análise TRI', icone: 'i-tri', anel: 2, fase: 0.5, desc: 'Proficiência pela Teoria de Resposta ao Item.' },
  { nome: 'Painéis da rede', icone: 'i-painel', anel: 2, fase: 0.5 + (2 * Math.PI) / 3, desc: 'Dez painéis para olhar a rede por todos os ângulos.' },
  { nome: 'Turmas e alunos', icone: 'i-turmas', anel: 2, fase: 0.5 + (4 * Math.PI) / 3, desc: 'Escolas, turmas e alunos organizados.' },
];

// Mesmas elipses do SVG (viewBox de 600)
const ANEIS = [
  { rx: 165, ry: 84, vel: 0.2 },
  { rx: 235, ry: 124, vel: -0.13 },
  { rx: 298, ry: 164, vel: 0.09 },
];

// Palavra do título → satélite correspondente
const PALAVRA_SATELITE = { avaliação: 0, questão: 1, gabarito: 2, resposta: 3, leitura: 4, habilidade: 5, escola: 6, aluno: 7 };

const orbital = $('.orbital');
const caixaSatelites = $('.orbital__satelites');
const dica = $('.orbital__dica');
const elsSatelites = SATELITES.map((s, i) => {
  const el = document.createElement('div');
  el.className = 'satelite';
  el.tabIndex = 0;
  el.innerHTML = `<span class="satelite__icone"><svg><use href="#${s.icone}" /></svg></span><span class="satelite__rotulo">${s.nome}</span>`;
  el.addEventListener('pointerenter', () => focarSatelite(i, true));
  el.addEventListener('pointerleave', () => soltarSatelite());
  el.addEventListener('focus', () => focarSatelite(i, true));
  el.addEventListener('blur', () => soltarSatelite());
  caixaSatelites.append(el);
  return el;
});

let tempoOrbita = 0;
let orbitaPausada = false;
let satAtivo = -1;
let mouseNoSatelite = false;

function focarSatelite(i, peloMouse = false) {
  if (peloMouse) { mouseNoSatelite = true; orbitaPausada = true; }
  satAtivo = i;
  elsSatelites.forEach((el, j) => el.classList.toggle('ativo', j === i));
  $('strong', dica).textContent = SATELITES[i].nome;
  $('span', dica).textContent = SATELITES[i].desc;
  dica.classList.add('visivel');
}

function soltarSatelite() {
  mouseNoSatelite = false;
  orbitaPausada = false;
}

function posicionarSatelites() {
  const w = orbital.clientWidth;
  const h = orbital.clientHeight;
  const escala = Math.min(w, h) / 600;
  SATELITES.forEach((s, i) => {
    const anel = ANEIS[s.anel];
    const t = s.fase + tempoOrbita * anel.vel;
    const el = elsSatelites[i];
    // O rótulo não pode sair pela borda (no celular a órbita ocupa a largura toda)
    const meio = el.offsetWidth / 2 + 4;
    const x = Math.min(w - meio, Math.max(meio, w / 2 + Math.cos(t) * anel.rx * escala));
    const y = h / 2 + Math.sin(t) * anel.ry * escala;
    const frente = (Math.sin(t) + 1) / 2; // 0 = atrás, 1 = na frente
    const destaque = i === satAtivo ? 1.08 : 1;
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${((0.8 + frente * 0.22) * destaque).toFixed(3)})`;
    el.style.opacity = i === satAtivo ? 1 : (0.5 + frente * 0.5).toFixed(2);
    el.style.zIndex = Math.sin(t) > -0.15 || i === satAtivo ? 10 : 2;
    // Atrás da logo o satélite mostra só o ícone
    el.classList.toggle('atras', Math.sin(t) < -0.2 && i !== satAtivo);
  });
}

let visivelOrbital = true;
new IntersectionObserver(([e]) => { visivelOrbital = e.isIntersecting; }).observe(orbital);

let ultimoQuadro = performance.now();
function animarOrbita(agora) {
  const dt = Math.min(0.05, (agora - ultimoQuadro) / 1000);
  ultimoQuadro = agora;
  if (visivelOrbital) {
    if (!orbitaPausada && !semAnimacao) tempoOrbita += dt;
    posicionarSatelites();
  }
  requestAnimationFrame(animarOrbita);
}
requestAnimationFrame(animarOrbita);

// A palavra do título troca a cada 3,2 s e acende o satélite do mesmo serviço
const palavraGiro = $('.palavra-giro');
const PALAVRAS = palavraGiro.dataset.palavras.split(',');
let indicePalavra = 0;
focarSatelite(PALAVRA_SATELITE[PALAVRAS[0]]);

function trocarPalavra() {
  if (mouseNoSatelite) return;
  indicePalavra = (indicePalavra + 1) % PALAVRAS.length;
  const nova = PALAVRAS[indicePalavra];
  if (semAnimacao) {
    palavraGiro.textContent = nova;
  } else {
    gsap.timeline()
      .to(palavraGiro, { yPercent: -105, opacity: 0, duration: 0.45, ease: 'power3.in' })
      .add(() => { palavraGiro.textContent = nova; })
      .fromTo(palavraGiro, { yPercent: 105, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.7, ease: 'expo.out' });
  }
  focarSatelite(PALAVRA_SATELITE[nova]);
}
setInterval(trocarPalavra, 3200);

/* ---------- Faixa rolando (acelera com a rolagem) ---------- */

const trilho = $('.faixa__trilho');
trilho.innerHTML += trilho.innerHTML;
if (!semAnimacao) {
  const faixa = gsap.to(trilho, { xPercent: -50, duration: 38, ease: 'none', repeat: -1 });
  ScrollTrigger.create({
    trigger: '.faixa',
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: (st) => {
      const v = gsap.utils.clamp(-6, 6, st.getVelocity() / 300);
      gsap.to(faixa, { timeScale: 1 + Math.abs(v), duration: 0.3, overwrite: true });
      gsap.to(faixa, { timeScale: 1, duration: 1.2, delay: 0.3 });
    },
  });
}

/* ---------- Manifesto: as palavras acendem com a rolagem ---------- */

const manifesto = $('[data-revelar-palavras]');
manifesto.innerHTML = manifesto.textContent.trim().split(/\s+/).map((p) => `<span class="palavra">${p}</span>`).join(' ');
if (!semAnimacao) {
  gsap.to($$('.palavra', manifesto), {
    opacity: 1,
    stagger: 0.1,
    ease: 'none',
    scrollTrigger: { trigger: manifesto, start: 'top 78%', end: 'bottom 42%', scrub: 0.6 },
  });
  gsap.from('.manifesto__virada > *', {
    yPercent: 60, opacity: 0, duration: 1.1, stagger: 0.12, ease: 'expo.out',
    scrollTrigger: { trigger: '.manifesto__virada', start: 'top 85%' },
  });
}

/* ---------- Entradas ao rolar ---------- */

if (!semAnimacao) {
  $$('.revelar').forEach((el) => {
    gsap.from(el, { y: 50, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
  [['.bento', '.mod'], ['.quem__grade', '.perfil'], ['.confianca', '.confianca__item'], ['.faq__lista', 'details']].forEach(([grupo, item]) => {
    gsap.from($$(`${grupo} ${item}`), {
      y: 40, opacity: 0, duration: 0.9, stagger: 0.07, ease: 'expo.out',
      scrollTrigger: { trigger: grupo, start: 'top 85%' },
    });
  });
  gsap.from('.leitura', { y: 60, opacity: 0, rotate: 2, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.leitura', start: 'top 85%' } });
  gsap.from('.grafico', { y: 60, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.grafico', start: 'top 88%' } });
  gsap.from('.final__conteudo > *', {
    y: 40, opacity: 0, duration: 1, stagger: 0.1, ease: 'expo.out',
    scrollTrigger: { trigger: '.final', start: 'top 70%' },
  });
  gsap.fromTo('.rodape__gigante', { yPercent: 40 }, {
    yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.rodape', start: 'top bottom', end: 'bottom bottom', scrub: true },
  });
}

/* ---------- Ciclo: o passo no meio da tela troca o quadro da janela ---------- */

// Cartão-resposta: 12 questões, A a D, com as marcações do aluno
const MARCACOES = [1, 3, 0, 2, 2, 1, 0, 3, 1, 2, 0, 1];
const bolhas = (qtd) => MARCACOES.slice(0, qtd).map((m, q) => {
  const opcoes = ['A', 'B', 'C', 'D'].map((letra, j) =>
    `<i class="${j === m ? 'marcada' : ''}" style="--d:${(0.3 + q * 0.09).toFixed(2)}s">${letra}</i>`).join('');
  return `<div class="bolhas"><b>${String(q + 1).padStart(2, '0')}</b>${opcoes}</div>`;
}).join('');
$('.folha .folha__grade').innerHTML = bolhas(12);
$('.folha__grade--mini').innerHTML = bolhas(8);

const NOMES_QUADRO = ['Banco de questões', 'Cartão-resposta', 'Leitor de gabaritos', 'Análise TRI', 'Painel da rede'];
const passos = $$('.passo');
const quadros = $$('.quadro');
const urlJanela = $('.janela__url b');
const progressoCiclo = $('.ciclo__progresso span');
let passoAtual = 0;

function ativarPasso(i) {
  if (i === passoAtual) return;
  passoAtual = i;
  passos.forEach((p, j) => p.classList.toggle('ativo', j === i));
  quadros.forEach((q, j) => q.classList.toggle('ativo', j === i));
  urlJanela.textContent = NOMES_QUADRO[i];
  progressoCiclo.style.width = `${((i + 1) / passos.length) * 100}%`;
}

const observadorPassos = new IntersectionObserver((entradas) => {
  entradas.forEach((e) => { if (e.isIntersecting) ativarPasso(Number(e.target.dataset.passo)); });
}, { rootMargin: '-48% 0px -48% 0px' });
passos.forEach((p) => observadorPassos.observe(p));
passos.forEach((p) => p.addEventListener('click', () => {
  const alvo = p.getBoundingClientRect();
  const destino = window.scrollY + alvo.top - innerHeight / 2 + 40;
  if (lenis) lenis.scrollTo(destino, { duration: 1 }); else window.scrollTo({ top: destino, behavior: 'smooth' });
}));

// Contador de cartões lidos acompanha a passada do laser
const contadorLeitor = $('.leitor__contador');
let lidos = 34;
setInterval(() => {
  if (passoAtual !== 2) return;
  lidos += 1;
  contadorLeitor.textContent = lidos;
}, 2200);

// Proficiência "calculando" no quadro da TRI
const valorTri = $('.tri__valor');
let triAnimado = false;
new MutationObserver(() => {
  const ativo = quadros[3].classList.contains('ativo');
  if (ativo && !triAnimado) {
    triAnimado = true;
    const contador = { v: 150 };
    gsap.to(contador, {
      v: 212.4, duration: 1.8, delay: 0.3, ease: 'expo.out',
      onUpdate: () => { valorTri.textContent = contador.v.toFixed(1).replace('.', ','); },
    });
  } else if (!ativo) {
    triAnimado = false;
  }
}).observe(quadros[3], { attributes: true, attributeFilter: ['class'] });

/* ---------- Módulos: luz segue o mouse ---------- */

if (temMouse) {
  $$('.mod').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--x', `${e.clientX - r.left}px`);
      card.style.setProperty('--y', `${e.clientY - r.top}px`);
    });
  });
}

/* ---------- Fluência: simulação de leitura ---------- */

const leituraTexto = $('.leitura__texto');
const PALAVRAS_LEITURA = leituraTexto.dataset.texto.split(' ');
const ERROS = new Set([11, 22]); // "passarinhos" e "sombra" saem com tropeço
leituraTexto.innerHTML = PALAVRAS_LEITURA.map((p) => `<span>${p}</span>`).join(' ');
const spansLeitura = $$('span', leituraTexto);
const onda = $('.leitura__onda');
onda.innerHTML = '<i></i>'.repeat(56);
const barrasOnda = $$('i', onda);
const botaoLeitura = $('.leitura__botao');
const ppmEl = $('.leitura__ppm');
const precisaoEl = $('.leitura__precisao');
const nivelEl = $('.leitura__nivel');
let lendo = false;

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function simularLeitura() {
  if (lendo) return;
  lendo = true;
  botaoLeitura.disabled = true;
  $('span', botaoLeitura).textContent = 'Lendo…';
  spansLeitura.forEach((s) => s.classList.remove('lida', 'atual', 'erro'));
  ppmEl.textContent = '0';
  precisaoEl.textContent = '—';
  nivelEl.textContent = 'Analisando…';
  onda.classList.add('ativa');

  const ondaTimer = setInterval(() => {
    barrasOnda.forEach((b, i) => {
      const base = Math.sin(Date.now() / 140 + i * 0.6) * 0.5 + 0.5;
      b.style.height = `${12 + base * 50 + Math.random() * 38}%`;
    });
  }, 90);

  const inicio = performance.now();
  let erros = 0;
  for (let i = 0; i < spansLeitura.length; i++) {
    const span = spansLeitura[i];
    span.classList.add('atual');
    const palavra = PALAVRAS_LEITURA[i];
    // Ritmo de um leitor de 2º ano (~85 palavras por minuto)
    let tempo = 400 + palavra.length * 42;
    if (ERROS.has(i)) tempo += 520;
    if (/[.,]$/.test(palavra)) tempo += 320;
    await esperar(semAnimacao ? 10 : tempo);
    span.classList.remove('atual');
    span.classList.add(ERROS.has(i) ? 'erro' : 'lida');
    if (ERROS.has(i)) erros += 1;

    const minutos = (performance.now() - inicio) / 60000;
    if (i >= 3) ppmEl.textContent = Math.round((i + 1 - erros) / minutos);
    precisaoEl.textContent = `${Math.round(((i + 1 - erros) / (i + 1)) * 100)}%`;
  }

  clearInterval(ondaTimer);
  barrasOnda.forEach((b) => { b.style.height = ''; });
  onda.classList.remove('ativa');
  const ppmFinal = Math.round((spansLeitura.length - erros) / ((performance.now() - inicio) / 60000));
  ppmEl.textContent = semAnimacao ? '86' : ppmFinal;
  nivelEl.textContent = 'Leitor fluente';
  gsap.fromTo(nivelEl, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(2)' });
  botaoLeitura.disabled = false;
  $('span', botaoLeitura).textContent = 'Ouvir de novo';
  lendo = false;
}

botaoLeitura.addEventListener('click', simularLeitura);
ScrollTrigger.create({ trigger: '.leitura', start: 'top 65%', once: true, onEnter: simularLeitura });

/* ---------- Painéis: abas com gráficos que se desenham ---------- */

const abas = $$('.paineis__lista button');
const svgGrafico = $('.grafico__svg');
svgGrafico.setAttribute('preserveAspectRatio', 'xMidYMid meet');
const rotuloGrafico = $('.grafico__rotulo');
const tituloGrafico = $('.grafico__titulo');
const secaoPaineis = $('.paineis');
const TEMPO_ABA = 5200;
let abaAtual = 0;
let timerAba = null;
let paineisVisiveis = false;
let paineisPausados = false;

function desenharGrafico(tipo) {
  const g = GRAFICOS[tipo];
  rotuloGrafico.textContent = g.rotulo;
  tituloGrafico.textContent = g.titulo;
  svgGrafico.innerHTML = g.svg();
  if (semAnimacao) return;

  gsap.from($$('.g-barra', svgGrafico), { scaleY: 0, transformOrigin: '50% 100%', duration: 0.9, stagger: 0.05, ease: 'expo.out' });
  gsap.from($$('.g-barra-h', svgGrafico), { scaleX: 0, transformOrigin: '0% 50%', duration: 1, stagger: 0.04, ease: 'expo.out' });
  $$('.g-linha', svgGrafico).forEach((linha, i) => {
    const comp = linha.getTotalLength();
    const tracejado = linha.getAttribute('stroke-dasharray');
    if (tracejado) {
      gsap.from(linha, { opacity: 0, duration: 0.6, delay: 0.5 });
    } else {
      gsap.fromTo(linha, { strokeDasharray: comp, strokeDashoffset: comp }, { strokeDashoffset: 0, duration: 1.4, delay: i * 0.15, ease: 'power2.inOut' });
    }
  });
  gsap.from($$('.g-ponto', svgGrafico), { scale: 0, transformOrigin: '50% 50%', duration: 0.6, stagger: 0.02, delay: 0.2, ease: 'back.out(2)' });
  $$('.g-pulso', svgGrafico).forEach((p) => {
    gsap.fromTo(p, { scale: 1, opacity: 0.9, transformOrigin: '50% 50%' }, { scale: 2.6, opacity: 0, duration: 1.6, repeat: -1, ease: 'power1.out' });
  });
}

function selecionarAba(i) {
  abaAtual = i;
  abas.forEach((b, j) => {
    b.setAttribute('aria-selected', String(j === i));
    // Reinicia a barrinha de progresso da aba
    if (j === i) { b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; }
  });
  desenharGrafico(abas[i].dataset.grafico);
  agendarProximaAba();
}

function agendarProximaAba() {
  clearTimeout(timerAba);
  if (!paineisVisiveis || paineisPausados || semAnimacao) return;
  timerAba = setTimeout(() => selecionarAba((abaAtual + 1) % abas.length), TEMPO_ABA);
}

secaoPaineis.style.setProperty('--tempo', `${TEMPO_ABA}ms`);
abas.forEach((b, i) => b.addEventListener('click', () => selecionarAba(i)));
$('.paineis__corpo').addEventListener('pointerenter', () => { paineisPausados = true; secaoPaineis.classList.add('pausado'); clearTimeout(timerAba); });
$('.paineis__corpo').addEventListener('pointerleave', () => { paineisPausados = false; secaoPaineis.classList.remove('pausado'); selecionarAba(abaAtual); });

let primeiraVez = true;
new IntersectionObserver(([e]) => {
  paineisVisiveis = e.isIntersecting;
  if (paineisVisiveis && primeiraVez) { primeiraVez = false; selecionarAba(0); }
  else if (paineisVisiveis) agendarProximaAba();
  else clearTimeout(timerAba);
}, { threshold: 0.35 }).observe($('.grafico'));
desenharGrafico('geral');

/* ---------- Cartões que inclinam e botões magnéticos ---------- */

if (temMouse && !semAnimacao) {
  $$('.inclinar').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(card, { rotateY: nx * 10, rotateX: -ny * 10, transformPerspective: 900, duration: 0.5, ease: 'power2.out' });
    });
    card.addEventListener('pointerleave', () => gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' }));
  });

  $$('.magnetico').forEach((botao) => {
    botao.addEventListener('pointermove', (e) => {
      const r = botao.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      gsap.to(botao, { x: dx * 0.22, y: dy * 0.3, duration: 0.4, ease: 'power3.out' });
    });
    botao.addEventListener('pointerleave', () => gsap.to(botao, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' }));
  });
}

/* ---------- Formulário de contato: abre o e-mail com a mensagem pronta ---------- */

const form = $('.contato');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const campos = Object.fromEntries(new FormData(form));
  let valido = true;
  $$('input[required]', form).forEach((input) => {
    const ok = input.value.trim() && (input.type !== 'email' || /\S+@\S+\.\S+/.test(input.value));
    input.classList.toggle('invalido', !ok);
    if (!ok) valido = false;
  });
  if (!valido) {
    $('input.invalido', form)?.focus();
    return;
  }
  const assunto = `Demonstração do Aulexis — ${campos.rede}`;
  const corpo = [
    'Olá! Gostaria de conhecer o Aulexis.',
    '',
    `Nome: ${campos.nome}`,
    `Município/rede: ${campos.rede}`,
    campos.cargo ? `Cargo: ${campos.cargo}` : null,
    `E-mail: ${campos.email}`,
  ].filter((l) => l !== null).join('\n');
  window.location.href = `mailto:${EMAIL_CONTATO}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
});
$$('input', form).forEach((input) => input.addEventListener('input', () => input.classList.remove('invalido')));

/* ---------- Começa ---------- */

abertura();
window.addEventListener('load', () => ScrollTrigger.refresh());
