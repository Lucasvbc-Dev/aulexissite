// A história contada com pontos: cada ponto é um aluno (fictício).
// Os mesmos pontos mudam de formação conforme a rolagem:
// 0 campo solto → 1 cartão-resposta → 2 leitura pela câmera → 3 curva de proficiência
// → 4 níveis → 5 mapa das escolas → 6 um único aluno.

export const NIVEIS = [
  { nome: 'Abaixo do básico', cor: [244, 63, 94] },
  { nome: 'Básico', cor: [245, 158, 11] },
  { nome: 'Adequado', cor: [16, 185, 129] },
  { nome: 'Avançado', cor: [2, 132, 199] },
];

const TINTA = [15, 23, 42];
const VAZIO = [203, 213, 225];
const CAMPO = [[16, 185, 129], [13, 148, 136], [2, 132, 199], [56, 189, 248], [100, 116, 139]];

// Escolas fictícias: posição no mapa (0 a 1) e média de proficiência
const ESCOLAS = [
  { nome: 'EM Aurora', x: 0.22, y: 0.3, media: 0.66 },
  { nome: 'EM Horizonte', x: 0.42, y: 0.22, media: 0.58 },
  { nome: 'EM Ipê', x: 0.63, y: 0.28, media: 0.55 },
  { nome: 'EM Jatobá', x: 0.82, y: 0.36, media: 0.52 },
  { nome: 'EM Primavera', x: 0.3, y: 0.55, media: 0.5 },
  { nome: 'EM Sol Nascente', x: 0.52, y: 0.5, media: 0.56 },
  { nome: 'EM Rio Claro', x: 0.74, y: 0.62, media: 0.27 },
  { nome: 'EM Buriti', x: 0.16, y: 0.74, media: 0.47 },
  { nome: 'EM Pequi', x: 0.4, y: 0.78, media: 0.53 },
  { nome: 'EM Cerrado', x: 0.6, y: 0.82, media: 0.42 },
];

// Contorno do município (coordenadas de 0 a 1)
const CONTORNO = [
  [0.08, 0.32], [0.18, 0.12], [0.38, 0.08], [0.55, 0.12], [0.72, 0.06], [0.9, 0.18], [0.96, 0.42],
  [0.9, 0.62], [0.94, 0.8], [0.76, 0.95], [0.52, 0.92], [0.34, 0.97], [0.12, 0.9], [0.04, 0.68],
];

