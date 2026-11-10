// Busca do compêndio. Portada do compêndio do fluxograma do escritório:
// número entende a espécie, aspas procuram a frase exata, o resto são palavras soltas.
import { ehTema, Item } from "./labels";

export const LOTE = 40;
export const ORGAOS = ["SDI-1", "SDI-2", "SDC", "Tribunal Pleno"];

export interface Indexado extends Item {
  _num: string;
  _teor: string;
  _temas: string;
}

export interface Estado {
  q: string;
  especie: string;
  tribunal: string;
  orgao: string;
  status: string;
  tema: string;
  ordem: "num-asc" | "num-desc" | "especie";
  limite: number;
  alvo: string | null;
  soFav: boolean;
}

export const ESTADO_INICIAL: Estado = { q: "", especie: "todas", tribunal: "todos", orgao: "todos", status: "todos", tema: "", ordem: "num-asc", limite: LOTE, alvo: null, soFav: false };

export const norm = (s: string) =>
  String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

export function indexa(itens: Item[]): Indexado[] {
  return itens.map((v) => ({
    ...v,
    temas: v.temas || [],
    _num: String(v.numero),
    _teor: norm(`${v.rubrica ?? ""} ${v.tese} ${v.questao ?? ""}`),
    _temas: norm(`${v.temas.join(" ")} ${v.orgao ?? ""}`),
  }));
}

export const ATALHOS: [string, string][] = [["todas", "Tudo"], ["sumulas", "Súmulas"], ["ojs", "OJs"], ["pn", "Precedentes"], ["tema", "Temas repetitivos"]];
const GRUPOS: Record<string, string[]> = { sumulas: ["sumula", "sumula_vinculante"], ojs: ["oj", "oj_transitoria"] };
export const atalhoLigado = (e: Estado, a: string) => e.especie === a || (GRUPOS[a] ? GRUPOS[a].includes(e.especie) : false);
export const maisLigados = (e: Estado) =>
  (ATALHOS.some((a) => a[0] === e.especie) ? 0 : 1) + (e.tribunal !== "todos" ? 1 : 0) + (e.orgao !== "todos" ? 1 : 0) +
  (e.status !== "todos" && e.status !== "em_vigor" ? 1 : 0) + (e.tema ? 1 : 0) + (e.soFav ? 1 : 0);

const PREFIXOS: [RegExp, string][] = [
  [/^s(?:u|ú)mulas?\s+vinculantes?\s*n?[º°o]?\s*(\d+)$/, "sumula_vinculante"],
  [/^sv\s*n?[º°o]?\s*(\d+)$/, "sumula_vinculante"],
  [/^o\.?\s?j\.?\s*transit(?:o|ó)rias?\s*n?[º°o]?\s*(\d+)$/, "oj_transitoria"],
  [/^ojt\s*n?[º°o]?\s*(\d+)$/, "oj_transitoria"],
  [/^o\.?\s?j\.?\s*n?[º°o]?\s*(\d+)$/, "oj"],
  [/^orienta(?:c|ç)(?:a|ã)o\s+jurisprudencial\s*n?[º°o]?\s*(\d+)$/, "oj"],
  [/^sbdi\s*-?\s*1\s*n?[º°o]?\s*(\d+)$/, "SDI-1"],
  [/^sdi\s*-?\s*1\s*n?[º°o]?\s*(\d+)$/, "SDI-1"],
  [/^sbdi\s*-?\s*2\s*n?[º°o]?\s*(\d+)$/, "SDI-2"],
  [/^sdi\s*-?\s*2\s*n?[º°o]?\s*(\d+)$/, "SDI-2"],
  [/^sdc\s*n?[º°o]?\s*(\d+)$/, "SDC"],
  [/^pn\s*n?[º°o]?\s*(\d+)$/, "pn"],
  [/^precedente\s+normativo\s*n?[º°o]?\s*(\d+)$/, "pn"],
  [/^adc\s*n?[º°o]?\s*(\d+)$/, "adc"],
  [/^(?:irr|iac|irdr)\s*n?[º°o]?\s*(\d+)$/, "tema"],
  [/^temas?\s*n?[º°o]?\s*(\d+)$/, "tema"],
  [/^tst\s*n?[º°o]?\s*(\d+)$/, "TST"],
  [/^stf\s*n?[º°o]?\s*(\d+)$/, "STF"],
  [/^s(?:u|ú)mulas?\s*n?[º°o]?\s*(\d+)$/, "sumulas"],
  [/^(\d+)$/, "qualquer"],
];

