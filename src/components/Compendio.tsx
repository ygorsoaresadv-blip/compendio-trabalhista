import { Fragment, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { ATALHOS, Estado, ESTADO_INICIAL, LOTE, ORGAOS, atalhoLigado, busca, interpreta, maisLigados, marcador, ordena, resumo, Indexado } from "@/lib/busca";
import { STATUS, citacaoABNT, citacaoForense, dataBR, ehTema, especieNome, ico, nome } from "@/lib/labels";

const EXEMPLOS = ["331", "terceirização", "OJ 191", "“empresa interposta”", "SV 22", "horas extras", "tema 128", "PN 119", "intervalo intrajornada", "SDI-2 54", "ADC 80"];

function destaca(texto: string, m: RegExp | null): ReactNode {
  if (!m) return texto;
  const partes = texto.split(m);
  return partes.map((p, i) => (i % 2 ? <mark key={i}>{p}</mark> : <Fragment key={i}>{p}</Fragment>));
}

function Copia({ rotulo, texto, onFalha }: { rotulo: string; texto: string; onFalha: (m: string) => void }) {
  const [ok, setOk] = useState(false);
  const feito = () => { setOk(true); setTimeout(() => setOk(false), 1800); };
  const copia = async () => {
    try { await navigator.clipboard.writeText(texto); feito(); return; } catch { /* tenta o método antigo */ }
    const ta = document.createElement("textarea");
    ta.value = texto; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.left = "-9999px";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); feito(); } catch { onFalha("Não foi possível copiar. Selecione o texto e use Ctrl+C."); }
    ta.remove();
  };
  return <button type="button" className={`btn-mini${ok ? " ok" : ""}`} onClick={copia}>{ok ? "Copiado ✓" : rotulo}</button>;
}

interface CartaoProps { v: Indexado; m: RegExp | null; aberto: boolean; alvo: boolean; fav: boolean; onFav: () => void; avisa: (m: string) => void }

