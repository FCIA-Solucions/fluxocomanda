import { useMemo, useState } from "react";
import { Search, MessageCircle, Download } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProfile } from "@/hooks/useProfile";
import { helpContent, HelpRole } from "./helpContent";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpDrawer({ open, onOpenChange }: Props) {
  const { role } = useProfile();
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const safeRole = (role as HelpRole) ?? "admin";
    const byRole = helpContent.filter((it) => it.roles.includes(safeRole));
    if (!query.trim()) return byRole;
    const q = query.trim().toLowerCase();
    return byRole.filter((it) => it.title.toLowerCase().includes(q));
  }, [role, query]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border px-4 py-3 text-left">
          <SheetTitle>Manual de uso</SheetTitle>
          <SheetDescription>FluxoComanda · Guia rápido por funcionalidade</SheetDescription>

          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar tópico..."
              className="pl-9"
            />
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4">
          {items.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nenhum tópico encontrado.
            </p>
          ) : (
            <Accordion
              type="single"
              collapsible
              defaultValue={items[0]?.id}
              className="py-2"
            >
              {items.map(({ id, title, icon: Icon, content }) => (
                <AccordionItem key={id} value={id}>
                  <AccordionTrigger className="text-left">
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      {title}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm">{content}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </ScrollArea>

        <div className="space-y-2 border-t border-border bg-card/50 p-4">
          <Button asChild variant="outline" className="w-full">
            <a
              href="/FluxoComanda-Manual.pdf"
              download="FluxoComanda-Manual.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar manual em PDF
            </a>
          </Button>

          <p className="pt-1 text-xs text-muted-foreground">
            Não encontrou o que procurava?
          </p>
          <Button
            asChild
            className="w-full bg-[#22c55e] text-white hover:bg-[#16a34a]"
          >
            <a
              href="https://wa.me/5594999553574?text=Ol%C3%A1!%20Preciso%20de%20ajuda%20com%20o%20FluxoComanda."
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Falar no WhatsApp
            </a>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
