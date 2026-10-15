// Gráficos da seção de painéis, desenhados em SVG (viewBox 520 x 300).
// Todos os números são fictícios, só para demonstração.

const L = 520;
const A = 300;
const M = { topo: 32, dir: 16, base: 34, esq: 40 };
const AREA_L = L - M.esq - M.dir;
const AREA_A = A - M.topo - M.base;

const VERDE = '#10b981';
const AZUL = '#0284c7';
const CORES_NIVEL = ['#f43f5e', '#f59e0b', '#14b8a6', '#059669'];

const y = (v, max = 100) => M.topo + AREA_A - (v / max) * AREA_A;

const grade = (max = 100, passos = 4) => {
  let s = '';
  for (let i = 0; i <= passos; i++) {
    const v = (max / passos) * i;
    s += `<line class="g-grade" x1="${M.esq}" x2="${L - M.dir}" y1="${y(v, max)}" y2="${y(v, max)}" />`;
    s += `<text x="${M.esq - 8}" y="${y(v, max) + 4}" text-anchor="end">${Math.round(v)}${max === 100 ? '%' : ''}</text>`;
  }
  return s;
};

// Itens lado a lado, espaçados pelo tamanho do nome (a fonte cresce no celular)
const legenda = (itens, x = M.esq, yy = 10) => {
  let dx = x;
  return itens
    .map(([cor, nome]) => {
      const item = `<circle cx="${dx + 5}" cy="${yy}" r="5" fill="${cor}" /><text x="${dx + 15}" y="${yy + 4}">${nome}</text>`;
      dx += 30 + nome.length * 8.4;
      return item;
    })
    .join('');
};

const ESCOLAS = ['EM Aurora', 'EM Horizonte', 'EM Ipê', 'EM Jatobá', 'EM Primavera', 'EM Sol Nascente', 'EM Rio Claro'];

