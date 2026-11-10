// Gera src/data/compendio.json a partir de data/base.json + data/novos.json + data/patches.json.
// Roda no build. Não acessa a rede.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ler = (f) => JSON.parse(fs.readFileSync(path.join(raiz, "data", f), "utf8"));
const base = ler("base.json");
const novos = ler("novos.json");
const patches = ler("patches.json");

const limpa = (s) =>
  typeof s !== "string"
    ? s
    : s
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<\/?[a-z][^>]*>/gi, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/[ \t]+/g, " ")
        .replace(/ ?\n ?/g, "\n")
        .trim();

const LISTAGEM = {
  sumula: base.fontes["tst-sum"],
  oj: base.fontes["tst-oj"],
  oj_transitoria: base.fontes["tst-oj"],
  pn: base.fontes["tst-pn"],
  irr: base.fontes["tst-irr"],
  iac: base.fontes["tst-irr"],
  irdr: base.fontes["tst-irr"],
};

const compacto = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && !v.length)));

const itens = [];
for (const r of base.registros) {
  const teor = limpa(r.teor);
  const i = teor.indexOf("\n\n");
  const rubrica = i > 0 ? teor.slice(0, i).trim() : "";
  const tese = i > 0 ? teor.slice(i + 2).trim() : teor;
  const datas = (r.historico || []).map((h) => h.data).filter(Boolean).sort();
  const alerta = patches.alertas[r.id] || (r.alerta ? { texto: r.alerta.texto, fonte_url: r.alerta.fonte_url } : null);
  const url = r.fonte_url || LISTAGEM[r.tipo] || null;
  itens.push(
    compacto({
      id: r.id,
      tribunal: r.tribunal,
      tipo: r.tipo,
      numero: r.numero,
      orgao: r.orgao,
      rubrica,
      tese,
      status: r.status,
      temas: r.temas,
      questao: limpa(r.questao),
      referencia: limpa(r.referencia),
      observacao: limpa(r.observacao),
      suspensao: r.suspensao ? true : null,
      historico: (r.historico || []).map((h) => compacto({ evento: h.evento, ato: h.ato, data: h.data, obs: limpa(h.observacao) })),
      ano: datas[0] ? Number(datas[0].slice(0, 4)) : null,
      alerta,
      url,
      urlGenerica: r.fonte_url ? null : true,
      verificado: r.verificado_em,
    })
  );
}

// Novos registros (ADC 80, Tema 1389): só campos verificados na fonte oficial.
const VOCAB = {
  stf: "STF",
};
for (const n of novos.registros) {
  itens.push(
    compacto({
      id: n.id,
      tribunal: n.tribunal,
      tipo: n.tipo,
      numero: n.numero,
      classe: n.classe,
      relator: n.relator,
      redator: n.redator_acordao,
      processo: n.processo_paradigma || n.numero_unico,
      dataJulgamento: n.data_julgamento,
      rubrica: n.tema ? n.tema.toUpperCase() : "",
      tese: n.resumo_oficial || n.status_detalhe || "",
      teseTipo: "resumo",
      modulacao: n.modulacao,
      statusDetalhe: n.status_detalhe,
      status: n.status,
      temas: n.tipo === "adc" ? ["Honorários, custas e justiça gratuita"] : ["Contrato e vínculo de emprego"],
      historico: n.data_julgamento ? [{ evento: n.tipo === "adc" ? "Julgamento de mérito" : "Decisão de relator (suspensão)", data: n.tipo === "adc" ? n.data_julgamento : "2026-06-18", obs: n.tipo === "adc" ? "Notícia oficial do STF de 03/09/2026." : "Retirada da suspensão nacional para 1ª instância e TRTs; notícia oficial de 18/06/2026." }] : [{ evento: "Decisão de relator (suspensão)", data: "2026-06-18", obs: "Retirada da suspensão nacional para 1ª instância e TRTs; notícia oficial de 18/06/2026." }],
      ano: n.data_julgamento ? Number(n.data_julgamento.slice(0, 4)) : 2026,
      pendencias: n.pendencias,
      impacto: n.impacto,
      url: n.fonte_url,
      urlProcesso: n.fonte_processo_url,
      verificado: n.verificado_em,
      novo: true,
    })
  );
}

const ordem = { sumula_vinculante: 0, sumula: 1, tema_rg: 2, adc: 3, irr: 4, iac: 5, irdr: 6, oj: 7, oj_transitoria: 8, pn: 9 };
itens.sort((a, b) => (a.tribunal === b.tribunal ? 0 : a.tribunal === "STF" ? -1 : 1) || (ordem[a.tipo] ?? 99) - (ordem[b.tipo] ?? 99) || a.numero - b.numero);

const saida = {
  geradoEm: new Date().toISOString().slice(0, 10),
  baseVerificadaEm: base.verificadoEm,
  total: itens.length,
  itens,
};
fs.mkdirSync(path.join(raiz, "src", "data"), { recursive: true });
fs.writeFileSync(path.join(raiz, "src", "data", "compendio.json"), JSON.stringify(saida));
const kb = Math.round(fs.statSync(path.join(raiz, "src", "data", "compendio.json")).size / 1024);
console.log(`compendio.json: ${itens.length} itens, ${kb} KB`);
