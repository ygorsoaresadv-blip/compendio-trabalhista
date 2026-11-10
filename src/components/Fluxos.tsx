import { useState } from "react";
import { FLUXOS, Fluxo } from "@/lib/fluxos";
import { STATUS, ico, nome, Item } from "@/lib/labels";

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
    <div className="man">
      <p><button type="button" className="btn" onClick={voltar}>← Todos os fluxogramas</button></p>
      <h1 style={{ marginTop: 18 }}>{fluxo.titulo}</h1>
      <p className="intro">{fluxo.resumo}</p>

      {trilha.length > 1 && (
        <ol className="fl-trilha" aria-label="Caminho percorrido">
          {trilha.slice(0, -1).map((t, i) => <li key={i}>{fluxo.nos[t.no].pergunta.replace(/[:?]$/, "")} → <b>{t.escolha}</b></li>)}
        </ol>
      )}

      <div className="fl-passo" role="group" aria-labelledby="pergunta">
        <h2 id="pergunta">{no.pergunta}</h2>
        {no.ajuda && <p>{no.ajuda}</p>}
        <div className="fl-opcoes">
          {no.opcoes.map((o) => <button key={o.rotulo} type="button" className="btn" onClick={() => escolhe(o)}>{o.rotulo}</button>)}
        </div>
      </div>

      {resultado && (
        <div aria-live="polite">
          {resultado.nota && <p className="sum-fonte">{resultado.nota}</p>}
          <ul className="fl-res">
            {resultado.ids.map((id) => {
              const r = itens.get(id);
              if (!r) return null;
              const [i, sigla] = ico(r);
              return (
                <li key={id}>
                  <button type="button" onClick={() => abrirVerbete(id)}>
                    <span className="sum-ico" data-e={i} aria-hidden="true">{sigla}</span>
                    <span className="sum-linha">
                      <b>{nome(r)} <small>{r.tribunal}</small></b>
                      <span className="res">{r.rubrica || r.tese}</span>
                    </span>
                    <span className="sum-selo" data-status={r.status}>{STATUS[r.status]?.rotulo ?? r.status}</span>
                    <i className="sum-seta" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <p style={{ marginTop: 22 }}><button type="button" className="btn" onClick={reinicia}>Recomeçar</button></p>
    </div>
  );
}

export function Fluxos(props: Props) {
  const [aberto, setAberto] = useState<string | null>(null);
  const fluxo = FLUXOS.find((f) => f.id === aberto);
  if (fluxo) return <Percurso key={fluxo.id} {...props} fluxo={fluxo} voltar={() => setAberto(null)} />;
  return (
    <div className="man">
      <h1>Fluxogramas</h1>
      <p className="intro">Caminhos curtos para chegar ao verbete certo. São guias de navegação: o texto e o status exibidos ao final vêm do próprio verbete, e a conferência na fonte oficial continua necessária.</p>
      <ul className="fl-grade">
        {FLUXOS.map((f) => (
          <li key={f.id}>
            <button type="button" className="fl-cartao" onClick={() => setAberto(f.id)}>
              <b>{f.titulo}</b><span>{f.resumo}</span><em>Começar →</em>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