function semente(n) {
  return () => {
    n |= 0; n = (n + 0x6d2b79f5) | 0;
    let t = Math.imul(n ^ (n >>> 15), 1 | n);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const limitar = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const suave = (t) => t * t * (3 - 2 * t);
const misturar = (a, b, t) => a + (b - a) * t;

export function criarHistoria({ canvas, secao, dica, cartao, trilho, aoTrocarCapitulo }) {
  const ctx = canvas.getContext('2d');
  const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const celular = () => window.innerWidth < 760;

  // Cartão-resposta: G blocos de 4 alternativas por linha
  const G = celular() ? 4 : 6;
  const C = G * 4;
  const R = celular() ? 28 : 36;
  const N = R * C;
  const rnd = semente(214);
  const normal = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());

  // Cada questão (linha × bloco) tem a alternativa marcada e o gabarito
  const questoes = [];
  for (let q = 0; q < R * G; q++) {
    const gabarito = Math.floor(rnd() * 4);
    const marcada = rnd() < 0.66 ? gabarito : Math.floor(rnd() * 4);
    questoes.push({ gabarito, marcada });
  }

  const alunos = [];
  for (let i = 0; i < N; i++) {
    const e = Math.floor(rnd() * ESCOLAS.length);
    const prof = limitar(ESCOLAS[e].media + normal() * 0.13, 0.03, 0.97);
    const nivel = prof < 0.34 ? 0 : prof < 0.52 ? 1 : prof < 0.72 ? 2 : 3;
    const linha = Math.floor(i / C);
    const coluna = i % C;
    const q = questoes[linha * G + Math.floor(coluna / 4)];
    const alternativa = coluna % 4;
    alunos.push({
      codigo: String(1000 + Math.floor(rnd() * 9000)).padStart(4, '0'),
      ano: 1 + Math.floor(rnd() * 5),
      turma: 'ABC'[Math.floor(rnd() * 3)],
      escola: e, prof, nivel, linha, coluna,
      marcada: q.marcada === alternativa,
      certa: q.marcada === alternativa && q.marcada === q.gabarito,
      atraso: rnd(), fase: rnd() * Math.PI * 2,
      campo: { u: rnd(), v: rnd(), cor: CAMPO[Math.floor(rnd() * CAMPO.length)], r: 1.6 + rnd() * 2.2 },
      f: [], // posição/cor/raio em cada formação
      x: 0, y: 0, ex: 0, ey: 0, // posição atual e empurrão do mouse
    });
  }

  // O aluno do fim da história: abaixo do básico, na escola com mais dificuldade
  let foco = alunos.findIndex((a) => a.escola === 6 && a.nivel === 0);
  if (foco < 0) foco = alunos.findIndex((a) => a.nivel === 0);
  alunos[foco].codigo = '0214'; alunos[foco].ano = 3; alunos[foco].turma = 'B';

  const contagemNivel = [0, 0, 0, 0];
  alunos.forEach((a) => { contagemNivel[a.nivel] += 1; });
  const mediasEscola = ESCOLAS.map((_, e) => {
    const lista = alunos.filter((a) => a.escola === e);
    return { total: lista.length, abaixo: lista.filter((a) => a.nivel === 0).length };
  });

  let W = 0, H = 0, dpr = 1, S = null, layout = null;
  let mouse = { x: -999, y: -999, ativo: false };

  // ---------- Formações (em pixels, recalculadas ao redimensionar) ----------

  function calcular() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    S = celular()
      ? { x: 16, y: 74, w: W - 32, h: H * 0.42 }
      : { x: W * 0.42, y: H * 0.13, w: W * 0.54, h: H * 0.76 };
    layout = {};

    // 0 · campo solto pela tela
    alunos.forEach((a) => {
      a.f[0] = { x: a.campo.u * W, y: a.campo.v * H, r: a.campo.r, cor: a.campo.cor, al: 0.55 };
    });

    // 1 e 2 · cartão-resposta
    const gap = 1.3;
    const cel = Math.min(S.w / (C + (G - 1) * gap + 3), S.h / (R + 6));
    const fw = cel * (C + (G - 1) * gap + 2.2);
    const fh = cel * (R + 5);
    const fx = S.x + (S.w - fw) / 2;
    const fy = S.y + (S.h - fh) / 2;
    layout.folha = { x: fx, y: fy, w: fw, h: fh, cel, topo: fy + cel * 3.6 };
    alunos.forEach((a) => {
      const x = fx + cel * (1.6 + a.coluna + Math.floor(a.coluna / 4) * gap);
      const y = layout.folha.topo + cel * (a.linha + 0.5);
      a.f[1] = { x, y, r: cel * 0.34, cor: a.marcada ? TINTA : VAZIO, al: a.marcada ? 1 : 0.9 };
      a.f[2] = { x, y, r: cel * 0.34, cor: TINTA, al: 1 }; // a cor depende da leitura (ver corLeitura)
    });

    // 3 · curva de proficiência (pontos empilhados por faixa)
    const B = celular() ? 26 : 38;
    const pilhas = new Array(B).fill(0);
    const ordem = alunos.map((a, i) => i).sort((i, j) => alunos[i].prof - alunos[j].prof);
    const faixa = (a) => Math.min(B - 1, Math.floor(a.prof * B));
    alunos.forEach((a) => { pilhas[faixa(a)] += 1; });
    const maior = Math.max(...pilhas);
    const passo = Math.min(S.w / B, (S.h * 0.78) / maior);
    const base = S.y + S.h * 0.86;
    layout.curva = { base, x0: S.x, x1: S.x + S.w, passo };
    const altura = new Array(B).fill(0);
    ordem.forEach((i) => {
      const a = alunos[i];
      const b = faixa(a);
      a.f[3] = {
        x: S.x + (b + 0.5) * (S.w / B),
        y: base - (altura[b] + 0.5) * passo,
        r: passo * 0.4, cor: NIVEIS[a.nivel].cor, al: 1,
      };
      altura[b] += 1;
    });

    // 4 · níveis lado a lado (espiral de girassol)
    const raioMax = Math.min(S.w * 0.11, S.h * 0.3);
    const esp = raioMax / Math.sqrt(Math.max(...contagemNivel));
    const indiceNivel = [0, 0, 0, 0];
    layout.niveis = NIVEIS.map((_, n) => ({
      x: S.x + S.w * (0.125 + 0.25 * n),
      y: S.y + S.h * 0.56,
      raio: esp * Math.sqrt(contagemNivel[n]),
    }));
    alunos.forEach((a) => {
      const k = indiceNivel[a.nivel]++;
      const ang = k * 2.39996;
      const r = esp * Math.sqrt(k + 0.5);
      const c = layout.niveis[a.nivel];
      a.f[4] = { x: c.x + Math.cos(ang) * r, y: c.y + Math.sin(ang) * r, r: esp * 0.4, cor: NIVEIS[a.nivel].cor, al: 1 };
    });

    // 5 · mapa do município
    const lado = Math.min(S.w, S.h * 1.35);
    const mapa = { x: S.x + (S.w - lado) / 2, y: S.y + (S.h - lado / 1.35) / 2, w: lado, h: lado / 1.35 };
    layout.mapa = mapa;
    const maiorEscola = Math.max(...mediasEscola.map((m) => m.total));
    const espM = (lado * 0.075) / Math.sqrt(maiorEscola);
    const indiceEscola = new Array(ESCOLAS.length).fill(0);
    // Dentro de cada escola, os alunos com mais dificuldade ficam no miolo
    const porEscola = alunos.map((a, i) => i).sort((i, j) => alunos[i].prof - alunos[j].prof);
    porEscola.forEach((i) => {
      const a = alunos[i];
      const esc = ESCOLAS[a.escola];
      const k = indiceEscola[a.escola]++;
      const ang = k * 2.39996;
      const r = espM * Math.sqrt(k + 0.5);
      a.f[5] = {
        x: mapa.x + esc.x * mapa.w + Math.cos(ang) * r,
        y: mapa.y + esc.y * mapa.h + Math.sin(ang) * r,
        r: espM * 0.42, cor: NIVEIS[a.nivel].cor, al: 1,
      };
    });

    // 6 · um aluno em destaque; os outros ficam ao fundo
    alunos.forEach((a, i) => {
      a.f[6] = i === foco
        ? { x: celular() ? W / 2 : S.x + S.w * 0.22, y: celular() ? S.y + 26 : S.y + S.h * 0.48, r: 14, cor: NIVEIS[0].cor, al: 1 }
        : { ...a.f[5], al: 0.1 };
    });
  }

  // ---------- Rolagem → capítulo ----------

  const ULTIMO = 6;
  let p = 0;

  function lerRolagem() {
    const r = secao.getBoundingClientRect();
    p = limitar(-r.top / window.innerHeight, 0, ULTIMO);
  }

  // Par de formações e o quanto já andou entre elas
  function trecho() {
    const k = limitar(Math.floor(p + 0.8), 0, ULTIMO);
    if (k === 0) return { de: 0, para: 0, u: 1 };
    return { de: k - 1, para: k, u: limitar((p - (k - 0.8)) / 0.6) };
  }

  const pesoDe = (k, t) => (t.para === k ? t.u : 0) + (t.de === k && t.de !== t.para ? 1 - t.u : 0) + (t.de === k && t.de === t.para ? 1 : 0);
  const varredura = () => limitar((p - 1.3) / 0.75);

  function corLeitura(a) {
    const lida = (a.linha + 0.5) / R < varredura();
    if (!lida) return { cor: a.marcada ? TINTA : VAZIO, al: a.marcada ? 1 : 0.9 };
    if (!a.marcada) return { cor: VAZIO, al: 0.35 };
    return { cor: a.certa ? NIVEIS[2].cor : NIVEIS[0].cor, al: 1 };
  }

  // ---------- Desenho ----------

  function caixa(x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }

  function texto(t, x, y, { tam = 12, peso = 600, cor = '#475569', alinhar = 'center', al = 1 } = {}) {
    ctx.globalAlpha = al;
    ctx.font = `${peso} ${tam}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = cor;
    ctx.textAlign = alinhar;
    ctx.fillText(t, x, y);
  }

  function desenharFundos(t) {
    // Cartão-resposta
    const wf = pesoDe(1, t) + pesoDe(2, t);
    if (wf > 0.01) {
      const f = layout.folha;
      ctx.globalAlpha = wf;
      ctx.shadowColor = 'rgba(15, 23, 42, 0.14)';
      ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
      ctx.fillStyle = '#fff';
      caixa(f.x, f.y, f.w, f.h, 10); ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = TINTA_CSS;
      const m = f.cel * 0.9;
      [[f.x + 8, f.y + 8], [f.x + f.w - 8 - m, f.y + 8], [f.x + 8, f.y + f.h - 8 - m], [f.x + f.w - 8 - m, f.y + f.h - 8 - m]]
        .forEach(([x, y]) => ctx.fillRect(x, y, m, m));
      texto('CARTÃO-RESPOSTA', f.x + f.cel * 2.6, f.y + f.cel * 2.6, { tam: Math.max(9, f.cel * 0.9), peso: 800, cor: '#0f172a', alinhar: 'left', al: wf });
      if (!celular()) texto('Avaliação diagnóstica · Matemática', f.x + f.w - f.cel * 2.6, f.y + f.cel * 2.6, { tam: Math.max(8, f.cel * 0.7), peso: 500, alinhar: 'right', al: wf });
    }

    // Mapa do município
    const wm = pesoDe(5, t) + pesoDe(6, t) * 0.5;
    if (wm > 0.01) {
      const m = layout.mapa;
      ctx.globalAlpha = wm;
      ctx.beginPath();
      CONTORNO.forEach(([x, y], i) => {
        const px = m.x + x * m.w; const py = m.y + y * m.h;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fillStyle = 'rgba(16, 185, 129, 0.07)';
      ctx.strokeStyle = 'rgba(13, 148, 136, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 6]);
      ctx.fill(); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function desenharRotulos(t) {
    // Linha da câmera passando pelo cartão
    const s = varredura();
    const w2 = pesoDe(2, t);
    if (w2 > 0.01 && s > 0 && s < 1) {
      const f = layout.folha;
      const y = f.topo + s * (R * f.cel);
      ctx.globalAlpha = w2;
      const g = ctx.createLinearGradient(0, y - 30, 0, y);
      g.addColorStop(0, 'rgba(52, 211, 153, 0)');
      g.addColorStop(1, 'rgba(52, 211, 153, 0.28)');
      ctx.fillStyle = g;
      ctx.fillRect(f.x, y - 30, f.w, 30);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(f.x - 6, y - 1.5, f.w + 12, 3);
    }

    // Eixo da curva
    const w3 = pesoDe(3, t);
    if (w3 > 0.01) {
      const c = layout.curva;
      ctx.globalAlpha = w3;
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(c.x0, c.base + 4, c.x1 - c.x0, 1.5);
      const cortes = [0, 0.34, 0.52, 0.72, 1];
      NIVEIS.forEach((n, i) => {
        const xm = c.x0 + ((cortes[i] + cortes[i + 1]) / 2) * (c.x1 - c.x0);
        texto(n.nome, xm, c.base + 26, { tam: celular() ? 10 : 12, peso: 700, cor: `rgb(${n.cor})`, al: w3 });
      });
      texto('menor proficiência', c.x0, c.base + 46, { tam: 11, peso: 500, alinhar: 'left', cor: '#94a3b8', al: w3 });
      texto('maior proficiência →', c.x1, c.base + 46, { tam: 11, peso: 500, alinhar: 'right', cor: '#94a3b8', al: w3 });
    }

    // Contagem por nível
    const w4 = pesoDe(4, t);
    if (w4 > 0.01) {
      layout.niveis.forEach((c, n) => {
        const pct = Math.round((contagemNivel[n] / N) * 100);
        const topo = c.y - Math.max(c.raio, 20) - (celular() ? 30 : 46);
        texto(`${pct}%`, c.x, topo, { tam: celular() ? 20 : 30, peso: 800, cor: `rgb(${NIVEIS[n].cor})`, al: w4 });
        texto(NIVEIS[n].nome, c.x, topo + (celular() ? 16 : 22), { tam: celular() ? 9.5 : 12, peso: 700, cor: '#334155', al: w4 });
        texto(`${contagemNivel[n]} alunos`, c.x, c.y + Math.max(c.raio, 20) + 22, { tam: celular() ? 9.5 : 11.5, peso: 500, cor: '#64748b', al: w4 });
      });
    }

    // Nome das escolas; a que mais precisa ganha um anel
    const w5 = pesoDe(5, t);
    if (w5 > 0.01) {
      const m = layout.mapa;
      ESCOLAS.forEach((e, i) => {
        const x = m.x + e.x * m.w; const y = m.y + e.y * m.h;
        const raio = Math.sqrt(mediasEscola[i].total) * ((m.w * 0.075) / Math.sqrt(Math.max(...mediasEscola.map((k) => k.total))));
        if (i === 6) {
          ctx.globalAlpha = w5;
          ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(x, y, raio + 8 + Math.sin(performance.now() / 300) * 2, 0, Math.PI * 2); ctx.stroke();
        }
        if (!celular() || i === 6) {
          texto(e.nome, x, y + raio + 16, { tam: 10.5, peso: i === 6 ? 800 : 600, cor: i === 6 ? '#be123c' : '#475569', al: w5 });
        }
      });
    }
  }

  function quadro(agora) {
    lerRolagem();
    const t = trecho();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    desenharFundos(t);

    const tempo = agora / 1000;
    for (let i = 0; i < N; i++) {
      const a = alunos[i];
      // Cada aluno sai um pouco antes ou depois dos outros
      const u = t.de === t.para ? 1 : suave(limitar((t.u - a.atraso * 0.35) / 0.65));
      const A = a.f[t.de];
      const B = a.f[t.para];
      const ca = t.de === 2 ? corLeitura(a) : A;
      const cb = t.para === 2 ? corLeitura(a) : B;
      let x = misturar(A.x, B.x, u);
      let y = misturar(A.y, B.y, u);

      // No campo solto os pontos flutuam e fogem do mouse
      const solto = t.de === 0 ? 1 - u : 0;
      if (solto > 0 && !semMovimento) {
        x += Math.sin(tempo * 0.5 + a.fase) * 7 * solto;
        y += Math.cos(tempo * 0.4 + a.fase * 1.3) * 7 * solto;
        let alvoX = 0, alvoY = 0;
        if (mouse.ativo) {
          const dx = x - mouse.x; const dy = y - mouse.y;
          const d = Math.hypot(dx, dy);
          if (d < 130) { const f = (1 - d / 130) * 46; alvoX = (dx / (d || 1)) * f; alvoY = (dy / (d || 1)) * f; }
        }
        a.ex += (alvoX - a.ex) * 0.12; a.ey += (alvoY - a.ey) * 0.12;
        x += a.ex * solto; y += a.ey * solto;
      }
      a.x = x; a.y = y;

      const r = misturar(A.r, B.r, u);
      const cor = [0, 1, 2].map((k) => Math.round(misturar(ca.cor[k], cb.cor[k], u)));
      ctx.globalAlpha = misturar(ca.al, cb.al, u);
      ctx.fillStyle = `rgb(${cor[0]},${cor[1]},${cor[2]})`;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.6, r), 0, Math.PI * 2);
      ctx.fill();
    }

    // Halo no aluno em destaque
    const w6 = pesoDe(6, t);
    if (w6 > 0.01) {
      const a = alunos[foco];
      ctx.globalAlpha = w6 * 0.25;
      ctx.fillStyle = 'rgb(244, 63, 94)';
      ctx.beginPath(); ctx.arc(a.x, a.y, 26 + Math.sin(agora / 400) * 4, 0, Math.PI * 2); ctx.fill();
    }

    desenharRotulos(t);
    ctx.globalAlpha = 1;

    // Cartão do aluno ao lado do ponto
    cartao.style.opacity = w6;
    cartao.style.visibility = w6 > 0.02 ? 'visible' : 'hidden';
    if (w6 > 0.02) {
      const a = alunos[foco];
      cartao.style.transform = celular()
        ? `translate(${a.x - cartao.offsetWidth / 2}px, ${a.y + 36}px)`
        : `translate(${a.x + 44}px, ${a.y - cartao.offsetHeight / 2}px)`;
    }

    const atual = Math.round(p);
    if (atual !== capituloAtual) {
      capituloAtual = atual;
      aoTrocarCapitulo?.(atual);
      trilho?.forEach((el, i) => el.classList.toggle('ativo', i === atual));
    }

    if (visivel) requestAnimationFrame(quadro); else rodando = false;
  }

  const TINTA_CSS = 'rgb(15, 23, 42)';
  let capituloAtual = -1;
  let visivel = true;
  let rodando = false;

  const iniciar = () => { if (!rodando) { rodando = true; requestAnimationFrame(quadro); } };
  new IntersectionObserver(([e]) => { visivel = e.isIntersecting; if (visivel) iniciar(); }).observe(secao);

  // ---------- Mouse: empurra os pontos e mostra quem é o aluno ----------

  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse = { x: e.clientX - r.left, y: e.clientY - r.top, ativo: e.pointerType === 'mouse' };
    let melhor = -1; let menor = 12;
    for (let i = 0; i < N; i++) {
      const d = Math.hypot(alunos[i].x - mouse.x, alunos[i].y - mouse.y);
      if (d < menor) { menor = d; melhor = i; }
    }
    if (melhor < 0 || capituloAtual === 6) { dica.classList.remove('visivel'); return; }
    const a = alunos[melhor];
    const pontos = Math.round(110 + a.prof * 220);
    dica.innerHTML = `<b>Aluno ${a.codigo}</b><span>${a.ano}º ano ${a.turma} · ${ESCOLAS[a.escola].nome}</span><span class="dica__nivel" style="--cor: rgb(${NIVEIS[a.nivel].cor})">${NIVEIS[a.nivel].nome} · ${pontos} pts</span>`;
    dica.style.transform = `translate(${mouse.x + 14}px, ${mouse.y + 14}px)`;
    dica.classList.add('visivel');
  });
  canvas.addEventListener('pointerleave', () => { mouse.ativo = false; dica.classList.remove('visivel'); });

  // Dados do cartão final
  const a = alunos[foco];
  cartao.querySelector('[data-aluno]').textContent = `Aluno ${a.codigo} · ${a.ano}º ano ${a.turma}`;
  cartao.querySelector('[data-escola]').textContent = ESCOLAS[a.escola].nome;
  cartao.querySelector('[data-pontos]').textContent = Math.round(110 + a.prof * 220);

  calcular();
  iniciar();
  let espera = 0;
  window.addEventListener('resize', () => { clearTimeout(espera); espera = setTimeout(() => { calcular(); iniciar(); }, 150); });

  return { total: N, contagemNivel, escolaCritica: ESCOLAS[6].nome, abaixoCritica: mediasEscola[6] };
}
