import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BottomNav } from "./BottomNav";

export const AppShell = ({ children, className }: { children: ReactNode, className?: string }) => {
  return (
    <div className={cn("min-h-screen bg-background text-foreground print:hidden", className)}>
      <main className="mx-auto max-w-md px-4 pb-24 pt-6">{children}</main>
      <BottomNav />
    </div>
  );
};
