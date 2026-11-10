import MiniSearch from "minisearch";
import { Item, rotulo, TIPOS } from "./labels";

export interface Filtros {
  q: string;
  tribunal: string[];
  tipo: string[];
  status: string[];
  tema: string[];
  de: number | null;
  ate: number | null;
  soVigor: boolean;
  soFav: boolean;
}

export const FILTROS_VAZIOS: Filtros = { q: "", tribunal: [], tipo: [], status: [], tema: [], de: null, ate: null, soVigor: false, soFav: false };

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

let mini: MiniSearch<Item & { alvo: string }> | null = null;
const porId = new Map<string, Item>();

export function montaIndice(itens: Item[]) {
  porId.clear();
  itens.forEach((i) => porId.set(i.id, i));
  mini = new MiniSearch<Item & { alvo: string }>({
    fields: ["alvo", "rubrica", "tese", "questao", "observacao", "referencia", "temasTxt"],
    storeFields: [],
    idField: "id",
    processTerm: (t) => semAcento(t),
    searchOptions: { boost: { alvo: 6, rubrica: 4, temasTxt: 2 }, prefix: true, fuzzy: (t) => (t.length > 5 ? 0.15 : 0), combineWith: "AND" },
  });
  mini.addAll(
    itens.map((i) => ({
      ...i,
      alvo: `${rotulo(i)} ${TIPOS[i.tipo]?.curto ?? ""} ${i.tipo} ${i.numero} ${i.orgao ?? ""} ${i.tribunal}`,
      temasTxt: i.temas.join(" "),
    })) as any
  );
}

const PREFIXOS: Record<string, string> = {
  sum: "sumula", sumula: "sumula", s: "sumula",
  sv: "sumula_vinculante",
  oj: "oj", ojt: "oj_transitoria",
  pn: "pn", irr: "irr", iac: "iac", irdr: "irdr", adc: "adc", tema: "tema_rg",
};

/** "331", "OJ 191", "SDI-1 54", "sv 22", "tema 1389": devolve o que bate exatamente com o número. */
export function porNumero(q: string): Item[] | null {
  const t = semAcento(q).replace(/[ºo°.]/g, " ").replace(/\bn\b/g, " ").replace(/\s+/g, " ").trim();
  const m = t.match(/^(?:(sumula vinculante|sumula|sum|sv|ojt|oj|pn|irr|iac|irdr|adc|tema|s)\s*)?(?:(sdi-?\s?[12]|sdc|pleno)\s*)?(\d{1,5})$/);
  if (!m) return null;
  const [, pre, org, num] = m;
  const tipo = pre ? (pre === "sumula vinculante" ? "sumula_vinculante" : PREFIXOS[pre]) : undefined;
  const orgao = org ? org.replace(/\s/g, "").replace(/^sdi-?/, "SDI-").toUpperCase() : undefined;
  const n = Number(num);
  const hits = [...porId.values()].filter((i) => i.numero === n && (!tipo || i.tipo === tipo || (tipo === "oj" && i.tipo === "oj_transitoria" && false)) && (!orgao || (i.orgao ?? "").toUpperCase() === orgao));
  return hits.length ? hits : null;
}

export function pesquisa(q: string, limite = 5000): { ids: string[]; exato: number } {
  const termo = q.trim();
  if (!termo || !mini) return { ids: [], exato: 0 };
  const exatos = porNumero(termo) ?? [];
  const exatosIds = exatos.sort((a, b) => (a.status === "em_vigor" ? -1 : 1) - (b.status === "em_vigor" ? -1 : 1)).map((i) => i.id);
  const frase = termo.match(/^"(.+)"$/);
  let achados: string[];
  if (frase) {
    const alvo = semAcento(frase[1]);
    achados = [...porId.values()].filter((i) => semAcento(`${i.rubrica ?? ""} ${i.tese} ${i.questao ?? ""}`).includes(alvo)).map((i) => i.id);
  } else {
    achados = mini.search(termo).slice(0, limite).map((r) => r.id as string);
  }
  const vistos = new Set(exatosIds);
  return { ids: [...exatosIds, ...achados.filter((id) => !vistos.has(id))], exato: exatosIds.length };
}

export function aplica(itens: Item[], f: Filtros, favs: Set<string>): { lista: Item[]; exato: number } {
  let base = itens;
  let exato = 0;
  if (f.q.trim()) {
    const r = pesquisa(f.q);
    exato = r.exato;
    const ordem = new Map(r.ids.map((id, i) => [id, i]));
    base = itens.filter((i) => ordem.has(i.id)).sort((a, b) => ordem.get(a.id)! - ordem.get(b.id)!);
  }
  const lista = base.filter(
    (i) =>
      (!f.tribunal.length || f.tribunal.includes(i.tribunal)) &&
      (!f.tipo.length || f.tipo.includes(i.tipo)) &&
      (!f.status.length || f.status.includes(i.status)) &&
      (!f.tema.length || i.temas.some((t) => f.tema.includes(t))) &&
      (f.de == null || (i.ano != null && i.ano >= f.de)) &&
      (f.ate == null || (i.ano != null && i.ano <= f.ate)) &&
      (!f.soVigor || i.status === "em_vigor") &&
      (!f.soFav || favs.has(i.id))
  );
  return { lista, exato };
}

export function contagens(itens: Item[]) {
  const c = (f: (i: Item) => string[]) => {
    const m = new Map<string, number>();
    itens.forEach((i) => f(i).forEach((k) => m.set(k, (m.get(k) ?? 0) + 1)));
    return m;
  };
  return { tribunal: c((i) => [i.tribunal]), tipo: c((i) => [i.tipo]), status: c((i) => [i.status]), tema: c((i) => i.temas) };
}

// --- estado na URL (compartilhável) ---
const lista = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);
export function lerUrl(): { f: Filtros; id: string | null; vista: string } {
  const p = new URLSearchParams(location.search);
  const num = (k: string) => (p.get(k) && /^\d{4}$/.test(p.get(k)!) ? Number(p.get(k)) : null);
  return {
    f: { q: p.get("q") ?? "", tribunal: lista(p.get("tribunal")), tipo: lista(p.get("tipo")), status: lista(p.get("status")), tema: lista(p.get("tema")), de: num("de"), ate: num("ate"), soVigor: p.get("vigor") === "1", soFav: p.get("fav") === "1" },
    id: p.get("v"),
    vista: p.get("vista") ?? "consulta",
  };
}
export function escreveUrl(f: Filtros, id: string | null, vista: string) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.tribunal.length) p.set("tribunal", f.tribunal.join(","));
  if (f.tipo.length) p.set("tipo", f.tipo.join(","));
  if (f.status.length) p.set("status", f.status.join(","));
  if (f.tema.length) p.set("tema", f.tema.join(","));
  if (f.de != null) p.set("de", String(f.de));
  if (f.ate != null) p.set("ate", String(f.ate));
  if (f.soVigor) p.set("vigor", "1");
  if (f.soFav) p.set("fav", "1");
  if (id) p.set("v", id);
  if (vista !== "consulta") p.set("vista", vista);
  const s = p.toString();
  const url = location.pathname + (s ? `?${s}` : "");
  if (url !== location.pathname + location.search) history.replaceState(null, "", url);
}

// --- favoritos (só neste navegador; nada vai para servidor) ---
const CHAVE = "compendio:favoritos";
export function lerFavs(): Set<string> {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(CHAVE) || "[]"));
  } catch {
    return new Set();
  }
}
export function gravaFavs(s: Set<string>) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify([...s]));
  } catch {
    /* navegador sem armazenamento: favoritos só valem nesta sessão */
  }
}
