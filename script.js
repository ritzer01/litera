// ---------- EXCEÇÕES (letras "sem par" na tabela Unicode) ----------
const EXCECOES_FRAKTUR_REGULAR = { C: 'ℭ', H: 'ℌ', I: 'ℑ', R: 'ℜ', Z: 'ℨ' };
const EXCECOES_SCRIPT_REGULAR = {
  B: 'ℬ', E: 'ℰ', F: 'ℱ', H: 'ℋ', I: 'ℐ', L: 'ℒ', M: 'ℳ', R: 'ℛ',
  e: 'ℯ', g: 'ℊ', o: 'ℴ'
};
const EXCECAO_ITALICO = { h: '\u210E' };

// Sobrescrito: dicionário direto, não fórmula (motivo explicado acima)

// ---------- OS 5 GRUPOS DE FONTE E SUAS VARIANTES ----------
const GRUPOS = {
  gotico: {
    nome: 'Gótico',
    tipo: 'binario',
    padrao: 'negrito',
    variantes: {
      negrito: { upperBase: 0x1D56C, lowerBase: 0x1D586 },
      regular: { upperBase: 0x1D504, lowerBase: 0x1D51E, excecoes: EXCECOES_FRAKTUR_REGULAR }
    },
    rotulos: { negrito: 'Negrito', regular: 'Regular' }
  },
  serifa: {
    nome: 'Serifa',
    tipo: 'binario',
    padrao: 'separado',
    variantes: {
      separado: { upperBase: 0x1D670, lowerBase: 0x1D68A, digitBase: 0x1D7F6 },
      junto: { upperBase: 0x1D5A0, lowerBase: 0x1D5BA, digitBase: 0x1D7E2 }
    },
    rotulos: { separado: 'Separado', junto: 'Junto' }
  },
  cursiva: {
    nome: 'Cursiva',
    tipo: 'binario',
    padrao: 'negrito',
    variantes: {
      negrito: { upperBase: 0x1D4D0, lowerBase: 0x1D4EA },
      regular: { upperBase: 0x1D49C, lowerBase: 0x1D4B6, excecoes: EXCECOES_SCRIPT_REGULAR }
    },
    rotulos: { negrito: 'Negrito', regular: 'Regular' }
  },
  negrito: {
    nome: 'Negrito',
    tipo: 'lista',
    padrao: 'sansBoldItalic',
    variantes: {
      sansBoldItalic: { upperBase: 0x1D63C, lowerBase: 0x1D656 },
      sansBold: { upperBase: 0x1D5D4, lowerBase: 0x1D5EE, digitBase: 0x1D7EC },
      sansItalic: { upperBase: 0x1D608, lowerBase: 0x1D622 },
      boldItalic: { upperBase: 0x1D468, lowerBase: 0x1D482 },
      bold: { upperBase: 0x1D400, lowerBase: 0x1D41A, digitBase: 0x1D7CE },
      italic: { upperBase: 0x1D434, lowerBase: 0x1D44E, excecoes: EXCECAO_ITALICO }
    },
    rotulos: {
      sansBoldItalic: 'Sans Bold Italic', sansBold: 'Sans Bold', sansItalic: 'Sans Italic',
      boldItalic: 'Serif Bold Italic', bold: 'Serif Bold', italic: 'Serif Italic'
    }
  }
};

// ---------- ESTADO ----------
let grupoSelecionado = null;
const varianteAtiva = {
  gotico: GRUPOS.gotico.padrao,
  serifa: GRUPOS.serifa.padrao,
  cursiva: GRUPOS.cursiva.padrao,
  negrito: GRUPOS.negrito.padrao
};

// ---------- CONVERSOR ----------
const DIGITO_FALLBACK_BASE = 0x1D7CE; // dígitos "Bold" — usados quando o estilo não tem números próprios

function converterComEstilo(texto, config) {
  let resultado = '';
  for (const char of texto) {
    if (config.mapa) {
      const chave = char.toLowerCase();
      resultado += config.mapa[chave] !== undefined ? config.mapa[chave] : char;
      continue;
    }
    if (config.excecoes && config.excecoes[char] !== undefined) {
      resultado += config.excecoes[char];
    } else if (char >= 'A' && char <= 'Z') {
      resultado += String.fromCodePoint(config.upperBase + (char.charCodeAt(0) - 65));
    } else if (char >= 'a' && char <= 'z') {
      resultado += String.fromCodePoint(config.lowerBase + (char.charCodeAt(0) - 97));
    } else if (char >= '0' && char <= '9') {
      const base = config.digitBase !== undefined ? config.digitBase : DIGITO_FALLBACK_BASE;
      resultado += String.fromCodePoint(base + (char.charCodeAt(0) - 48));
    } else {
      resultado += char;
    }
  }
  return resultado;
}