export const GRAFICOS = {
  geral: {
    rotulo: 'Painel geral',
    titulo: 'Acerto médio por ano escolar',
    svg() {
      const anos = ['1º ano', '2º ano', '3º ano', '4º ano', '5º ano'];
      const lp = [62, 68, 71, 66, 74];
      const mt = [58, 61, 69, 63, 70];
      const larg = AREA_L / anos.length;
      let s = grade();
      anos.forEach((ano, i) => {
        const x0 = M.esq + i * larg + larg / 2;
        s += `<rect class="g-barra" x="${x0 - 26}" y="${y(lp[i])}" width="24" height="${y(0) - y(lp[i])}" rx="6" fill="${VERDE}" />`;
        s += `<rect class="g-barra" x="${x0 + 2}" y="${y(mt[i])}" width="24" height="${y(0) - y(mt[i])}" rx="6" fill="${AZUL}" />`;
        s += `<text x="${x0}" y="${A - 12}" text-anchor="middle">${ano}</text>`;
      });
      s += legenda([[VERDE, 'Língua Portuguesa'], [AZUL, 'Matemática']]);
      return s;
    },
  },

  comparativo: {
    rotulo: 'Comparativo',
    titulo: 'Escolas lado a lado, com a média da rede',
    svg() {
      const valores = [86, 79, 74, 70, 64, 57, 43];
      const media = 68;
      const esq = 118;
      const largura = L - esq - M.dir - 30;
      const alt = (A - M.topo - 20) / valores.length;
      // A linha da média vai por trás das barras para não cortar os números
      const xm = esq + (media / 100) * largura;
      let s = `<line class="g-linha" x1="${xm}" x2="${xm}" y1="${M.topo}" y2="${A - 14}" stroke="#0f172a" stroke-width="1.5" stroke-dasharray="4 4" />`;
      s += `<text x="${xm}" y="${A - 2}" text-anchor="middle" style="fill:#0f172a">Rede ${media}%</text>`;
      valores.forEach((v, i) => {
        const yy = M.topo + i * alt + 6;
        const cor = v < 50 ? '#f43f5e' : v < media ? '#f59e0b' : VERDE;
        s += `<text x="${esq - 10}" y="${yy + alt / 2 + 1}" text-anchor="end">${ESCOLAS[i]}</text>`;
        s += `<rect x="${esq}" y="${yy + 4}" width="${largura}" height="${alt - 14}" rx="7" fill="#f1f5f9" fill-opacity=".7" />`;
        s += `<rect class="g-barra-h" x="${esq}" y="${yy + 4}" width="${(v / 100) * largura}" height="${alt - 14}" rx="7" fill="${cor}" />`;
        s += `<text class="g-valor" x="${esq + (v / 100) * largura - 10}" y="${yy + alt / 2 + 1}" text-anchor="end" style="fill:#fff">${v}%</text>`;
      });
      return s;
    },
  },

  historica: {
    rotulo: 'Série histórica',
    titulo: 'Evolução do acerto médio por edição',
    svg() {
      const anos = [2021, 2022, 2023, 2024, 2025, 2026];
      const series = [
        { cor: VERDE, nome: 'Rede', v: [55, 58, 61, 63, 66, 69], grossa: true },
        { cor: AZUL, nome: 'EM Aurora', v: [60, 66, 70, 74, 79, 86] },
        { cor: '#f59e0b', nome: 'EM Rio Claro', v: [48, 46, 50, 47, 45, 43] },
      ];
      const x = (i) => M.esq + 10 + (i / (anos.length - 1)) * (AREA_L - 20);
      let s = grade();
      anos.forEach((ano, i) => { s += `<text x="${x(i)}" y="${A - 12}" text-anchor="middle">${ano}</text>`; });
      series.forEach((serie) => {
        const d = serie.v.map((v, i) => `${i ? 'L' : 'M'}${x(i)} ${y(v)}`).join(' ');
        s += `<path class="g-linha" d="${d}" fill="none" stroke="${serie.cor}" stroke-width="${serie.grossa ? 4 : 2.5}" stroke-linecap="round" stroke-linejoin="round" />`;
        serie.v.forEach((v, i) => { s += `<circle class="g-ponto" cx="${x(i)}" cy="${y(v)}" r="${serie.grossa ? 5 : 4}" fill="#fff" stroke="${serie.cor}" stroke-width="2.5" />`; });
      });
      s += legenda(series.map((s2) => [s2.cor, s2.nome]));
      return s;
    },
  },

  correlacao: {
    rotulo: 'Correlação',
    titulo: 'Frequência × desempenho, por turma',
    svg() {
      // Pontos pseudoaleatórios estáveis
      let semente = 7;
      const aleatorio = () => ((semente = (semente * 9301 + 49297) % 233280) / 233280);
      const x = (f) => M.esq + ((f - 60) / 40) * AREA_L;
      let s = grade();
      [60, 70, 80, 90, 100].forEach((f) => { s += `<text x="${x(f)}" y="${A - 12}" text-anchor="middle">${f}%</text>`; });
      for (let i = 0; i < 34; i++) {
        const f = 62 + aleatorio() * 37;
        const d = Math.min(94, Math.max(28, (f - 60) * 1.2 + 34 + (aleatorio() - 0.5) * 24));
        const cor = d < 50 ? '#f43f5e' : d < 68 ? '#f59e0b' : VERDE;
        s += `<circle class="g-ponto" cx="${x(f)}" cy="${y(d)}" r="${5 + aleatorio() * 3}" fill="${cor}" fill-opacity=".75" />`;
      }
      s += `<path class="g-linha" d="M${x(62)} ${y(36)} L${x(99)} ${y(81)}" stroke="#0f172a" stroke-width="2" stroke-dasharray="6 5" fill="none" />`;
      s += `<text x="${L - M.dir}" y="14" text-anchor="end" style="fill:#0f172a">Frequência ↑ desempenho ↑</text>`;
      return s;
    },
  },

  equidade: {
    rotulo: 'Equidade',
    titulo: 'Alunos por nível de desempenho',
    svg() {
      const grupos = [
        ['Rede', [14, 26, 38, 22]],
        ['Zona urbana', [10, 24, 41, 25]],
        ['Zona rural', [27, 33, 29, 11]],
        ['Tempo integral', [8, 21, 43, 28]],
        ['Tempo parcial', [17, 29, 35, 19]],
      ];
      const esq = 108;
      const largura = L - esq - M.dir;
      const alt = (A - 46) / grupos.length;
      let s = '';
      grupos.forEach(([nome, partes], i) => {
        const yy = 34 + i * alt;
        let acumulado = 0;
        s += `<text x="${esq - 10}" y="${yy + alt / 2 + 2}" text-anchor="end">${nome}</text>`;
        partes.forEach((p, j) => {
          const x0 = esq + (acumulado / 100) * largura;
          const w = (p / 100) * largura;
          s += `<rect class="g-barra-h" x="${x0}" y="${yy + 6}" width="${w - 2}" height="${alt - 16}" rx="5" fill="${CORES_NIVEL[j]}" />`;
          if (p >= 10) s += `<text x="${x0 + w / 2}" y="${yy + alt / 2 + 2}" text-anchor="middle" style="fill:#fff">${p}%</text>`;
          acumulado += p;
        });
      });
      s += legenda([[CORES_NIVEL[0], 'Abaixo do básico'], [CORES_NIVEL[1], 'Básico'], [CORES_NIVEL[2], 'Adequado'], [CORES_NIVEL[3], 'Avançado']], 0);
      return s;
    },
  },

  mapa: {
    rotulo: 'Mapa de escolas',
    titulo: 'Escolas no território, por resultado',
    svg() {
      const contorno = 'M70 120 C 60 70 120 30 190 40 S 300 10 360 40 S 470 60 470 120 S 490 220 430 250 S 300 290 220 270 S 90 260 70 200 S 80 160 70 120 Z';
      const escolas = [
        [130, 90, 82], [180, 140, 74], [240, 80, 88], [300, 120, 69], [360, 80, 77], [420, 130, 63],
        [150, 210, 47], [220, 190, 58], [290, 220, 71], [370, 200, 44], [410, 230, 66], [110, 160, 61], [330, 160, 80], [260, 150, 72],
      ];
      let s = `<path d="${contorno}" fill="#ecfdf5" stroke="#a7f3d0" stroke-width="2" />`;
      s += '<path d="M190 40 C 210 120 200 200 220 270 M360 40 C 330 120 360 200 300 285 M70 160 C 200 150 320 170 470 150" fill="none" stroke="#d1fae5" stroke-width="2" stroke-dasharray="5 6" />';
      escolas.forEach(([cx, cy, v]) => {
        const cor = v < 50 ? '#f43f5e' : v < 68 ? '#f59e0b' : VERDE;
        if (v < 50) s += `<circle class="g-pulso" cx="${cx}" cy="${cy}" r="10" fill="none" stroke="${cor}" stroke-width="2" />`;
        s += `<circle class="g-ponto" cx="${cx}" cy="${cy}" r="9" fill="${cor}" stroke="#fff" stroke-width="3" />`;
      });
      s += legenda([[VERDE, 'Adequado'], ['#f59e0b', 'Atenção'], ['#f43f5e', 'Prioridade']], 20);
      return s;
    },
  },
};
