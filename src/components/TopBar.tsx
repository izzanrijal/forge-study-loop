
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Settings } from "lucide-react";

interface TopBarProps {
  title: string;
  streak?: number;
}

export function TopBar({ title, streak = 0 }: TopBarProps) {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="lg:hidden" />
          <h1 className="text-xl font-space-grotesk font-semibold">{title}</h1>
        </div>
        
        <div className="flex items-center gap-3">
          {streak > 0 && (
            <Badge variant="secondary" className="bg-primary/10 text-primary rounded-xl px-3 py-1">
              🔥 {streak} day streak
            </Badge>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="rounded-xl"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