// ---------- CARTÕES PRINCIPAIS ----------
const containerCartoes = document.getElementById('cartoes-fontes');

// Monta <input> + <span> via DOM (sem innerHTML), para que nenhum texto seja interpretado como HTML
function criarOpcao(tipo, nome, marcado, texto, classeTexto) {
  const input = document.createElement('input');
  input.type = tipo;
  if (nome) input.name = nome;
  input.checked = marcado;
  const span = document.createElement('span');
  if (classeTexto) span.className = classeTexto;
  span.textContent = texto;
  return [input, span];
}

function renderCartoes() {
  containerCartoes.replaceChildren();

  Object.entries(GRUPOS).forEach(([chave, grupo]) => {
    const config = grupo.variantes[varianteAtiva[chave]];
    const amostra = converterComEstilo(grupo.nome, config);

    const cartao = document.createElement('label');
    cartao.className = 'cartao-fonte' + (grupoSelecionado === chave ? ' selecionado' : '');
    cartao.append(...criarOpcao('radio', 'fonte-grupo', grupoSelecionado === chave, amostra, 'amostra'));

    cartao.querySelector('input').addEventListener('change', () => {
      grupoSelecionado = chave;
      renderCartoes();
      renderOpcoesAtivas();
      atualizarResultado();
    });

    containerCartoes.appendChild(cartao);
  });
}

// ---------- OPÇÕES DO GRUPO ATIVO ----------
const containerOpcoes = document.getElementById('opcoes-ativas');

function renderOpcoesAtivas() {
  containerOpcoes.replaceChildren();
  if (!grupoSelecionado) return;

  const grupo = GRUPOS[grupoSelecionado];

  if (grupo.tipo === 'binario') {
    const chaves = Object.keys(grupo.variantes);
    const alternativa = chaves.find(k => k !== grupo.padrao);
    const configPadrao = grupo.variantes[grupo.padrao];
    const rotuloEstilizado = converterComEstilo(grupo.rotulos[grupo.padrao], configPadrao);

    const wrap = document.createElement('label');
    wrap.className = 'opcao-checkbox';
    wrap.append(...criarOpcao('checkbox', null, varianteAtiva[grupoSelecionado] === grupo.padrao, rotuloEstilizado));

    wrap.querySelector('input').addEventListener('change', (e) => {
      varianteAtiva[grupoSelecionado] = e.target.checked ? grupo.padrao : alternativa;
      renderCartoes();
      atualizarResultado();
    });

    containerOpcoes.appendChild(wrap);

  } else if (grupo.tipo === 'lista') {
    const grade = document.createElement('div');
    grade.className = 'cartoes-fontes mini';

    Object.entries(grupo.variantes).forEach(([varKey, config]) => {
      const amostra = converterComEstilo('L', config);

      const cartao = document.createElement('label');
      cartao.className = 'cartao-fonte' + (varianteAtiva[grupoSelecionado] === varKey ? ' selecionado' : '');
      cartao.title = grupo.rotulos[varKey];
      cartao.append(...criarOpcao('radio', 'negrito-variante', varianteAtiva[grupoSelecionado] === varKey, amostra, 'amostra'));

      cartao.querySelector('input').addEventListener('change', () => {
        varianteAtiva[grupoSelecionado] = varKey;
        renderOpcoesAtivas();
        atualizarResultado();
      });

      grade.appendChild(cartao);
    });

    containerOpcoes.appendChild(grade);
  }
  // tipo 'unico' (Sobrescrito): não tem opções, container fica vazio
}

// ---------- ATUALIZAR O RESULTADO ----------
const inputTexto = document.getElementById('texto-entrada');
const outputTexto = document.getElementById('texto-resultado');

function atualizarResultado() {
  if (!grupoSelecionado) { outputTexto.value = ''; return; }
  const grupo = GRUPOS[grupoSelecionado];
  const config = grupo.variantes[varianteAtiva[grupoSelecionado]];
  outputTexto.value = converterComEstilo(inputTexto.value, config);
}

inputTexto.addEventListener('input', atualizarResultado);

