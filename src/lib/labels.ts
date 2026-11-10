export interface Historico {
  evento?: string;
  ato?: string;
  data?: string;
  obs?: string;
}

export interface Item {
  id: string;
  tribunal: "TST" | "STF";
  tipo: string;
  numero: number;
  orgao?: string;
  classe?: string;
  relator?: string;
  redator?: string;
  processo?: string;
  dataJulgamento?: string;
  rubrica?: string;
  tese: string;
  teseTipo?: "resumo";
  modulacao?: string;
  statusDetalhe?: string;
  status: string;
  temas: string[];
  questao?: string;
  referencia?: string;
  observacao?: string;
  suspensao?: boolean;
  historico?: Historico[];
  ano?: number;
  alerta?: { texto: string; fonte_url?: string };
  pendencias?: string[];
  impacto?: string[];
  url?: string;
  urlProcesso?: string;
  urlGenerica?: boolean;
  verificado?: string;
  novo?: boolean;
}

export interface Dados {
  geradoEm: string;
  baseVerificadaEm: string;
  total: number;
  itens: Item[];
}

export const TIPOS: Record<string, { curto: string; longo: string }> = {
  sumula: { curto: "Súmula", longo: "Súmula" },
  sumula_vinculante: { curto: "SV", longo: "Súmula Vinculante" },
  oj: { curto: "OJ", longo: "Orientação Jurisprudencial" },
  oj_transitoria: { curto: "OJT", longo: "OJ Transitória" },
  pn: { curto: "PN", longo: "Precedente Normativo" },
  irr: { curto: "IRR", longo: "Recurso Repetitivo (IRR)" },
  iac: { curto: "IAC", longo: "Incidente de Assunção de Competência" },
  irdr: { curto: "IRDR", longo: "Incidente de Resolução de Demandas Repetitivas" },
  adc: { curto: "ADC", longo: "Ação Declaratória de Constitucionalidade" },
  tema_rg: { curto: "Tema RG", longo: "Tema de Repercussão Geral" },
};

// Cada status tem texto e símbolo próprios: a cor nunca é o único sinal.
export const STATUS: Record<string, { rotulo: string; dica: string }> = {
  em_vigor: { rotulo: "Em vigor", dica: "Entendimento vigente na data da verificação." },
  cancelada: { rotulo: "Cancelada", dica: "Cancelada ou revogada pelo tribunal. Não use como fundamento atual." },
  convertida: { rotulo: "Convertida", dica: "Convertida em outro verbete; veja a observação para o verbete que a substituiu." },
  superada: { rotulo: "Superada", dica: "Superada por decisão posterior." },
  afetado: { rotulo: "Afetado", dica: "Tema afetado a julgamento em recurso repetitivo; ainda sem tese firmada." },
  julgado_acordao_pendente: { rotulo: "Julgado, acórdão pendente", dica: "Julgamento de mérito concluído; acórdão e tese literal ainda não localizados na fonte oficial." },
  rg_reconhecida_merito_pendente: { rotulo: "RG reconhecida, mérito pendente", dica: "Repercussão geral reconhecida; mérito ainda não julgado." },
};

export const nomeTribunal = (t: string) => (t === "STF" ? "Supremo Tribunal Federal" : "Tribunal Superior do Trabalho");

export function rotulo(r: Item): string {
  const n = r.numero;
  switch (r.tipo) {
    case "sumula": return `Súmula ${n} do ${r.tribunal}`;
    case "sumula_vinculante": return `Súmula Vinculante ${n}`;
    case "oj": return `OJ ${n} da ${r.orgao ?? "SDI"}`;
    case "oj_transitoria": return `OJ Transitória ${n} da ${r.orgao ?? "SDI"}`;
    case "pn": return `PN ${n}${r.orgao ? ` da ${r.orgao}` : ""}`;
    case "irr": return `IRR ${n} (Tema ${n}) do TST`;
    case "iac": return `IAC ${n} do TST`;
    case "irdr": return `IRDR ${n} do TST`;
    case "adc": return `ADC ${n} do STF`;
    case "tema_rg": return `Tema ${n} do STF (repercussão geral)`;
    default: return `${r.tipo} ${n}`;
  }
}

const dataBR = (iso?: string) => {
  if (!iso) return "";
  const [a, m, d] = iso.split("-");
  return d && m && a ? `${d}/${m}/${a}` : iso;
};
export { dataBR };

const hoje = () => new Date().toLocaleDateString("pt-BR");

/** Citação em formato forense (para colar em peça). */
export function citacaoForense(r: Item): string {
  const lbl = rotulo(r);
  const st = STATUS[r.status]?.rotulo ?? r.status;
  const corpo = r.rubrica ? `${r.rubrica.replace(/\.$/, "")}. ` : "";
  const aviso = r.status === "em_vigor" ? "" : ` [situação: ${st.toLowerCase()}]`;
  const fonte = r.url ? ` Fonte oficial: ${r.url}` : "";
  const relator = r.relator ? ` Rel. ${r.relator.replace(/ \(.*\)/, "")}.` : "";
  const data = r.dataJulgamento ? ` Julgado em ${dataBR(r.dataJulgamento)}.` : "";
  const resumo = r.teseTipo === "resumo" ? "[resumo da notícia oficial; tese literal ainda não localizada] " : "";
  return `${lbl}: ${corpo}${resumo}${r.tese.replace(/\s+/g, " ").trim()}${aviso}${relator}${data}${fonte}`;
}

