import { Bell, Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";

export function TopBar() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border/50 bg-background/70 px-4 md:px-6 backdrop-blur-xl">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search components, aircraft, inspections…" className="pl-9 bg-card/40 border-border/60" />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 hover:bg-accent transition">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
        </button>
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/40 px-3 py-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
            <User className="h-3.5 w-3.5" />
          </div>
          <div className="hidden sm:block text-xs leading-tight">
            <p className="font-medium">Eng. Hayes</p>
            <p className="text-muted-foreground">Lvl 3 Inspector</p>
          </div>
        </div>
      </div>
    </header>
  );
}
