"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface NavLinkProps {
  readonly href: "/aprende" | "/galeria";
  /** Also mark the link as current on the pages below `href`. */
  readonly matchPrefix?: boolean;
  readonly children: ReactNode;
}

export function NavLink({ href, matchPrefix = false, children }: NavLinkProps) {
  const pathname = usePathname();
  const current = pathname === href || (matchPrefix && pathname.startsWith(`${href}/`));
  return (
    <Link
      href={href}
      // The gallery restores its own scroll position when it comes back into view.
      scroll={href !== "/galeria"}
      aria-current={current ? "page" : undefined}
      className="rounded-md px-3 py-2 text-muted transition-colors hover:text-ink aria-[current=page]:text-ink aria-[current=page]:underline aria-[current=page]:decoration-accent aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8"
    >
      {children}
    </Link>
  );
}
