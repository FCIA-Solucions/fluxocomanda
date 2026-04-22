import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export const AppShell = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-md px-4 pb-24 pt-6">{children}</main>
      <BottomNav />
    </div>
  );
};