// ---------- COPIAR ----------
// Tenta a API moderna; se ela não existir ou for negada, usa o método antigo
// (execCommand) sobre o próprio campo. Se tudo falhar, deixa o texto selecionado
// e avisa o usuário, em vez de fingir que copiou.
async function copiarTexto(campo) {
  const texto = campo.value;
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch (_) {
    campo.focus();
    campo.select();
    try {
      return document.execCommand('copy');
    } catch (_) {
      return false;
    }
  }
}

async function copiarCampo(campo) {
  if (!campo.value) {
    mostrarToast(campo === outputTexto ? 'Escolha um estilo e escreva um texto' : 'Nada para copiar', true);
    return;
  }
  const ok = await copiarTexto(campo);
  if (ok) {
    mostrarToast('Copiado!');
  } else {
    campo.focus();
    campo.select();
    mostrarToast('Não foi possível copiar. Use Ctrl+C / Copiar', true);
  }
}

document.getElementById('btn-copiar').addEventListener('click', () => copiarCampo(outputTexto));

let timerToast = null;
function mostrarToast(mensagem, erro = false) {
  const toast = document.getElementById('toast');
  toast.textContent = mensagem;
  toast.classList.toggle('erro', erro);
  toast.classList.add('mostrar');
  clearTimeout(timerToast);
  timerToast = setTimeout(() => toast.classList.remove('mostrar'), erro ? 3000 : 1500);
}

// ---------- BARRA DE SELEÇÃO FLUTUANTE (aba Caracteres) ----------
const caixaSelecionados = document.getElementById('caixa-selecionados');
const btnCopiarCaracteres = document.getElementById('btn-copiar-caracteres');
const barraSelecao = document.getElementById('barra-selecao');
const sentinelaFlutuante = document.getElementById('sentinela-flutuante');

function adicionarCaractere(simbolo) {
  caixaSelecionados.value += simbolo;
  btnCopiarCaracteres.classList.toggle('oculto', caixaSelecionados.value.length === 0);
}

// Permite apagar (Backspace, Delete, setas, Tab) mas bloqueia digitação/colagem
caixaSelecionados.addEventListener('keydown', (e) => {
  const teclasPermitidas = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
  if (!teclasPermitidas.includes(e.key)) {
    e.preventDefault();
  }
});

caixaSelecionados.addEventListener('input', () => {
  btnCopiarCaracteres.classList.toggle('oculto', caixaSelecionados.value.length === 0);
});

caixaSelecionados.addEventListener('paste', (e) => {
  e.preventDefault(); // bloqueia colar texto de fora também
});

btnCopiarCaracteres.addEventListener('click', () => copiarCampo(caixaSelecionados));

// Observa o "sentinela": quando ele sai da tela, a barra está grudada no topo
const observadorFlutuante = new IntersectionObserver(
  ([entrada]) => {
    barraSelecao.classList.toggle('grudado', !entrada.isIntersecting);
  },
  { threshold: 0 }
);
observadorFlutuante.observe(sentinelaFlutuante);

