import { useState } from "react";
import { AlertTriangle, Bookmark, BookmarkCheck, ChevronDown, ExternalLink, Link2, Quote } from "lucide-react";
import { Item, STATUS, TIPOS, citacaoABNT, citacaoForense, dataBR, nomeTribunal, rotulo } from "@/lib/labels";

export function Selo({ status }: { status: string }) {
  const s = STATUS[status];
  return (
    <span className={`badge st-${status}`} title={s?.dica}>
      <span aria-hidden="true">{s?.simbolo}</span>
      {s?.rotulo ?? status}
    </span>
  );
}

function LinhaDoTempo({ itens }: { itens: NonNullable<Item["historico"]> }) {
  const ordenado = [...itens].sort((a, b) => (b.data ?? "").localeCompare(a.data ?? ""));
  return (
    <ol className="tl" aria-label="Linha do tempo do verbete">
      {ordenado.map((h, i) => (
        <li key={i}>
          <p className="text-[14px] font-semibold">
            {h.evento ?? "Evento"}
            {h.data && <time dateTime={h.data} className="ml-2 font-normal text-muted-foreground">{dataBR(h.data)}</time>}
          </p>
          {h.ato && <p className="text-[13.5px] text-muted-foreground">{h.ato}</p>}
          {h.obs && <p className="text-[13.5px] text-muted-foreground">{h.obs}</p>}
        </li>
      ))}
    </ol>
  );
}

interface Props {
  r: Item;
  aberto: boolean;
  onToggle: () => void;
  fav: boolean;
  onFav: () => void;
  avisa: (msg: string) => void;
}

