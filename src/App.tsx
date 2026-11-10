import { lazy, Suspense, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, GitFork, Moon, Search, Sun, Command as CmdIcon, BookOpen, Workflow, Info, ShieldAlert } from "lucide-react";
import { Cartao } from "@/components/Cartao";
import { Painel } from "@/components/Filtros";
import { Fluxos } from "@/components/Fluxos";
import { useCommandShortcut } from "@/lib/atalho";
import { carrega } from "@/lib/dados";
import { Dados, Item, STATUS, dataBR } from "@/lib/labels";
import { aplica, contagens, escreveUrl, Filtros, FILTROS_VAZIOS, gravaFavs, lerFavs, lerUrl, montaIndice } from "@/lib/busca";

const Paleta = lazy(() => import("@/components/Paleta"));

const PASSO = 30;
type Vista = "consulta" | "fluxos" | "sobre";

function temaInicial(): "light" | "dark" {
  const p = new URLSearchParams(location.search).get("modo");
  if (p === "claro") return "light";
  if (p === "escuro") return "dark";
  try {
    const g = localStorage.getItem("compendio:tema");
    if (g === "light" || g === "dark") return g;
  } catch { /* sem armazenamento */ }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function Esqueleto() {
  return (
    <div aria-busy="true" aria-label="Carregando verbetes" className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="card p-5">
          <div className="sk h-5 w-1/3" /><div className="sk mt-3 h-4 w-2/3" /><div className="sk mt-2 h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const inicial = useMemo(lerUrl, []);
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState(false);
  const [f, setF] = useState<Filtros>(inicial.f);
  const [vista, setVista] = useState<Vista>((["consulta", "fluxos", "sobre"].includes(inicial.vista) ? inicial.vista : "consulta") as Vista);
  const [aberto, setAberto] = useState<string | null>(inicial.id);
  const [favs, setFavs] = useState<Set<string>>(lerFavs);
  const [tema, setTema] = useState<"light" | "dark">(temaInicial);
  const [mostrar, setMostrar] = useState(PASSO);
  const [ordem, setOrdem] = useState<"padrao" | "recentes">("padrao");
  const [aviso, setAviso] = useState("");
  const [paletaAberta, setPaletaAberta] = useCommandShortcut();
  const [paletaQ, setPaletaQ] = useState("");
  const avisoTimer = useRef<number>();

  useEffect(() => {
    document.documentElement.dataset.theme = tema;
    try { localStorage.setItem("compendio:tema", tema); } catch { /* ok */ }
  }, [tema]);

  useEffect(() => {
    carrega().then((d) => {
      montaIndice(d.itens);
      setDados(d);
    }).catch(() => setErro(true));
  }, []);

  const qAdiada = useDeferredValue(f.q);
  const fEfetivo = useMemo(() => ({ ...f, q: qAdiada }), [f, qAdiada]);

  useEffect(() => { escreveUrl(f, aberto, vista); }, [f, aberto, vista]);
  useEffect(() => { setMostrar(PASSO); }, [f.q, f.tribunal, f.tipo, f.status, f.tema, f.de, f.ate, f.soVigor, f.soFav, ordem]);

  const porId = useMemo(() => new Map((dados?.itens ?? []).map((i) => [i.id, i])), [dados]);
  const cont = useMemo(() => (dados ? contagens(dados.itens) : null), [dados]);
  const anos = useMemo(() => [...new Set((dados?.itens ?? []).map((i) => i.ano).filter((a): a is number => !!a))].sort((a, b) => a - b), [dados]);

  const { lista, exato } = useMemo(() => {
    if (!dados) return { lista: [] as Item[], exato: 0 };
    const r = aplica(dados.itens, fEfetivo, favs);
    let l = r.lista;
    if (ordem === "recentes") l = [...l].sort((a, b) => (b.ano ?? 0) - (a.ano ?? 0) || b.numero - a.numero);
    return { lista: l, exato: r.exato };
  }, [dados, fEfetivo, favs, ordem]);

  // verbete aberto por link ou pela busca rápida aparece no topo mesmo fora dos filtros, sem entrar na contagem
  const fixado = aberto && porId.get(aberto) && !lista.some((i) => i.id === aberto) ? porId.get(aberto)! : null;

  const avisa = useCallback((m: string) => {
    setAviso(m);
    window.clearTimeout(avisoTimer.current);
    avisoTimer.current = window.setTimeout(() => setAviso(""), 3500);
  }, []);

  const alternaFav = (id: string) => {
    const n = new Set(favs);
    if (n.has(id)) n.delete(id); else n.add(id);
    setFavs(n); gravaFavs(n);
  };

  useEffect(() => {
    if (aberto && dados && vista === "consulta") {
      requestAnimationFrame(() => document.getElementById(`v-${aberto}`)?.scrollIntoView({ block: "start", behavior: "auto" }));
    }
    // só ao carregar por link
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados]);

  const abrirVerbete = (id: string) => {
    setVista("consulta");
    setF({ ...FILTROS_VAZIOS });
    setAberto(id);
    setPaletaAberta(false);
    requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById(`v-${id}`)?.scrollIntoView({ block: "start", behavior: "smooth" })));
  };
  const abrirTema = (t: string) => { setVista("consulta"); setF({ ...FILTROS_VAZIOS, tema: [t] }); };

  const [paletaJaAberta, setPaletaJaAberta] = useState(false);
  useEffect(() => { if (paletaAberta) setPaletaJaAberta(true); }, [paletaAberta]);

  const visiveis = lista.slice(0, mostrar);
  const filtrando = !!(f.q || f.tribunal.length || f.tipo.length || f.status.length || f.tema.length || f.de != null || f.ate != null || f.soVigor || f.soFav);

  return (
    <>
      <a href="#conteudo" className="skip-link">Ir para o conteúdo</a>

      <div role="note" className="border-b border-border bg-muted px-4 py-2 text-center text-[13px] text-muted-foreground sm:text-[13.5px]">
        <ShieldAlert aria-hidden className="mr-1.5 inline size-3.5 align-[-2px]" />
        Conteúdo informativo, sem caráter de consultoria ou aconselhamento jurídico. Confira sempre a jurisprudência na fonte oficial.
      </div>

      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1100px] items-center gap-2 px-4 py-2.5 sm:px-6">
          <a href="./" className="logo mr-auto text-[17px] no-underline hover:no-underline" aria-label="Compêndio trabalhista, início" onClick={(e) => { e.preventDefault(); setVista("consulta"); setF({ ...FILTROS_VAZIOS }); setAberto(null); window.scrollTo({ top: 0 }); }}>
            <span className="logo__s" aria-hidden="true">§</span>Compêndio trabalhista
          </a>
          <nav aria-label="Principal" className="hidden items-center gap-1 sm:flex">
            {([["consulta", "Consulta", BookOpen], ["fluxos", "Fluxogramas", Workflow], ["sobre", "Sobre", Info]] as const).map(([v, nome, Ic]) => (
              <button key={v} className="btn border-transparent bg-transparent" aria-current={vista === v ? "page" : undefined} style={vista === v ? { fontWeight: 650, color: "var(--primary)" } : undefined} onClick={() => setVista(v)}>
                <Ic className="size-4" aria-hidden />{nome}
              </button>
            ))}
          </nav>
          <button className="btn" onClick={() => setPaletaAberta(true)} aria-label="Abrir busca rápida (Ctrl+K)">
            <CmdIcon className="size-4" aria-hidden /><span className="hidden sm:inline">Busca rápida</span><kbd className="hidden rounded bg-muted px-1.5 font-sans text-[12px] sm:inline">Ctrl K</kbd>
          </button>
          <button className="btn btn--icone" onClick={() => setTema(tema === "dark" ? "light" : "dark")} aria-label={tema === "dark" ? "Mudar para o modo claro" : "Mudar para o modo escuro"}>
            {tema === "dark" ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
          </button>
        </div>
        <nav aria-label="Principal (celular)" className="flex gap-1 border-t border-border px-3 py-1.5 sm:hidden">
          {([["consulta", "Consulta"], ["fluxos", "Fluxogramas"], ["sobre", "Sobre"]] as const).map(([v, nome]) => (
            <button key={v} className="btn flex-1 justify-center border-transparent bg-transparent" aria-current={vista === v ? "page" : undefined} style={vista === v ? { fontWeight: 650, color: "var(--primary)", background: "var(--accent)" } : undefined} onClick={() => setVista(v)}>{nome}</button>
          ))}
        </nav>
      </header>

      <main id="conteudo" className="mx-auto max-w-[1100px] px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
        {vista === "consulta" && (
          <>
            <div className="mb-8">
              <h1 className="text-balance text-[clamp(34px,6vw,56px)] font-semibold leading-[1.05] tracking-[-0.035em] text-verde-noite">
                Jurisprudência trabalhista, <span className="assinatura">sem perder tempo.</span>
              </h1>
              <p className="mt-3 max-w-[60ch] text-[17px] text-muted-foreground">
                Súmulas, OJs, precedentes e temas do TST e do STF, com situação, data de verificação e link para a fonte oficial.
              </p>
              <form role="search" className="mt-6" onSubmit={(e) => e.preventDefault()}>
                <label htmlFor="busca" className="sr-only">Buscar por número, tema ou palavra</label>
                <div className="relative">
                  <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="busca" type="search" autoComplete="off" spellCheck={false}
                    value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })}
                    placeholder="Ex.: 331, OJ 191, SDI-1 54, “horas in itinere”, prescrição"
                    className="h-14 w-full rounded-full border border-input bg-card pl-12 pr-5 text-[17px] outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30"
                  />
                </div>
                <p className="mt-2 px-2 text-[13.5px] text-muted-foreground">Número, espécie e órgão são reconhecidos. Use aspas para buscar a frase exata.</p>
              </form>
            </div>

            {cont ? <Painel f={f} set={setF} cont={cont} anos={anos} /> : <div aria-hidden className="min-h-[44px] md:min-h-[232px]"><div className="sk h-11 w-32 md:h-full md:w-full" /></div>}

            <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <p className="text-[15px]" role="status" aria-live="polite">
                {dados ? <><strong>{lista.length.toLocaleString("pt-BR")}</strong> {lista.length === 1 ? "resultado" : "resultados"}{exato > 0 && f.q ? ` · ${exato} com este número` : ""}</> : "Carregando…"}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button className="btn" aria-pressed={f.soFav} onClick={() => setF({ ...f, soFav: !f.soFav })} style={f.soFav ? { borderColor: "var(--primary)", background: "var(--accent)" } : undefined}>
                  <Bookmark className="size-4" aria-hidden /> Favoritos ({favs.size})
                </button>
                <label className="sr-only" htmlFor="ordem">Ordenar</label>
                <select id="ordem" className="btn" value={ordem} onChange={(e) => setOrdem(e.target.value as "padrao" | "recentes")}>
                  <option value="padrao">Ordem padrão</option>
                  <option value="recentes">Mais recentes</option>
                </select>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {erro && <div className="card p-6" role="alert"><p className="font-semibold">Não foi possível carregar os verbetes.</p><p className="mt-1 text-muted-foreground">Verifique a conexão e recarregue a página.</p></div>}
              {!dados && !erro && <Esqueleto />}
              {dados && fixado && (
                <>
                  <p className="px-1 text-[13.5px] text-muted-foreground">Verbete aberto por link ou busca rápida (fora dos filtros atuais):</p>
                  <Cartao r={fixado} aberto onToggle={() => setAberto(null)} fav={favs.has(fixado.id)} onFav={() => alternaFav(fixado.id)} avisa={avisa} />
                  {lista.length > 0 && <hr className="border-border" />}
                </>
              )}
              {dados && visiveis.map((r) => (
                <Cartao key={r.id} r={r} aberto={aberto === r.id} onToggle={() => setAberto(aberto === r.id ? null : r.id)} fav={favs.has(r.id)} onFav={() => alternaFav(r.id)} avisa={avisa} />
              ))}
              {dados && lista.length === 0 && (
                <div className="card p-8 text-center">
                  <p className="text-[19px] font-semibold">{f.soFav && favs.size === 0 ? "Você ainda não favoritou nada" : "Nenhum verbete encontrado"}</p>
                  <p className="mx-auto mt-2 max-w-[48ch] text-muted-foreground">
                    {f.soFav && favs.size === 0 ? "Use o marcador em cada verbete para guardá-lo aqui. Os favoritos ficam só neste navegador." : "Tente menos palavras, busque só pelo número ou retire algum filtro."}
                  </p>
                  {filtrando && <button className="btn btn--primario mt-5" onClick={() => setF({ ...FILTROS_VAZIOS })}>Limpar busca e filtros</button>}
                </div>
              )}
              {dados && lista.length > mostrar && (
                <div className="pt-3 text-center">
                  <button className="btn" onClick={() => setMostrar(mostrar + PASSO)}>Mostrar mais {Math.min(PASSO, lista.length - mostrar)} (faltam {(lista.length - mostrar).toLocaleString("pt-BR")})</button>
                </div>
              )}
            </div>
          </>
        )}

        {vista === "fluxos" && dados && <Fluxos itens={porId} abrirVerbete={abrirVerbete} abrirTema={abrirTema} />}
        {vista === "fluxos" && !dados && <Esqueleto />}

        {vista === "sobre" && (
          <article className="max-w-[68ch]">
            <h1 className="text-[clamp(30px,5vw,44px)] font-semibold tracking-tight text-verde-noite">Sobre este compêndio</h1>
            <div className="mt-5 space-y-4 text-[16.5px] leading-relaxed">
              <p>É uma ferramenta de consulta rápida à jurisprudência trabalhista: súmulas, orientações jurisprudenciais, precedentes normativos, recursos repetitivos e alguns temas do STF com impacto direto na matéria. Nasceu da minha rotina de advogado trabalhista e agora está aberta para quem precisar.</p>
              <h2 className="pt-2 text-[22px] font-semibold text-verde-noite">Como ler o status</h2>
              <ul className="space-y-2">
                {Object.entries(STATUS).map(([k, v]) => <li key={k} className="flex flex-wrap items-baseline gap-x-3"><span className={`badge st-${k}`}><span aria-hidden>{v.simbolo}</span>{v.rotulo}</span><span className="text-[15px] text-muted-foreground">{v.dica}</span></li>)}
              </ul>
              <h2 className="pt-2 text-[22px] font-semibold text-verde-noite">De onde vêm os dados</h2>
              <p>Todos os textos são de fontes oficiais públicas (TST, STF). Cada verbete mostra a data da última verificação e o link para a fonte. Em muitos verbetes do TST o link aponta para a listagem oficial, e é preciso localizar o verbete pelo número. A base geral foi verificada em {dados ? dataBR(dados.baseVerificadaEm) : "…"}; os itens marcados como “Novo” foram verificados em novembro de 2026. <strong>Esta base não foi reverificada por inteiro após essas datas</strong>, então confirme na fonte antes de citar.</p>
              <h2 className="pt-2 text-[22px] font-semibold text-verde-noite">Privacidade</h2>
              <p>Não há cadastro, rastreamento nem coleta de dados. Seus favoritos e o tema escolhido ficam apenas no seu navegador.</p>
              <h2 className="pt-2 text-[22px] font-semibold text-verde-noite">Aviso</h2>
              <p>Conteúdo informativo, sem caráter de consultoria ou aconselhamento jurídico. A jurisprudência muda e deve ser conferida na fonte oficial. Nada aqui promete resultado nem substitui a análise de um advogado.</p>
              <h2 className="pt-2 text-[22px] font-semibold text-verde-noite">Licenças</h2>
              <p>Código sob licença MIT. Conteúdo organizado e editorial de uso livre (CC0). Os textos oficiais são públicos.</p>
              <p className="flex items-center gap-2 pt-2"><GitFork className="size-4" aria-hidden /> <a href="https://github.com/ygorsoaresadv-blip/compendio-trabalhista" target="_blank" rel="noopener noreferrer">Código-fonte no GitHub<span className="sr-only"> (abre em nova aba)</span></a></p>
            </div>
          </article>
        )}
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1100px] flex-col gap-3 px-4 py-8 text-[13.5px] text-muted-foreground sm:px-6">
          <p><span className="logo"><span className="logo__s" aria-hidden="true">§</span>Compêndio trabalhista</span> · criado por <a href="https://ygor.blog" target="_blank" rel="noopener noreferrer">Ygor Soares<span className="sr-only"> (abre em nova aba)</span></a></p>
          <p>Conteúdo informativo, sem caráter de consultoria ou aconselhamento jurídico. Confira a jurisprudência na fonte oficial. Sem cookies, sem rastreamento.</p>
          {dados && <p>Base verificada em {dataBR(dados.baseVerificadaEm)} · gerada em {dataBR(dados.geradoEm)}</p>}
        </div>
      </footer>

      {paletaJaAberta && dados && (
        <Suspense fallback={null}>
          <Paleta
            open={paletaAberta}
            onOpenChange={(o) => { setPaletaAberta(o); if (!o) setPaletaQ(""); }}
            q={paletaQ} setQ={setPaletaQ} porId={porId} tema={tema}
            abrirVerbete={abrirVerbete}
            irFluxos={() => { setVista("fluxos"); setPaletaAberta(false); }}
            irFavoritos={() => { setVista("consulta"); setF({ ...FILTROS_VAZIOS, soFav: true }); setPaletaAberta(false); }}
            irVigor={() => { setVista("consulta"); setF({ ...FILTROS_VAZIOS, soVigor: true }); setPaletaAberta(false); }}
            irSobre={() => { setVista("sobre"); setPaletaAberta(false); }}
            alternaTema={() => { setTema(tema === "dark" ? "light" : "dark"); setPaletaAberta(false); }}
          />
        </Suspense>
      )}

      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-[80] flex justify-center px-4">
        {aviso && <p className="rounded-full bg-verde-noite px-5 py-3 text-[14.5px] font-medium shadow-xl" style={{ color: "var(--background)" }}>{aviso}</p>}
      </div>
    </>
  );
}