function Cartao({ v, m, aberto, alvo, fav, onFav, avisa }: CartaoProps) {
  const [i, sigla] = ico(v);
  const st = STATUS[v.status];
  const link = () => { const u = new URL(location.href); u.search = ""; u.searchParams.set("v", v.id); return u.toString(); };
  const teorCopia = `${v.tribunal}, ${nome(v)}: ${v.rubrica ? v.rubrica + "\n\n" : ""}${v.tese}\nFonte: ${v.url ?? ""}. Verificado em ${dataBR(v.verificado)}.`;
  const hist = v.historico ? [...v.historico].sort((a, b) => (b.data ?? "").localeCompare(a.data ?? "")) : [];
  return (
    <li className={`sum-cartao${alvo ? " alvo" : ""}`} id={`s-${v.id}`} data-status={v.status}>
      <details key={v.id + (aberto ? "a" : "f")} open={aberto}>
        <summary>
          <span className="sum-ico" data-e={i} aria-hidden="true">{sigla}</span>
          <span className="sum-linha">
            <b>{nome(v)} <small>{v.tribunal}</small>{fav && <span className="fav-marca" aria-label="Favorito">★</span>}</b>
            <span className="res">{destaca(resumo(v, m), m)}</span>
          </span>
          <span className="sum-selo" data-status={v.status}>{st?.rotulo ?? v.status}</span>
          <i className="sum-seta" aria-hidden="true" />
        </summary>
        <div className="sum-corpo">
          <p className="sum-especie">{especieNome(v)}</p>
          {v.temas.length > 0 && <ul className="sum-temas">{v.temas.map((t) => <li key={t}>{destaca(t, m)}</li>)}</ul>}
          {v.rubrica && <p className={`sum-rubrica${v.tese ? "" : " so-rubrica"}`}>{destaca(v.rubrica, m)}</p>}
          {v.teseTipo === "resumo" && <p className="sum-tipo-teor">Resumo da notícia oficial. A tese literal ainda não foi localizada.</p>}
          {v.tese && <div className="sum-teor">{destaca(v.tese, m)}</div>}
          {v.statusDetalhe && <p className="sum-obs">{v.statusDetalhe}</p>}
          {v.modulacao && <p className="sum-obs"><b>Modulação de efeitos:</b> {v.modulacao}</p>}
          {(v.relator || v.redator || v.dataJulgamento || v.processo) && (
            <dl className="sum-dl">
              {v.relator && <div><dt>Relator</dt><dd>{v.relator}</dd></div>}
              {v.redator && <div><dt>Redator do acórdão</dt><dd>{v.redator}</dd></div>}
              {v.dataJulgamento && <div><dt>Data do julgamento</dt><dd>{dataBR(v.dataJulgamento)}</dd></div>}
              {v.processo && <div><dt>Processo</dt><dd>{v.processo}</dd></div>}
            </dl>
          )}
          {v.questao && <div className="sum-questao"><div className="k">Questão jurídica</div><p>{destaca(v.questao, m)}</p></div>}
          {v.pendencias && <div className="sum-questao"><div className="k">Pendências de verificação</div><ul>{v.pendencias.map((p, k) => <li key={k}>{p}</li>)}</ul></div>}
          {v.observacao && <p className="sum-obs">{v.observacao}</p>}
          {v.referencia && <p className="sum-ref"><b>Referência legislativa:</b> {v.referencia}</p>}
          {v.alerta && (
            <div className="sum-alerta">
              <div className="k">Atenção</div>
              <p>{v.alerta.texto}</p>
              {v.alerta.fonte_url && <p><a href={v.alerta.fonte_url} target="_blank" rel="noopener noreferrer">Decisão na fonte oficial<span className="sr-only"> (abre em nova aba)</span></a></p>}
            </div>
          )}
          {hist.length > 0 && (
            <details className="sum-hist">
              <summary>Histórico de redações ({hist.length})</summary>
              <ol className="linha-tempo">
                {hist.map((h, k) => (
                  <li key={k}>
                    <b>{h.evento ?? "Evento"}</b>{h.data && <time dateTime={h.data}>{dataBR(h.data)}</time>}
                    {h.ato && <p>{h.ato}</p>}
                    {h.obs && <p>{h.obs}</p>}
                  </li>
                ))}
              </ol>
            </details>
          )}
          <div className="sum-pe">
            {v.url && <a className="fonte" href={v.url} target="_blank" rel="noopener noreferrer">Fonte oficial<span className="sr-only"> (abre em nova aba)</span></a>}
            {v.urlProcesso && <a className="fonte" href={v.urlProcesso} target="_blank" rel="noopener noreferrer">Andamento no STF<span className="sr-only"> (abre em nova aba)</span></a>}
            <Copia rotulo="Copiar teor" texto={teorCopia} onFalha={avisa} />
            <Copia rotulo="Citação forense" texto={citacaoForense(v)} onFalha={avisa} />
            <Copia rotulo="Citação ABNT" texto={citacaoABNT(v)} onFalha={avisa} />
            <Copia rotulo="Copiar link" texto={link()} onFalha={avisa} />
            <button type="button" className="btn-mini" aria-pressed={fav} onClick={onFav}>{fav ? "★ Favorito" : "☆ Favoritar"}</button>
            <span className="verif">{v.urlGenerica ? "Link oficial: listagem do tribunal. " : ""}Verificado em {dataBR(v.verificado)}</span>
          </div>
        </div>
      </details>
    </li>
  );
}