export function Cartao({ r, aberto, onToggle, fav, onFav, avisa }: Props) {
  const [menu, setMenu] = useState(false);
  const idCorpo = `corpo-${r.id}`;

  const copia = async (texto: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      avisa(msg);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = texto;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); avisa(msg); } catch { avisa("Não foi possível copiar. Selecione o texto manualmente."); }
      ta.remove();
    }
    setMenu(false);
  };

  const link = () => {
    const u = new URL(location.href);
    u.search = "";
    u.searchParams.set("v", r.id);
    return u.toString();
  };

  return (
    <article id={`v-${r.id}`} className="card overflow-hidden" aria-labelledby={`t-${r.id}`}>
      <div className="flex items-start gap-3 p-4 sm:p-5">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={aberto}
          aria-controls={idCorpo}
          className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-lg text-left"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id={`t-${r.id}`} className="text-[18px] font-semibold tracking-tight text-verde-noite">{rotulo(r)}</h2>
              <Selo status={r.status} />
              {r.novo && <span className="badge" style={{ background: "var(--accent)", color: "var(--primary)" }}>Novo</span>}
              {r.suspensao && <span className="badge st-afetado" title="Há determinação de suspensão de processos no TST.">Suspensão de processos</span>}
            </div>
            {r.rubrica && <p className="mt-1.5 text-[14px] font-medium uppercase tracking-wide text-muted-foreground">{r.rubrica}</p>}
            {!aberto && <p className="mt-1.5 line-clamp-2 text-[15px] text-foreground/90">{r.tese}</p>}
          </div>
          <ChevronDown aria-hidden className={`mt-1.5 size-5 shrink-0 text-muted-foreground transition-transform ${aberto ? "rotate-180" : ""}`} />
        </button>
        <button
          type="button"
          onClick={onFav}
          aria-pressed={fav}
          aria-label={fav ? `Remover ${rotulo(r)} dos favoritos` : `Favoritar ${rotulo(r)}`}
          className="btn btn--icone shrink-0"
        >
          {fav ? <BookmarkCheck className="size-5 text-ouro-texto" aria-hidden /> : <Bookmark className="size-5" aria-hidden />}
        </button>
      </div>

      {aberto && (
        <div id={idCorpo} className="border-t border-border px-4 pb-5 pt-4 sm:px-5">
          {r.alerta && (
            <div role="note" className="mb-4 flex gap-3 rounded-xl border p-3.5 text-[14.5px]" style={{ background: "var(--alerta-bg)", borderColor: "var(--alerta-borda)" }}>
              <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
              <p>
                <strong>Nota editorial.</strong> {r.alerta.texto}
                {r.alerta.fonte_url && <> <a href={r.alerta.fonte_url} target="_blank" rel="noopener noreferrer">Fonte oficial<span className="sr-only"> (abre em nova aba)</span></a></>}
              </p>
            </div>
          )}

          {r.teseTipo === "resumo" && <h3 className="mb-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Resumo da notícia oficial (a tese literal ainda não foi localizada)</h3>}
          <p className="tese text-[16.5px] leading-relaxed" lang="pt-BR">{r.tese}</p>

          {r.statusDetalhe && <p className="mt-3 text-[14.5px] text-muted-foreground">{r.statusDetalhe}</p>}
          {r.modulacao && <p className="mt-3 text-[14.5px]"><strong>Modulação de efeitos:</strong> {r.modulacao}</p>}

          <dl className="mt-4 grid gap-x-8 gap-y-3 text-[14.5px] sm:grid-cols-2">
            <div><dt className="text-muted-foreground">Tribunal</dt><dd>{nomeTribunal(r.tribunal)}{r.orgao ? ` · ${r.orgao}` : ""}</dd></div>
            <div><dt className="text-muted-foreground">Espécie</dt><dd>{TIPOS[r.tipo]?.longo ?? r.tipo}</dd></div>
            {r.relator && <div><dt className="text-muted-foreground">Relator</dt><dd>{r.relator}</dd></div>}
            {r.redator && <div><dt className="text-muted-foreground">Redator do acórdão</dt><dd>{r.redator}</dd></div>}
            {r.dataJulgamento && <div><dt className="text-muted-foreground">Data do julgamento</dt><dd>{dataBR(r.dataJulgamento)}</dd></div>}
            {r.processo && <div><dt className="text-muted-foreground">Processo</dt><dd>{r.processo}</dd></div>}
            <div className="sm:col-span-2"><dt className="text-muted-foreground">Temas</dt><dd>{r.temas.join(" · ")}</dd></div>
          </dl>

          {r.questao && (
            <section className="mt-5"><h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Questão jurídica</h3><p className="mt-1 text-[15px]">{r.questao}</p></section>
          )}
          {r.referencia && (
            <section className="mt-5"><h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Referência legislativa e precedentes</h3><p className="mt-1 text-[14.5px]">{r.referencia}</p></section>
          )}
          {r.observacao && (
            <section className="mt-5"><h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Observação oficial</h3><p className="mt-1 text-[14.5px]">{r.observacao}</p></section>
          )}
          {r.pendencias && (
            <section className="mt-5">
              <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Pendências de verificação</h3>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-[14.5px]">{r.pendencias.map((p, i) => <li key={i}>{p}</li>)}</ul>
            </section>
          )}
          {r.historico && r.historico.length > 0 && (
            <section className="mt-6"><h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Linha do tempo</h3><LinhaDoTempo itens={r.historico} /></section>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13.5px] text-muted-foreground">
            {r.verificado && <span>Última verificação: <time dateTime={r.verificado}>{dataBR(r.verificado)}</time></span>}
            {r.urlGenerica && <span>Link oficial aponta para a listagem do tribunal; localize o verbete pelo número.</span>}
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <div className="relative">
              <button type="button" className="btn btn--primario" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
                <Quote className="size-4" aria-hidden /> Copiar citação
              </button>
              {menu && (
                <div role="menu" className="absolute left-0 z-20 mt-2 w-64 rounded-xl border border-border bg-popover p-1.5 shadow-xl" onKeyDown={(e) => e.key === "Escape" && setMenu(false)}>
                  <button role="menuitem" autoFocus className="w-full cursor-pointer rounded-lg px-3 py-2.5 text-left text-[14.5px] hover:bg-accent" onClick={() => copia(citacaoForense(r), "Citação forense copiada.")}>
                    Forense (para peça)
                  </button>
                  <button role="menuitem" className="w-full cursor-pointer rounded-lg px-3 py-2.5 text-left text-[14.5px] hover:bg-accent" onClick={() => copia(citacaoABNT(r), "Citação ABNT copiada.")}>
                    ABNT (NBR 6023)
                  </button>
                </div>
              )}
            </div>
            <button type="button" className="btn" onClick={() => copia(link(), "Link do verbete copiado.")}><Link2 className="size-4" aria-hidden /> Copiar link</button>
            {r.url && (
              <a className="btn no-underline hover:no-underline" href={r.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" aria-hidden /> Fonte oficial<span className="sr-only"> (abre em nova aba)</span>
              </a>
            )}
            {r.urlProcesso && (
              <a className="btn no-underline hover:no-underline" href={r.urlProcesso} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" aria-hidden /> Andamento no STF<span className="sr-only"> (abre em nova aba)</span>
              </a>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
