import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpDrawer } from "./HelpDrawer";

export function HelpButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Manual de uso"
        className="h-10 w-10 rounded-full bg-card/80 backdrop-blur hover:bg-card"
      >
        <HelpCircle className="h-5 w-5" />
      </Button>
      <HelpDrawer open={open} onOpenChange={setOpen} />
    </>
  );
}
