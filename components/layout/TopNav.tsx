import Link from "next/link";
import { FileText, LayoutGrid, Settings, LogOut } from "lucide-react";
import clsx from "clsx";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutGrid;
  active?: boolean;
}

const navItems: NavItem[] = [
  { label: "简历库", href: "/dashboard", icon: LayoutGrid, active: true },
  { label: "设置", href: "/settings", icon: Settings },
];

export function TopNav() {
  return (
    <header className="sticky top-0 z-50 h-[52px] border-b border-white/50 bg-fog/85 backdrop-blur-md">
      <div className="relative mx-auto flex h-full max-w-content items-center px-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-brand text-white shadow-sm">
            <FileText size={14} strokeWidth={2.5} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            ResumeKit
          </span>
        </Link>

        {/* Center nav */}
        <nav className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={clsx(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] transition-colors",
                  item.active
                    ? "bg-white text-ink shadow-sm"
                    : "text-ink-soft hover:text-ink"
                )}
              >
                <Icon size={14} strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right action */}
        <div className="ml-auto">
          <button
            type="button"
            className="flex items-center gap-1.5 text-[13px] text-ink-soft transition-colors hover:text-ink"
          >
            <LogOut size={14} strokeWidth={2} />
            退出
          </button>
        </div>
      </div>
    </header>
  );
}
