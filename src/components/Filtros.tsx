import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Filtros as F, FILTROS_VAZIOS } from "@/lib/busca";
import { STATUS, TIPOS } from "@/lib/labels";

type Cont = { tribunal: Map<string, number>; tipo: Map<string, number>; status: Map<string, number>; tema: Map<string, number> };

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

export function Painel({ f, set, cont, anos }: { f: F; set: (f: F) => void; cont: Cont; anos: number[] }) {
  const [aberto, setAberto] = useState(false);
  const [todosTemas, setTodosTemas] = useState(false);

  const alterna = (campo: "tribunal" | "tipo" | "status" | "tema", v: string) =>
    set({ ...f, [campo]: f[campo].includes(v) ? f[campo].filter((x) => x !== v) : [...f[campo], v] });

  const ativos = f.tribunal.length + f.tipo.length + f.status.length + f.tema.length + (f.de != null ? 1 : 0) + (f.ate != null ? 1 : 0) + (f.soVigor ? 1 : 0);
  const chip = (campo: "tribunal" | "tipo" | "status" | "tema", v: string, rotulo: string, n?: number) => (
    <button key={v} type="button" className="chip" aria-pressed={f[campo].includes(v)} onClick={() => alterna(campo, v)}>
      {rotulo}
      {n != null && <span className="n">{n}</span>}
    </button>
  );

  const temas = [...cont.tema.entries()].sort((a, b) => b[1] - a[1]);
  const temasVisiveis = todosTemas ? temas : temas.slice(0, 6);
  const tiposOrdenados = Object.keys(TIPOS).filter((t) => cont.tipo.has(t));
  const statusOrdenados = Object.keys(STATUS).filter((s) => cont.status.has(s));

  return (
    <section aria-label="Filtros">
      <div className="flex items-center justify-between gap-3">
        <button type="button" className="btn md:hidden" aria-expanded={aberto} aria-controls="filtros-corpo" onClick={() => setAberto((a) => !a)}>
          <SlidersHorizontal className="size-4" aria-hidden /> Filtros{ativos > 0 && ` (${ativos})`}
        </button>
        <label className="chip hidden md:inline-flex" style={{ cursor: "pointer" }}>
          <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={f.soVigor} onChange={(e) => set({ ...f, soVigor: e.target.checked })} />
          Só em vigor
        </label>
        {ativos > 0 && (
          <button type="button" className="btn" onClick={() => set({ ...FILTROS_VAZIOS, q: f.q, soFav: f.soFav })}>
            <X className="size-4" aria-hidden /> Limpar filtros
          </button>
        )}
      </div>

      <div id="filtros-corpo" className={`${aberto ? "mt-4 grid" : "hidden"} gap-5 md:mt-4 md:grid md:grid-cols-2`}>
        <label className="chip md:hidden" style={{ cursor: "pointer", width: "fit-content" }}>
          <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={f.soVigor} onChange={(e) => set({ ...f, soVigor: e.target.checked })} />
          Só em vigor
        </label>
        <Grupo titulo="Tribunal">{["TST", "STF"].map((t) => chip("tribunal", t, t, cont.tribunal.get(t)))}</Grupo>
        <Grupo titulo="Situação">{statusOrdenados.map((s) => chip("status", s, STATUS[s].rotulo, cont.status.get(s)))}</Grupo>
        <Grupo titulo="Espécie">{tiposOrdenados.map((t) => chip("tipo", t, TIPOS[t].curto, cont.tipo.get(t)))}</Grupo>
        <fieldset>
          <legend className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Ano de edição</legend>
          <div className="flex items-center gap-2 text-[14px]">
            <label className="sr-only" htmlFor="ano-de">De</label>
            <select id="ano-de" className="chip" value={f.de ?? ""} onChange={(e) => set({ ...f, de: e.target.value ? Number(e.target.value) : null })}>
              <option value="">De…</option>
              {anos.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <span aria-hidden>–</span>
            <label className="sr-only" htmlFor="ano-ate">Até</label>
            <select id="ano-ate" className="chip" value={f.ate ?? ""} onChange={(e) => set({ ...f, ate: e.target.value ? Number(e.target.value) : null })}>
              <option value="">Até…</option>
              {anos.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </fieldset>
        <div className="md:col-span-2">
          <Grupo titulo="Tema (etiqueta de navegação, não é classificação oficial)">
            {temasVisiveis.map(([t, n]) => chip("tema", t, t, n))}
            <button type="button" className="chip" onClick={() => setTodosTemas((x) => !x)} aria-expanded={todosTemas}>
              {todosTemas ? "Menos temas" : `+${temas.length - 6} temas`}
            </button>
          </Grupo>
        </div>
      </div>
    </section>
  );
}
