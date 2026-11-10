import type { Dados } from "./labels";

let promessa: Promise<Dados> | null = null;
/** Começa a baixar os verbetes o quanto antes (main.tsx chama antes de montar o React). */
export function carrega(): Promise<Dados> {
  if (!promessa) promessa = import("../data/compendio.json").then((m) => m.default as unknown as Dados);
  return promessa;
}
