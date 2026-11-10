import { useMemo } from "react";
import { BookOpen, Bookmark, Info, Moon, Sun, Workflow } from "lucide-react";
import { CommandGroup, CommandItem, CommandMenu } from "./command-menu";
import { Item, STATUS, rotulo } from "@/lib/labels";
import { pesquisa } from "@/lib/busca";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  q: string;
  setQ: (q: string) => void;
  porId: Map<string, Item>;
  tema: "light" | "dark";
  abrirVerbete: (id: string) => void;
  irFluxos: () => void;
  irFavoritos: () => void;
  irVigor: () => void;
  irSobre: () => void;
  alternaTema: () => void;
}

export default function Paleta(p: Props) {
  const sugestoes = useMemo(() => {
    if (!p.q.trim()) return [];
    return pesquisa(p.q, 8).ids.slice(0, 8).map((id) => p.porId.get(id)!).filter(Boolean);
  }, [p.q, p.porId]);

  return (
    <CommandMenu open={p.open} onOpenChange={p.onOpenChange} search={p.q} onSearchChange={p.setQ} placeholder="Número, tema ou palavra… (ex.: 331, OJ 191)" emptyText="Nada encontrado. Tente só o número do verbete.">
      {sugestoes.length > 0 && (
        <CommandGroup heading="Verbetes">
          {sugestoes.map((r) => (
            <CommandItem key={r.id} value={r.id} hint={r.rubrica} onSelect={() => p.abrirVerbete(r.id)} trailing={<span className={`badge st-${r.status}`}>{STATUS[r.status]?.rotulo}</span>}>
              {rotulo(r)}
            </CommandItem>
          ))}
        </CommandGroup>
      )}
      <CommandGroup heading="Ações">
        <CommandItem value="acao-fluxos" onSelect={p.irFluxos} icon={<Workflow />}>Ver fluxogramas</CommandItem>
        <CommandItem value="acao-fav" onSelect={p.irFavoritos} icon={<Bookmark />}>Ver meus favoritos</CommandItem>
        <CommandItem value="acao-vigor" onSelect={p.irVigor} icon={<BookOpen />}>Mostrar só verbetes em vigor</CommandItem>
        <CommandItem value="acao-tema" onSelect={p.alternaTema} icon={p.tema === "dark" ? <Sun /> : <Moon />}>Alternar modo claro/escuro</CommandItem>
        <CommandItem value="acao-sobre" onSelect={p.irSobre} icon={<Info />}>Sobre e avisos</CommandItem>
      </CommandGroup>
    </CommandMenu>
  );
}