/** Citação ABNT (NBR 6023) para jurisprudência. */
export function citacaoABNT(r: Item): string {
  const orgaoAutor = r.tribunal === "STF" ? "BRASIL. Supremo Tribunal Federal." : "BRASIL. Tribunal Superior do Trabalho.";
  const titulo = (() => {
    switch (r.tipo) {
      case "sumula": return `Súmula nº ${r.numero}`;
      case "sumula_vinculante": return `Súmula Vinculante nº ${r.numero}`;
      case "oj": return `Orientação Jurisprudencial nº ${r.numero} da ${r.orgao ?? "SDI"}`;
      case "oj_transitoria": return `Orientação Jurisprudencial Transitória nº ${r.numero} da ${r.orgao ?? "SDI"}`;
      case "pn": return `Precedente Normativo nº ${r.numero}`;
      case "irr": return `Incidente de Recursos Repetitivos nº ${r.numero}`;
      case "iac": return `Incidente de Assunção de Competência nº ${r.numero}`;
      case "irdr": return `Incidente de Resolução de Demandas Repetitivas nº ${r.numero}`;
      case "adc": return `Ação Declaratória de Constitucionalidade nº ${r.numero}`;
      case "tema_rg": return `Tema ${r.numero} da repercussão geral`;
      default: return rotulo(r);
    }
  })();
  const prefixo = r.teseTipo === "resumo" ? "[Resumo da notícia oficial; tese literal ainda não localizada] " : "";
  const ementa = [r.rubrica?.replace(/\.$/, ""), prefixo + r.tese.replace(/\s+/g, " ").trim()].filter(Boolean).join(". ");
  const extra = [r.relator ? `Relator: ${r.relator.replace(/ \(.*\)/, "")}.` : "", r.dataJulgamento ? `Julgado em ${dataBR(r.dataJulgamento)}.` : ""].filter(Boolean).join(" ");
  const link = r.url ? ` Disponível em: ${r.url}. Acesso em: ${hoje()}.` : "";
  return `${orgaoAutor} ${titulo}. ${ementa}. ${extra}${link}`.replace(/\s+/g, " ").replace(/\.\./g, ".").trim();
}

// ---------- nomes e ícones, como no compêndio do fluxograma ----------
const TEMA_TIPOS = ["irr", "iac", "irdr", "tema_rg"];
export const ehTema = (r: { tipo: string }) => TEMA_TIPOS.includes(r.tipo);

export function nome(r: Item): string {
  switch (r.tipo) {
    case "sumula": return `Súmula nº ${r.numero}`;
    case "sumula_vinculante": return `Súmula Vinculante nº ${r.numero}`;
    case "oj": return `OJ nº ${r.numero}${r.orgao ? " da " + r.orgao : ""}`;
    case "oj_transitoria": return `OJ Transitória nº ${r.numero}${r.orgao ? " da " + r.orgao : ""}`;
    case "pn": return `Precedente Normativo nº ${r.numero}`;
    case "adc": return `ADC nº ${r.numero}`;
    case "tema_rg": return `Tema ${r.numero} · RG`;
    default: return `Tema ${r.numero} · ${r.tipo.toUpperCase()}`;
  }
}

export function ico(r: Item): [string, string] {
  if (r.tipo === "sumula") return ["sumula", "S"];
  if (r.tipo === "sumula_vinculante") return ["sv", "SV"];
  if (r.tipo === "oj" || r.tipo === "oj_transitoria") return ["oj", "OJ"];
  if (r.tipo === "pn") return ["pn", "PN"];
  if (r.tipo === "adc") return ["stf", "ADC"];
  if (r.tipo === "tema_rg") return ["stf", "RG"];
  return ["tema", r.tipo.toUpperCase()];
}

export function especieNome(r: Item): string {
  const e: Record<string, string> = {
    sumula: "SÚMULA", sumula_vinculante: "SÚMULA VINCULANTE", oj: "ORIENTAÇÃO JURISPRUDENCIAL",
    oj_transitoria: "ORIENTAÇÃO JURISPRUDENCIAL TRANSITÓRIA", pn: "PRECEDENTE NORMATIVO",
    irr: "TEMA DE RECURSO REPETITIVO · IRR", iac: "INCIDENTE DE ASSUNÇÃO DE COMPETÊNCIA · IAC",
    irdr: "INCIDENTE DE RESOLUÇÃO DE DEMANDAS REPETITIVAS · IRDR", adc: "AÇÃO DECLARATÓRIA DE CONSTITUCIONALIDADE",
    tema_rg: "TEMA DE REPERCUSSÃO GERAL",
  };
  return [r.tribunal, e[r.tipo] ?? r.tipo.toUpperCase(), r.orgao?.toUpperCase()].filter(Boolean).join(" · ");
}
