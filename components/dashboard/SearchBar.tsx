"use client";

import { Search } from "lucide-react";

export function SearchBar() {
  return (
    <div className="relative">
      <Search
        size={15}
        strokeWidth={2}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
      />
      <input
        type="text"
        placeholder="搜索简历..."
        className="h-10 w-full rounded-[10px] border border-white/70 bg-white pl-9 pr-3 text-[13px] text-ink shadow-card outline-none placeholder:text-ink-muted focus:ring-2 focus:ring-brand/30"
      />
    </div>
  );
}
