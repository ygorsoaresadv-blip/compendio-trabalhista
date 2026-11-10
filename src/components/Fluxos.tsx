import { useState } from "react";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { FLUXOS, Fluxo } from "@/lib/fluxos";
import { Item, rotulo } from "@/lib/labels";
import { Selo } from "./Cartao";

interface Props {
  itens: Map<string, Item>;
  abrirVerbete: (id: string) => void;
  abrirTema: (tema: string) => void;
}

function Percurso({ fluxo, itens, abrirVerbete, abrirTema, voltar }: Props & { fluxo: Fluxo; voltar: () => void }) {
  const [trilha, setTrilha] = useState<{ no: string; escolha?: string }[]>([{ no: fluxo.inicio }]);
  const [resultado, setResultado] = useState<{ ids: string[]; nota?: string } | null>(null);
  const atual = trilha[trilha.length - 1];
  const no = fluxo.nos[atual.no];

  const escolhe = (o: (typeof no.opcoes)[number]) => {
    if (o.nota?.startsWith("__tema:")) return abrirTema(o.nota.slice(7));
    if (o.proximo) { setTrilha([...trilha.slice(0, -1), { ...atual, escolha: o.rotulo }, { no: o.proximo }]); setResultado(null); }
    else setResultado({ ids: o.verbetes ?? [], nota: o.nota });
  };
  const reinicia = () => { setTrilha([{ no: fluxo.inicio }]); setResultado(null); };

  return (
    <div>
      <button className="btn mb-5" onClick={voltar}><ArrowLeft className="size-4" aria-hidden /> Todos os fluxogramas</button>
      <h1 className="text-[26px] font-semibold tracking-tight text-verde-noite">{fluxo.titulo}</h1>

      {trilha.length > 1 && (
        <ol className="mt-4 flex flex-wrap items-center gap-2 text-[14px] text-muted-foreground" aria-label="Caminho percorrido">
          {trilha.slice(0, -1).map((t, i) => (
            <li key={i} className="flex items-center gap-2"><span>{fluxo.nos[t.no].pergunta.replace(/[:?]$/, "")} → <strong className="text-foreground">{t.escolha}</strong></span></li>
          ))}
        </ol>
      )}

      <div className="card mt-5 p-5 sm:p-6" role="group" aria-labelledby="pergunta">
        <p id="pergunta" className="text-[19px] font-semibold">{no.pergunta}</p>
        {no.ajuda && <p className="mt-1.5 text-[15px] text-muted-foreground">{no.ajuda}</p>}
        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
          {no.opcoes.map((o) => (
            <button key={o.rotulo} className="btn justify-between sm:justify-start" onClick={() => escolhe(o)}>
              {o.rotulo} <ArrowRight className="size-4" aria-hidden />
            </button>
          ))}
        </div>
      </div>

      {resultado && (
        <div className="mt-5 space-y-3" aria-live="polite">
          {resultado.nota && <p className="text-[15px] text-muted-foreground">{resultado.nota}</p>}
          {resultado.ids.map((id) => {
            const r = itens.get(id);
            return r ? (
              <button key={id} onClick={() => abrirVerbete(id)} className="card block w-full cursor-pointer p-4 text-left hover:border-primary">
                <span className="flex flex-wrap items-center gap-2"><strong className="text-[17px] text-verde-noite">{rotulo(r)}</strong><Selo status={r.status} /></span>
                <span className="mt-1.5 line-clamp-3 block text-[15px]">{r.tese}</span>
                <span className="mt-2 block text-[13.5px] font-medium text-primary">Abrir verbete completo →</span>
              </button>
            ) : null;
          })}
        </div>
      )}

      <button className="btn mt-6" onClick={reinicia}><RotateCcw className="size-4" aria-hidden /> Recomeçar</button>
    </div>
  );
}

export function Fluxos(props: Props) {
  const [aberto, setAberto] = useState<string | null>(null);
  const fluxo = FLUXOS.find((f) => f.id === aberto);
  if (fluxo) return <Percurso key={fluxo.id} {...props} fluxo={fluxo} voltar={() => setAberto(null)} />;
  return (
    <div>
      <h1 className="text-[26px] font-semibold tracking-tight text-verde-noite">Fluxogramas</h1>
      <p className="mt-2 max-w-[62ch] text-[16px] text-muted-foreground">
        Caminhos curtos para chegar ao verbete certo. São guias de navegação: o texto e o status exibidos ao final vêm do próprio verbete, e a conferência na fonte oficial continua necessária.
      </p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {FLUXOS.map((f) => (
          <li key={f.id}>
            <button onClick={() => setAberto(f.id)} className="card block h-full w-full cursor-pointer p-5 text-left transition-colors hover:border-primary">
              <span className="block text-[19px] font-semibold text-verde-noite">{f.titulo}</span>
              <span className="mt-1 block text-[15px] text-muted-foreground">{f.resumo}</span>
              <span className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-medium text-primary">Começar <ArrowRight className="size-4" aria-hidden /></span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