export interface Consulta { tipo: "vazia" | "numero" | "texto"; numero?: string; escopo?: string; termos: string[]; frases: string[] }

export function interpreta(q: string): Consulta {
  const plano = norm(q);
  if (!plano) return { tipo: "vazia", termos: [], frases: [] };
  for (const [re, escopo] of PREFIXOS) {
    const m = plano.match(re);
    if (m) return { tipo: "numero", numero: m[1], escopo, termos: [], frases: [] };
  }
  const frases: string[] = [];
  const resto = plano.replace(/"([^"]*)"/g, (_, f: string) => {
    const t = f.trim();
    if (t) frases.push(t);
    return " ";
  });
  const termos = resto.split(/\s+/).filter(Boolean);
  if (!termos.length && !frases.length) return { tipo: "vazia", termos: [], frases: [] };
  return { tipo: "texto", termos, frases };
}

function noEscopo(v: Indexado, escopo: string) {
  if (escopo === "qualquer") return true;
  if (escopo === "TST" || escopo === "STF") return v.tribunal === escopo;
  if (escopo === "sumulas") return v.tipo === "sumula" || v.tipo === "sumula_vinculante";
  if (escopo === "tema") return ehTema(v);
  if (ORGAOS.includes(escopo)) return v.orgao === escopo;
  return v.tipo === escopo;
}

function passa(v: Indexado, e: Estado, favs: Set<string>) {
  if (e.especie !== "todas") {
    if (e.especie === "tema") { if (!ehTema(v)) return false; }
    else if (GRUPOS[e.especie]) { if (!GRUPOS[e.especie].includes(v.tipo)) return false; }
    else if (v.tipo !== e.especie) return false;
  }
  if (e.tribunal !== "todos" && v.tribunal !== e.tribunal) return false;
  if (e.orgao !== "todos" && v.orgao !== e.orgao) return false;
  if (e.status !== "todos" && v.status !== e.status) return false;
  if (e.tema && !v.temas.includes(e.tema)) return false;
  if (e.soFav && !favs.has(v.id)) return false;
  return true;
}

// peso 3 = número exato, 2 = tema ou número parcial, 1 = teor
function casa(v: Indexado, c: Consulta): number {
  if (c.tipo === "vazia") return 0;
  if (c.tipo === "numero") {
    if (!noEscopo(v, c.escopo!)) return -1;
    if (v._num === c.numero) return 3;
    return v._num.indexOf(c.numero!) === 0 ? 2 : -1;
  }
  const tudo = `${v._num} ${v._temas} ${v._teor}`;
  const ok = c.termos.every((t) => tudo.includes(t)) && c.frases.every((f) => `${v._temas} ${v._teor}`.includes(f));
  if (!ok) return -1;
  if (c.termos.some((t) => v._num === t)) return 3;
  if (c.termos.some((t) => v._temas.includes(t)) || c.frases.some((f) => v._temas.includes(f))) return 2;
  return 1;
}

export interface Achado { v: Indexado; peso: number }

export function busca(base: Indexado[], e: Estado, c: Consulta, favs: Set<string>): Achado[] {
  if (e.alvo) return base.filter((v) => v.id === e.alvo).map((v) => ({ v, peso: 3 }));
  const dentro = base.filter((v) => passa(v, e, favs));
  if (c.tipo === "vazia") return dentro.map((v) => ({ v, peso: 0 }));
  if (c.tipo === "numero") {
    const exatos: Achado[] = [], parciais: Achado[] = [];
    dentro.forEach((v) => {
      const p = casa(v, c);
      if (p === 3) exatos.push({ v, peso: 3 });
      else if (p === 2) parciais.push({ v, peso: 2 });
    });
    return exatos.length ? exatos : parciais;
  }
  const saida: Achado[] = [];
  dentro.forEach((v) => {
    const p = casa(v, c);
    if (p > 0) saida.push({ v, peso: p });
  });
  return saida;
}

const PESO_TIPO: Record<string, number> = { sumula: 0, sumula_vinculante: 1, oj: 2, oj_transitoria: 3, pn: 4, irr: 5, iac: 6, irdr: 7, adc: 8, tema_rg: 9 };

