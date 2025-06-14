
import {
  BarChart3,
  BookOpen,
  Home,
  Settings,
  Upload,
  LogOut,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Study",
    url: "/study",
    icon: BookOpen,
  },
  {
    title: "Progress",
    url: "/progress",
    icon: BarChart3,
  },
  {
    title: "Upload PDF",
    url: "/upload",
    icon: Upload,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-space-grotesk font-semibold text-lg">RecallForge</h2>
            <p className="text-xs text-muted-foreground">AI-Powered Learning</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-ash text-xs font-medium mb-3">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location.pathname === item.url}
                    className="w-full justify-start rounded-xl p-3 hover:bg-accent transition-colors"
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        <Button 
          variant="ghost" 
          className="w-full justify-start rounded-xl p-3 text-ash hover:text-foreground"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Log out
        </Button>
        <div className="mt-3 text-xs text-ash">
          Version 1.0.0 · <a href="#" className="hover:text-foreground transition-colors">Support</a>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