// ---------- BIBLIOTECA DE CARACTERES ESPECIAIS ----------
const CATEGORIAS_CARACTERES = [
  { nome: 'Estrelas', simbolos: ['★','☆','✮','✯','✡','✠','✦','✧','✩','✪','⍟','❂','✫','✬','✭','✰','⋆','⭑','⭒','∗','⁂','⁑','⁕','⊛','❋','✱','✲','✳','✴','✵','✶','✷','✸','✹','✺'] },
  { nome: 'Natureza & Clima', simbolos: ['☀','☁','☂','☃','☄','☉','☽','☾','☢','☣','❀','✿','❁','✻','✼','✾','❃','❇','❈','❉','❊','✢','✣','✤','✥','⚘'] },
  { nome: 'Música', simbolos: ['♬','♫','♪','♩','♭','♮','♯','𝄞','𝄡','𝄢'] },
  { nome: 'Xadrez, Cartas & Naipes', simbolos: ['♔','♕','♖','♗','♘','♙','♚','♛','♜','♝','♞','♟','♠','♥','♦','♣','♡','♢','♤','♧','☖','☗'] },
  { nome: 'Símbolos & Cultura', simbolos: ['☪','☭','ϟ','☠','✈','ツ','ヅ','☤','☫','☬','♰','♱','⚚','۞','۩','ૐ'] },
  { nome: 'Religioso', simbolos: ['✝','✞','✟','☦','☧','☨','☩','✛'] },
  { nome: 'Planetas & Alquimia', simbolos: ['☉','☿','♀','♁','♂','♃','♄','♅','♆','♇','⊕'] },
  { nome: 'Setas', simbolos: ['←','→','↑','↓','↔','↕','↖','↗','↘','↙','↩','↪','↺','↻','⇐','⇑','⇒','⇓','⇔','⤴','⤵','➔','➜','➤'] },
  { nome: 'Marcações', simbolos: ['✓','✔','✕','✖','✗','✘','☐','☑','☒'] },
  { nome: 'Correspondência & Escrita', simbolos: ['✉','✎','✏','✐','✑','✒'] },
  { nome: 'Tecnologia & Teclado', simbolos: ['⌘','⌥','⌃','⇧','⌫','⏎','⌦','⇥','⌨','⏏','⌂'] },
  { nome: 'Círculos', simbolos: ['○','●','◐','◑','◒','◓','◔','◕','◖','◗','◦','◯','⊙','⊚','⊘'] },
  { nome: 'Triângulos', simbolos: ['▲','△','▶','▷','►','▼','▽','◀','◁','◄','◢','◣','◤','◥'] },
  { nome: 'Polígonos', simbolos: ['⬟','⬠','◊','⋄','◆','◇','◈','❖','⬬','⬢','⬡','⬣'] },
  { nome: 'Blocos', simbolos: ['█','▓','▒','░','▀','▄','▌','▐','⬛','⬜'] },
  { nome: 'Dados', simbolos: ['⚀','⚁','⚂','⚃','⚄','⚅'] },
  { nome: 'Matemática', simbolos: ['±','∓','×','÷','≤','≥','≠','√','∛','∜','∑','∏','∞','∈','∉','∅','∫','∂','∆','∇','≈','≡','∝','∠','∪','∩','⊂','⊃','⊆','⊇','∀','∃','¬','∧','∨','⇒','⇔','‰','‱','ℕ','ℤ','ℚ','ℝ','ℂ'] },
  { nome: 'Letras Gregas', simbolos: ['α','β','γ','δ','ε','μ','φ','π','σ','θ'] },
  { nome: 'Frações', simbolos: ['½','⅓','⅔','¼','¾','⅕','⅖','⅗','⅘','⅙','⅚','⅐','⅛','⅜','⅝','⅞','⅑','⅒'] },
  { nome: 'Numerais Romanos', simbolos: ['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ','Ⅶ','Ⅷ','Ⅸ','Ⅹ','Ⅺ','Ⅻ','ⅰ','ⅱ','ⅲ','ⅳ','ⅴ','ⅵ','ⅶ','ⅷ','ⅸ','ⅹ'] },
  { nome: 'Números Circulados', simbolos: ['⓪','①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','❶','❷','❸','❹','❺','❻','❼','❽','❾','❿'] },
  { nome: 'Unidades & Medidas', simbolos: ['°','℃','℉','Ω','μ','²','³','′','″'] },
  { nome: 'Legal & Copyright', simbolos: ['©','®','™','℠','℗'] },
  { nome: 'Pontuação & Aspas', simbolos: ['§','¶','†','‡','•','…','¿','¡','№','‽','«','»','‹','›','“','”','‘','’','〈','〉','《','》','「','」','『','』','【','】'] }
];

const containerCategorias = document.getElementById('categorias-caracteres');

CATEGORIAS_CARACTERES.forEach(categoria => {
  const bloco = document.createElement('div');
  bloco.className = 'categoria';
  const titulo = document.createElement('h3');
  titulo.textContent = categoria.nome;
  bloco.appendChild(titulo);

  const grade = document.createElement('div');
  grade.className = 'grade-simbolos';

  categoria.simbolos.forEach(simbolo => {
    const btn = document.createElement('button');
    btn.className = 'simbolo-btn';
    btn.type = 'button';
    btn.textContent = simbolo;
    btn.addEventListener('click', () => {
  adicionarCaractere(simbolo);
});
    grade.appendChild(btn);
  });

  bloco.appendChild(grade);
  containerCategorias.appendChild(bloco);
});

// ---------- TROCA DE ABAS ----------
const botoesAba = document.querySelectorAll('.aba-btn');
const paineis = document.querySelectorAll('.painel');

botoesAba.forEach(botao => {
  botao.addEventListener('click', () => {
    const alvo = botao.dataset.aba;
    botoesAba.forEach(b => b.classList.remove('ativa'));
    botao.classList.add('ativa');
    paineis.forEach(p => p.classList.remove('ativo'));
    document.getElementById(alvo).classList.add('ativo');
  });
});

// ---------- INICIALIZAÇÃO ----------
renderCartoes();
renderOpcoesAtivas();