function Sel({ id, rotulo, valor, itens, onChange }: { id: string; rotulo: string; valor: string; itens: [string, string][]; onChange: (v: string) => void }) {
  return (
    <label>{rotulo}
      <select id={id} value={valor} onChange={(e) => onChange(e.target.value)}>
        {itens.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </label>
  );
}

interface Props {
  dados: Indexado[] | null;
  erro: boolean;
  e: Estado;
  setE: (f: (a: Estado) => Estado) => void;
  favs: Set<string>;
  alternaFav: (id: string) => void;
  avisa: (m: string) => void;
}

export function Compendio({ dados, erro, e, setE, favs, alternaFav, avisa }: Props) {
  const [texto, setTexto] = useState(e.q);
  const [ex, setEx] = useState(0);
  const atraso = useRef<number>();
  const temas = useMemo(() => [...new Set((dados ?? []).flatMap((v) => v.temas))].sort((a, b) => a.localeCompare(b, "pt-BR")), [dados]);
  const statusDisp = useMemo(() => Object.keys(STATUS).filter((s) => (dados ?? []).some((v) => v.status === s)), [dados]);

  useEffect(() => { setTexto(e.q); }, [e.q]);
  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) setEx((i) => (i + 1) % EXEMPLOS.length); }, 2600);
    return () => clearInterval(t);
  }, []);

  const consulta = useMemo(() => interpreta(e.q), [e.q]);
  const achados = useMemo(() => (dados ? ordena(busca(dados, e, consulta, favs), e.ordem) : []), [dados, e, consulta, favs]);
  const m = useMemo(() => marcador(consulta), [consulta]);
  const abre = achados.length <= 3 || (consulta.tipo === "numero" && achados.length <= 6);
  const restam = achados.length - e.limite;

  const muda = (patch: Partial<Estado>) => setE((a) => ({ ...a, alvo: null, limite: LOTE, ...patch }));
  const digita = (v: string) => {
    setTexto(v);
    window.clearTimeout(atraso.current);
    atraso.current = window.setTimeout(() => muda({ q: v }), 110);
  };

  // abre o verbete pedido por link direto e o destaca por um instante
  const [piscar, setPiscar] = useState<string | null>(null);
  useEffect(() => {
    if (!dados || !e.alvo) return;
    const el = document.getElementById(`s-${e.alvo}`);
    if (el) { el.scrollIntoView({ block: "start" }); window.scrollBy(0, -70); setPiscar(e.alvo); const t = setTimeout(() => setPiscar(null), 2400); return () => clearTimeout(t); }
  }, [dados, e.alvo]);

  const resumoFiltros = () => {
    const p: string[] = [];
    if (e.especie !== "todas") p.push((ATALHOS.find((a) => a[0] === e.especie)?.[1] ?? e.especie).toLowerCase());
    if (e.tribunal !== "todos") p.push(e.tribunal);
    if (e.orgao !== "todos") p.push(e.orgao);
    if (e.status !== "todos") p.push((STATUS[e.status]?.rotulo ?? "").toLowerCase());
    if (e.tema) p.push(e.tema.toLowerCase());
    if (e.soFav) p.push("favoritos");
    return p.length ? ` · filtros: ${p.join(", ")}` : "";
  };

  const n = maisLigados(e);
  return (
    <div className="sum">
      <section className="spot" aria-label="Busca do compêndio">
        <div className="spot-barra">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5L21 21" /></svg>
          <div className={`spot-campo${texto ? " cheio" : ""}`}>
            <span className="spot-ph" aria-hidden="true"><span key={ex} className={ex ? "entra" : ""}>{ex ? `Tente ${EXEMPLOS[ex]}` : "Número ou palavra"}</span></span>
            <input className="spot-input" id="sumBusca" type="search" autoComplete="off" spellCheck={false} aria-label="Buscar no compêndio por número ou palavra" value={texto} onChange={(ev) => digita(ev.target.value)} />
          </div>
          <button type="button" className="spot-limpa" aria-label="Limpar a busca" hidden={!texto} onClick={() => { setTexto(""); muda({ q: "" }); document.getElementById("sumBusca")?.focus(); }}>✕</button>
          <kbd className="spot-kbd" title="Tecle / para buscar">/</kbd>
        </div>

        <div className="spot-atalhos">
          <div className="seg" role="group" aria-label="Espécie">
            {ATALHOS.map(([k, t]) => <button key={k} type="button" aria-pressed={atalhoLigado(e, k)} onClick={() => muda({ especie: k })}>{t}</button>)}
          </div>
          <button type="button" className="chave" role="switch" aria-checked={e.status === "em_vigor"} onClick={() => muda({ status: e.status === "em_vigor" ? "todos" : "em_vigor" })}>
            <i aria-hidden="true" />Só o que está em vigor
          </button>
        </div>

        <p className="spot-dica">Digite o número, como <b>331</b>, <b>OJ 191</b> ou <b>tema 128</b>, ou as palavras da publicação. Aspas procuram a frase exata.<span className="so-largo"> Tecle <b>/</b> ou <b>Ctrl K</b> para buscar e as setas <b>↑</b> <b>↓</b> para percorrer os resultados.</span></p>

        <details className="spot-mais">
          <summary>Mais filtros{n ? ` (${n})` : ""}</summary>
          <div className="spot-grade">
            <Sel id="sumTribunal" rotulo="Tribunal" valor={e.tribunal} itens={[["todos", "Todos"], ["TST", "TST"], ["STF", "STF"]]} onChange={(v) => muda({ tribunal: v })} />
            <Sel id="sumOrgao" rotulo="Órgão" valor={e.orgao} itens={[["todos", "Todos"], ...ORGAOS.map((o): [string, string] => [o, o])]} onChange={(v) => muda({ orgao: v })} />
            <Sel id="sumTema" rotulo="Tema" valor={e.tema} itens={[["", "Todos os temas"], ...temas.map((t): [string, string] => [t, t])]} onChange={(v) => muda({ tema: v })} />
            <Sel id="sumStatus" rotulo="Status" valor={e.status} itens={[["todos", "Todos"], ...statusDisp.map((s): [string, string] => [s, STATUS[s].rotulo])]} onChange={(v) => muda({ status: v })} />
            <Sel id="sumEspecie" rotulo="Espécie exata" valor={e.especie} itens={[["todas", "Todas"], ["sumulas", "Súmulas, todas"], ["sumula", "Súmula"], ["sumula_vinculante", "Súmula vinculante"], ["ojs", "OJs, todas"], ["oj", "OJ"], ["oj_transitoria", "OJ transitória"], ["pn", "Precedente normativo"], ["tema", "Tema repetitivo ou de repercussão geral"], ["adc", "ADC"]]} onChange={(v) => muda({ especie: v })} />
            <Sel id="sumOrdem" rotulo="Ordem" valor={e.ordem} itens={[["num-asc", "Número crescente"], ["num-desc", "Número decrescente"], ["especie", "Espécie"]]} onChange={(v) => muda({ ordem: v as Estado["ordem"] })} />
            <div className="acoes-f">
              <button type="button" className="btn-mini" aria-pressed={e.soFav} onClick={() => muda({ soFav: !e.soFav })}>★ Só favoritos ({favs.size})</button>
              <button type="button" className="btn-mini" onClick={() => { setTexto(""); setE(() => ({ ...ESTADO_INICIAL })); }}>Limpar filtros</button>
            </div>
          </div>
        </details>
      </section>

      <p className="sum-conta" role="status" aria-live="polite">
        {!dados ? <span>Carregando verbetes…</span> : e.alvo ? (
          <span>Um registro aberto por link direto. <button type="button" className="sum-texto" onClick={() => muda({ alvo: null })}>Ver o acervo inteiro</button></span>
        ) : achados.length === 0 ? <span>Nenhum resultado{resumoFiltros()}</span> : (
          <span><b>{achados.length.toLocaleString("pt-BR")}</b>{achados.length === 1 ? " registro" : " registros"}{resumoFiltros()}{achados.length > e.limite ? ` · mostrando ${e.limite}` : ""}</span>
        )}
      </p>

      {erro && <p className="sum-vazio" role="alert"><b>Não foi possível carregar os verbetes</b>Verifique a conexão e recarregue a página.</p>}
      {!dados && !erro && <div aria-hidden="true" className="sum-lista">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="sk-linha" />)}</div>}
      {dados && (
        <ul className="sum-lista" id="sumLista">
          {achados.length === 0 ? (
            <li className="sum-vazio"><b>{e.soFav && favs.size === 0 ? "Você ainda não favoritou nada" : "Nenhum verbete encontrado"}</b>{e.soFav && favs.size === 0 ? "Use “Favoritar” dentro de um verbete. Os favoritos ficam só neste navegador." : "Tente o número puro, outra palavra, ou limpe os filtros."}</li>
          ) : achados.slice(0, e.limite).map(({ v }) => (
            <Cartao key={v.id} v={v} m={m} aberto={abre || !!e.alvo} alvo={piscar === v.id} fav={favs.has(v.id)} onFav={() => alternaFav(v.id)} avisa={avisa} />
          ))}
        </ul>
      )}
      {dados && restam > 0 && (
        <div className="sum-mais"><button type="button" className="btn" onClick={() => setE((a) => ({ ...a, limite: a.limite + LOTE }))}>Mostrar mais {Math.min(restam, LOTE)} · faltam {restam}</button></div>
      )}

      <p className="sum-fonte"><b>Este compêndio é conferência rápida, não a fonte.</b> O status e o teor mudam por resolução do tribunal; confira na fonte oficial antes de citar em peça. Súmulas, orientações jurisprudenciais e precedentes normativos vêm da pesquisa de jurisprudência do Tribunal Superior do Trabalho e do portal de súmulas do Supremo Tribunal Federal; os temas de recursos repetitivos vêm do Índice Temático de Precedentes Qualificados do TST. O tema de cada verbete é etiqueta de navegação atribuída aqui, não classificação oficial.</p>
    </div>
  );
}

export { ehTema };