export function ordena(itens: Achado[], ordem: Estado["ordem"]): Achado[] {
  const dir = ordem === "num-desc" ? -1 : 1;
  return [...itens].sort((a, b) => {
    if (a.peso !== b.peso) return b.peso - a.peso;
    if (ordem === "especie") {
      const pa = PESO_TIPO[a.v.tipo] ?? 99, pb = PESO_TIPO[b.v.tipo] ?? 99;
      if (pa !== pb) return pa - pb;
      const oa = a.v.orgao || "", ob = b.v.orgao || "";
      if (oa !== ob) return oa < ob ? -1 : 1;
      return a.v.numero - b.v.numero;
    }
    if (a.v.numero !== b.v.numero) return (a.v.numero - b.v.numero) * dir;
    const pa = PESO_TIPO[a.v.tipo] ?? 99, pb = PESO_TIPO[b.v.tipo] ?? 99;
    if (pa !== pb) return pa - pb;
    return (a.v.orgao || "") < (b.v.orgao || "") ? -1 : 1;
  });
}

// ---------- marca-texto ----------
const CLASSES: Record<string, string> = { a: "aàáâãä", e: "eèéêë", i: "iìíîï", o: "oòóôõö", u: "uùúûü", c: "cç", n: "nñ", y: "yýÿ" };
function paraRegex(termo: string) {
  let saida = "";
  for (const ch of termo) {
    if (CLASSES[ch]) saida += `[${CLASSES[ch]}]`;
    else if (ch === " ") saida += "\\s+";
    else saida += ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  return saida;
}
export function marcador(c: Consulta): RegExp | null {
  if (c.tipo !== "texto") return null;
  const partes = c.frases.concat(c.termos).filter((t) => t.length >= 2).sort((a, b) => b.length - a.length).map(paraRegex);
  return partes.length ? new RegExp(`(${partes.join("|")})`, "gi") : null;
}

/** O TST abre quase todo verbete por uma rubrica em caixa alta. */
export function resumo(v: Indexado, m: RegExp | null): string {
  let t = (v.rubrica || v.tese || v.questao || "").replace(/\s+/g, " ").trim();
  if (m) {
    const tudo = `${v.rubrica ?? ""} ${v.tese} ${v.questao ?? ""}`.replace(/\s+/g, " ");
    m.lastIndex = 0;
    const x = m.exec(tudo);
    m.lastIndex = 0;
    if (x) t = x.index > 50 ? "…" + tudo.slice(x.index - 40) : tudo;
  }
  return t.slice(0, 240);
}

// ---------- estado na URL (compartilhável) ----------
export function lerUrl(): { e: Estado; vista: string } {
  const p = new URLSearchParams(location.search);
  const ordem = p.get("ordem");
  return {
    e: {
      ...ESTADO_INICIAL,
      q: p.get("q") ?? "",
      especie: p.get("especie") ?? "todas",
      tribunal: p.get("tribunal") ?? "todos",
      orgao: p.get("orgao") ?? "todos",
      status: p.get("status") ?? "todos",
      tema: p.get("tema") ?? "",
      ordem: ordem === "num-desc" || ordem === "especie" ? ordem : "num-asc",
      alvo: p.get("v"),
      soFav: p.get("fav") === "1",
    },
    vista: p.get("vista") ?? "consulta",
  };
}
export function escreveUrl(e: Estado, vista: string) {
  const p = new URLSearchParams();
  if (e.q) p.set("q", e.q);
  if (e.especie !== "todas") p.set("especie", e.especie);
  if (e.tribunal !== "todos") p.set("tribunal", e.tribunal);
  if (e.orgao !== "todos") p.set("orgao", e.orgao);
  if (e.status !== "todos") p.set("status", e.status);
  if (e.tema) p.set("tema", e.tema);
  if (e.ordem !== "num-asc") p.set("ordem", e.ordem);
  if (e.soFav) p.set("fav", "1");
  if (e.alvo) p.set("v", e.alvo);
  if (vista !== "consulta") p.set("vista", vista);
  const s = p.toString();
  const url = location.pathname + (s ? `?${s}` : "");
  if (url !== location.pathname + location.search) history.replaceState(null, "", url);
}

// ---------- favoritos (só neste navegador) ----------
const CHAVE = "compendio:favoritos";
export function lerFavs(): Set<string> {
  try { return new Set<string>(JSON.parse(localStorage.getItem(CHAVE) || "[]")); } catch { return new Set(); }
}
export function gravaFavs(s: Set<string>) {
  try { localStorage.setItem(CHAVE, JSON.stringify([...s])); } catch { /* sem armazenamento: vale só nesta sessão */ }
}
