import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Compendio } from "@/components/Compendio";
import { Fluxos } from "@/components/Fluxos";
import { carrega } from "@/lib/dados";
import { Dados, STATUS, dataBR } from "@/lib/labels";
import { Estado, ESTADO_INICIAL, escreveUrl, gravaFavs, indexa, Indexado, lerFavs, lerUrl } from "@/lib/busca";

type Vista = "consulta" | "fluxos" | "sobre";
const VISTAS: [Vista, string][] = [["consulta", "Compêndio"], ["fluxos", "Fluxogramas"], ["sobre", "Sobre"]];

function modoInicial(): "claro" | "escuro" {
  const p = new URLSearchParams(location.search).get("modo");
  if (p === "claro" || p === "escuro") return p;
  try { if (localStorage.getItem("compendio:modo") === "escuro") return "escuro"; } catch { /* sem armazenamento */ }
  return "claro"; // como o fluxograma do escritório: sempre começa claro
}

export default function App() {
  const inicial = useMemo(lerUrl, []);
  const [pacote, setPacote] = useState<Dados | null>(null);
  const [dados, setDados] = useState<Indexado[] | null>(null);
  const [erro, setErro] = useState(false);
  const [e, setE] = useState<Estado>(inicial.e);
  const [vista, setVista] = useState<Vista>((["consulta", "fluxos", "sobre"].includes(inicial.vista) ? inicial.vista : "consulta") as Vista);
  const [favs, setFavs] = useState<Set<string>>(lerFavs);
  const [modo, setModo] = useState<"claro" | "escuro">(modoInicial);
  const [aviso, setAviso] = useState("");
  const timer = useRef<number>();

  useEffect(() => {
    document.documentElement.dataset.modo = modo;
    try { localStorage.setItem("compendio:modo", modo); } catch { /* ok */ }
  }, [modo]);

  useEffect(() => {
    carrega().then((p) => { setPacote(p); setDados(indexa(p.itens)); }).catch(() => setErro(true));
  }, []);

  useEffect(() => { escreveUrl(e, vista); }, [e, vista]);

  const avisa = useCallback((m: string) => {
    setAviso(m);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAviso(""), 3500);
  }, []);

  const alternaFav = (id: string) => {
    const n = new Set(favs);
    if (n.has(id)) n.delete(id); else n.add(id);
    setFavs(n); gravaFavs(n);
  };

  const porId = useMemo(() => new Map((dados ?? []).map((v) => [v.id, v])), [dados]);

  // teclas: "/" e Ctrl/⌘ K levam à busca; ↑ ↓ percorrem os resultados
  useEffect(() => {
    const foca = () => {
      setVista("consulta");
      requestAnimationFrame(() => {
        const el = document.getElementById("sumBusca") as HTMLInputElement | null;
        el?.focus(); el?.select();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    };
    const onKey = (ev: KeyboardEvent) => {
      const tag = document.activeElement?.tagName ?? "";
      if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === "k") { ev.preventDefault(); foca(); return; }
      if (ev.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) { ev.preventDefault(); foca(); return; }
      if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
        const ae = document.activeElement as HTMLElement | null;
        const noCampo = ae?.id === "sumBusca";
        const naLista = !!ae?.closest("#sumLista") && ae?.tagName === "SUMMARY";
        if (!noCampo && !naLista) return;
        const linhas = [...document.querySelectorAll<HTMLElement>("#sumLista > li > details > summary")];
        if (!linhas.length) return;
        ev.preventDefault();
        const i = naLista ? linhas.indexOf(ae!) : -1;
        if (ev.key === "ArrowDown") (linhas[i + 1] ?? linhas[linhas.length - 1]).focus();
        else if (i <= 0) document.getElementById("sumBusca")?.focus();
        else linhas[i - 1].focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const abrirVerbete = (id: string) => { setVista("consulta"); setE({ ...ESTADO_INICIAL, alvo: id }); window.scrollTo({ top: 0 }); };
  const abrirTema = (t: string) => { setVista("consulta"); setE({ ...ESTADO_INICIAL, tema: t }); window.scrollTo({ top: 0 }); };

  const cont = (f: (v: Indexado) => boolean) => (dados ?? []).filter(f).length;
  const nSum = cont((v) => v.tipo === "sumula" || v.tipo === "sumula_vinculante");
  const nOJ = cont((v) => v.tipo === "oj" || v.tipo === "oj_transitoria");
  const nPN = cont((v) => v.tipo === "pn");
  const nTema = cont((v) => ["irr", "iac", "irdr", "tema_rg"].includes(v.tipo));

  return (
    <>
      <a className="pular" href="#conteudo">Ir para o conteúdo</a>
      <header className="barra">
        <div className="barra-in">
          <a className="marca-site" href="./" onClick={(ev) => { ev.preventDefault(); setVista("consulta"); setE({ ...ESTADO_INICIAL }); window.scrollTo({ top: 0 }); }} aria-label="Compêndio trabalhista, início">
            <span className="sigla-s" aria-hidden="true">§</span>Compêndio trabalhista
          </a>
          <nav className="acoes" aria-label="Principal">
            {VISTAS.map(([v, t]) => (
              <button key={v} type="button" className={`btn${vista === v ? " ouro" : ""}`} aria-current={vista === v ? "page" : undefined} onClick={() => setVista(v)}>{t}</button>
            ))}
            <button type="button" className="btn" onClick={() => setModo(modo === "escuro" ? "claro" : "escuro")} aria-label={modo === "escuro" ? "Mudar para o modo claro" : "Mudar para o modo escuro"}>
              {modo === "escuro" ? "Claro" : "Escuro"}
            </button>
          </nav>
        </div>
      </header>

      <main id="conteudo" className="miolo">
        {vista === "consulta" && (
          <>
            <div className="man">
              <h1>Compêndio de jurisprudência</h1>
              <p className="intro">
                {dados
                  ? `${dados.length.toLocaleString("pt-BR")} verbetes do TST e do STF em matéria trabalhista: ${nSum} súmulas, ${nOJ} orientações jurisprudenciais, ${nPN} precedentes normativos e ${nTema} temas de recursos repetitivos e de repercussão geral. `
                  : "Súmulas, orientações jurisprudenciais, precedentes normativos e temas do TST e do STF em matéria trabalhista. "}
                Busque pelo número ou pelas palavras da decisão. Antes de citar em peça, confira o teor na fonte oficial.
              </p>
              <p className="aviso"><b>Conteúdo informativo, sem caráter de consultoria ou aconselhamento jurídico.</b> A jurisprudência muda: confira sempre na fonte oficial.</p>
            </div>
            <Compendio dados={dados} erro={erro} e={e} setE={setE} favs={favs} alternaFav={alternaFav} avisa={avisa} />
          </>
        )}

        {vista === "fluxos" && (dados ? <Fluxos itens={porId} abrirVerbete={abrirVerbete} abrirTema={abrirTema} /> : <div className="man"><h1>Fluxogramas</h1></div>)}

        {vista === "sobre" && (
          <div className="man texto">
            <h1>Sobre o compêndio</h1>
            <p className="intro">Uma ferramenta de consulta rápida à jurisprudência trabalhista. Nasceu da minha rotina de advogado e agora está aberta para quem precisar.</p>
            <h2>Como ler a situação</h2>
            <ul className="legenda">
              {Object.entries(STATUS).map(([k, s]) => <li key={k}><span className="sum-selo" data-status={k}>{s.rotulo}</span>{s.dica}</li>)}
            </ul>
            <h2>De onde vêm os dados</h2>
            <p>Os textos são de fontes oficiais públicas (TST e STF). Cada verbete mostra a data da última verificação e o link para a fonte. Em muitos verbetes do TST o link aponta para a listagem oficial, e é preciso localizar o verbete pelo número. A base geral foi verificada em {pacote ? dataBR(pacote.baseVerificadaEm) : "…"}; a ADC 80 e o Tema 1389 foram verificados em 10/11/2026. <b>A base não foi reverificada por inteiro depois dessas datas</b>: confirme na fonte antes de citar.</p>
            <h2>Privacidade</h2>
            <p>Não há cadastro, rastreamento nem coleta de dados. Seus favoritos e o modo claro ou escuro ficam apenas no seu navegador.</p>
            <h2>Aviso</h2>
            <p>Conteúdo informativo, sem caráter de consultoria ou aconselhamento jurídico. Nada aqui promete resultado nem substitui a análise de um advogado.</p>
            <h2>Licenças</h2>
            <p>Código sob licença MIT. Conteúdo organizado e notas editoriais de uso livre (CC0). Os textos oficiais são públicos. A fonte Inter segue a SIL Open Font License.</p>
            <p><a href="https://github.com/ygorsoaresadv-blip/compendio-trabalhista" target="_blank" rel="noopener noreferrer">Código-fonte no GitHub<span className="sr-only"> (abre em nova aba)</span></a> · <a href="./case.html">Como foi feito</a></p>
          </div>
        )}
      </main>

      <footer className="rodape">
        <p>Criado por <a href="https://ygor.blog" target="_blank" rel="noopener noreferrer">Ygor Soares<span className="sr-only"> (abre em nova aba)</span></a>. Conteúdo informativo, sem caráter de consultoria ou aconselhamento jurídico. Sem cookies e sem rastreamento.</p>
        {pacote && <p>Base verificada em {dataBR(pacote.baseVerificadaEm)} · gerada em {dataBR(pacote.geradoEm)}</p>}
      </footer>

      <div className="toast" role="status" aria-live="polite">{aviso && <span>{aviso}</span>}</div>
    </>
  );
}
