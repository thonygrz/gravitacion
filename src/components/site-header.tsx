import Link from "next/link";
import { NavLink } from "./nav-link";
import { bodyColor } from "./orbit-colors";

export function SiteHeader() {
  return (
    <header className="border-b border-line/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md font-display text-lg font-semibold tracking-tight"
        >
          <svg viewBox="0 0 32 32" aria-hidden="true" className="size-7">
            <ellipse cx="16" cy="16" rx="13" ry="6" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.5" transform="rotate(-25 16 16)" />
            <circle cx="16" cy="16" r="3.5" className="fill-accent" />
            <circle cx="27.5" cy="10.6" r="2" fill={bodyColor(1)} />
          </svg>
          Gravitación
        </Link>
        <nav aria-label="Principal">
          <ul className="flex items-center gap-1 text-sm sm:gap-2">
            <li>
              <NavLink href="/aprende">Aprende</NavLink>
            </li>
            <li>
              <NavLink href="/galeria" matchPrefix>
                Galería
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
