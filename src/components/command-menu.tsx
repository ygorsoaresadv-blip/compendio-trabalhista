"use client";
/* Base: "Command Menu" de uvain (21st.dev), sobre cmdk + Radix Dialog.
   Adaptações: busca controlada (shouldFilter desligável, para usar o índice MiniSearch),
   textos em português e rodapé com atalhos. */
import * as React from "react";
import { cn } from "@/lib/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";

export function CommandGroup({ className, ...props }: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      className={cn(
        "py-1 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-1.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase",
        className
      )}
      {...props}
    />
  );
}

export function CommandSeparator(props: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>) {
  return <CommandPrimitive.Separator className="-mx-1.5 my-1 h-px bg-border" {...props} />;
}

export interface CommandItemProps extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item> {
  icon?: React.ReactNode;
  shortcut?: string;
  hint?: React.ReactNode;
  trailing?: React.ReactNode;
}

export function CommandItem({ className, icon, shortcut, hint, trailing, children, ...props }: CommandItemProps) {
  return (
    <CommandPrimitive.Item
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-[10px] px-2.5 py-2.5 text-[14px] outline-none select-none",
        "data-[selected=true]:bg-accent data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
        "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
        className
      )}
      {...props}
    >
      {icon}
      <span className="grid min-w-0 flex-1">
        <span className="truncate">{children}</span>
        {hint && <span className="truncate text-[12.5px] text-muted-foreground">{hint}</span>}
      </span>
      {trailing}
      {shortcut && (
        <span className="flex gap-1">
          {shortcut.split(" ").map((k, i) => (
            <kbd key={i} className="grid h-5 min-w-5 place-items-center rounded-[5px] bg-muted px-1 font-sans text-[11px] text-foreground/70">
              {k}
            </kbd>
          ))}
        </span>
      )}
    </CommandPrimitive.Item>
  );
}

export interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeholder?: string;
  emptyText?: string;
  search: string;
  onSearchChange: (v: string) => void;
  children: React.ReactNode;
}

export function CommandMenu({ open, onOpenChange, placeholder, emptyText = "Nada encontrado.", search, onSearchChange, children }: CommandMenuProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-black/40 motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:fade-in-0 motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed top-[10dvh] left-1/2 z-[70] w-[calc(100vw-24px)] max-w-[620px] -translate-x-1/2 overflow-hidden rounded-[18px] bg-popover text-popover-foreground shadow-2xl ring-1 ring-border outline-none motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:fade-in-0 motion-safe:data-[state=open]:zoom-in-95 motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:fade-out-0 motion-safe:data-[state=closed]:zoom-out-95"
        >
          <DialogPrimitive.Title className="sr-only">Busca rápida</DialogPrimitive.Title>
          <CommandPrimitive loop shouldFilter={false} className="flex w-full flex-col overflow-hidden" label="Busca rápida">
            <div className="flex items-center gap-2.5 border-b border-border px-4">
              <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
              <CommandPrimitive.Input
                value={search}
                onValueChange={onSearchChange}
                placeholder={placeholder}
                className="h-14 w-full bg-transparent text-[16px] outline-none placeholder:text-muted-foreground"
              />
            </div>
            <CommandPrimitive.List className="max-h-[min(420px,60dvh)] overflow-y-auto overscroll-contain p-1.5">
              <CommandPrimitive.Empty className="px-3 py-10 text-center text-[14px] text-muted-foreground">{emptyText}</CommandPrimitive.Empty>
              {children}
            </CommandPrimitive.List>
            <div className="flex items-center gap-4 border-t border-border px-4 py-2.5 text-[12px] text-muted-foreground">
              <span><kbd className="font-sans">↑↓</kbd> mover</span>
              <span><kbd className="font-sans">↵</kbd> abrir</span>
              <span><kbd className="font-sans">esc</kbd> fechar</span>
            </div>
          </CommandPrimitive>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
