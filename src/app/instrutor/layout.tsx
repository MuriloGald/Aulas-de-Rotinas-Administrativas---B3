"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Flame,
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  Presentation,
  ShoppingCart,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  TrendingUp,
} from "lucide-react";
import { logout } from "@/app/actions/auth";


const navItems = [
  {
    label: "Dashboard",
    href: "/instrutor/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Turmas",
    href: "/instrutor/turmas",
    icon: Users,
  },
  {
    label: "Subtemas",
    href: "/instrutor/subtemas",
    icon: BookOpen,
  },
  {
    label: "Cursos",
    href: "/instrutor/cursos",
    icon: GraduationCap,
  },
  {
    label: "Apresentação",
    href: "/instrutor/apresentacao",
    icon: Presentation,
  },
  {
    label: "Configurações",
    href: "/instrutor/configuracoes",
    icon: Settings,
  },
];

export default function InstrutorLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* ── Mobile Overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed lg:relative z-50 flex flex-col h-dvh
          bg-sidebar-bg border-r border-sidebar-border
          transition-all duration-300 ease-in-out
          ${collapsed ? "lg:w-[72px]" : "lg:w-[260px]"}
          ${mobileOpen ? "translate-x-0 w-[280px]" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo Area */}
        <div
          className={`flex items-center gap-3 px-5 h-16 border-b border-sidebar-border flex-shrink-0 ${collapsed ? "justify-center" : ""}`}
        >
          <div className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center flex-shrink-0 shadow-md shadow-primary/10 overflow-hidden border border-border">
            <img src="/logo-cbmsc-dark.png" alt="CBMSC" className="w-8 h-8 object-contain" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in overflow-hidden">
              <h2 className="text-sm font-bold text-foreground whitespace-nowrap">
                CBMSC
              </h2>
              <p className="text-[11px] text-muted-foreground whitespace-nowrap">
                Hub do Instrutor B3
              </p>
            </div>
          )}
          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto lg:hidden text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : undefined}
                className={`
                  group flex items-center gap-3 rounded-lg transition-all duration-200
                  ${collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"}
                  ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-sidebar-foreground hover:bg-surface hover:text-foreground"
                  }
                `}
              >
                <item.icon
                  className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
                />
                {!collapsed && (
                  <span className="text-sm whitespace-nowrap">{item.label}</span>
                )}
                {isActive && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3 flex-shrink-0 space-y-2">
          {/* Collapse Toggle (Desktop only) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-full h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition-all duration-200"
            title={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <div className="flex items-center gap-2 text-xs">
                <ChevronLeft className="w-4 h-4" />
                <span>Recolher</span>
              </div>
            )}
          </button>

          {/* Logout */}
          <form action={logout}>
            <button
              type="submit"
              title={collapsed ? "Sair" : undefined}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 ${collapsed ? "justify-center px-2" : ""}`}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm">Sair</span>}
            </button>
          </form>
        </div>

      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center h-16 px-4 lg:px-6 border-b border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden mr-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground font-medium">
              {navItems.find(
                (item) =>
                  pathname === item.href ||
                  pathname?.startsWith(item.href + "/")
              )?.label || "CBMSC B3"}
            </span>
          </div>

          {/* Right side - placeholder for user avatar / notifications */}
          <div className="ml-auto flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shadow-sm">
              I
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
