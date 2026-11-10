// Fluxogramas de navegação. As perguntas ajudam a achar o verbete; a resposta
// sempre mostra o texto oficial e o status do verbete, nunca uma conclusão minha.
// Todos os ids abaixo existem no acervo (conferido no build).

export interface Opcao { rotulo: string; proximo?: string; verbetes?: string[]; nota?: string }
export interface No { pergunta: string; ajuda?: string; opcoes: Opcao[] }
export interface Fluxo { id: string; titulo: string; resumo: string; inicio: string; nos: Record<string, No> }

export const FLUXOS: Fluxo[] = [
  {
    id: "prescricao",
    titulo: "Prescrição trabalhista",
    resumo: "Qual verbete olhar para prazo prescricional, FGTS e interrupção.",
    inicio: "tipo",
    nos: {
      tipo: {
        pergunta: "Sobre o que é a dúvida?",
        opcoes: [
          { rotulo: "Prazo geral (bienal e quinquenal)", verbetes: ["tst-308"], nota: "Súmula 308 trata da prescrição quinquenal e do biênio após a cessação do contrato." },
          { rotulo: "FGTS", verbetes: ["tst-362"] },
          { rotulo: "Interrupção por ação arquivada", proximo: "interrupcao" },
        ],
      },
      interrupcao: {
        pergunta: "Veja o que o acervo tem sobre ação arquivada:",
        ajuda: "A Súmula 268 aparece como cancelada: confira o status antes de citar.",
        opcoes: [{ rotulo: "Ver o verbete", verbetes: ["tst-268"] }],
      },
    },
  },
  {
    id: "terceirizacao",
    titulo: "Terceirização",
    resumo: "Da Súmula 331 ao Tema 725 do STF.",
    inicio: "inicio",
    nos: {
      inicio: {
        pergunta: "O que você quer localizar?",
        opcoes: [
          { rotulo: "Contratação por empresa interposta e responsabilidade", verbetes: ["tst-331"], nota: "O verbete traz um alerta editorial sobre o Tema 725 do STF." },
          { rotulo: "Busca por tema no acervo", proximo: "tema" },
        ],
      },
      tema: {
        pergunta: "Use o filtro de tema.",
        ajuda: "O tema “Terceirização e responsabilidade” reúne os verbetes relacionados.",
        opcoes: [{ rotulo: "Abrir tema na consulta", nota: "__tema:Terceirização e responsabilidade" }],
      },
    },
  },
  {
    id: "gratuidade",
    titulo: "Justiça gratuita",
    resumo: "Súmula 463, IRR 21 e a ADC 80 (STF, 2026).",
    inicio: "inicio",
    nos: {
      inicio: {
        pergunta: "Qual fonte você quer ver?",
        ajuda: "A ADC 80 foi julgada em 03/09/2026 e o acórdão ainda não foi localizado na fonte oficial. Os verbetes do TST abaixo estão sinalizados como em tensão com ela.",
        opcoes: [
          { rotulo: "STF: ADC 80", verbetes: ["stf-adc-80"] },
          { rotulo: "TST: Súmula 463", verbetes: ["tst-463"] },
          { rotulo: "TST: IRR 21 (Tema 21)", verbetes: ["irr-21"] },
          { rotulo: "Honorários e custas (tema)", nota: "__tema:Honorários, custas e justiça gratuita" },
        ],
      },
    },
  },
  {
    id: "vinculo",
    titulo: "Vínculo e pejotização",
    resumo: "IRR 30 e o Tema 1389 do STF (mérito pendente).",
    inicio: "inicio",
    nos: {
      inicio: {
        pergunta: "Qual fonte você quer ver?",
        ajuda: "O Tema 1389 teve a repercussão geral reconhecida, mas o mérito não foi julgado e não há tese fixada.",
        opcoes: [
          { rotulo: "STF: Tema 1389", verbetes: ["stf-rg-1389"] },
          { rotulo: "TST: IRR 30", verbetes: ["irr-30"] },
          { rotulo: "Grupo econômico", verbetes: ["tst-129"] },
        ],
      },
    },
  },
];
