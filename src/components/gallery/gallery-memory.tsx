"use client";

import { createContext, use, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";

export type GalleryOrder = "statement" | "period";

interface GalleryMemory {
  readonly order: GalleryOrder;
  readonly setOrder: (order: GalleryOrder) => void;
  /** Window scroll of the gallery when it was last on screen. */
  readonly scrollYRef: RefObject<number>;
  /** Slug of the last orbit opened from the gallery, to give its card the focus back. */
  readonly lastOpenedRef: RefObject<string | null>;
}

const GalleryMemoryContext = createContext<GalleryMemory | null>(null);

/**
 * Holds the gallery's interface state in the /galeria layout, which stays mounted while
 * the visitor moves between orbits. Next.js keeps hidden pages alive (React Activity)
 * for three routes only, counting the visible one: from the third orbit in a row the
 * gallery page is dropped and rendered afresh (measured on 28/10/2026), and it picks
 * its state up from here.
 */
export function GalleryMemoryProvider({ children }: { readonly children: ReactNode }) {
  const [order, setOrder] = useState<GalleryOrder>("statement");
  const scrollYRef = useRef(0);
  const lastOpenedRef = useRef<string | null>(null);
  const memory = useMemo(() => ({ order, setOrder, scrollYRef, lastOpenedRef }), [order]);
  return <GalleryMemoryContext value={memory}>{children}</GalleryMemoryContext>;
}

export function useGalleryMemory(): GalleryMemory {
  const memory = use(GalleryMemoryContext);
  if (!memory) throw new Error("useGalleryMemory needs a GalleryMemoryProvider above it");
  return memory;
}
