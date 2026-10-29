"use client";

import Link from "next/link";
import { useId, useLayoutEffect } from "react";
import { formatNumber } from "@/lib/format";
import type { OrbitFigure } from "@/lib/orbits/figure";
import { OrbitDrawing } from "../orbit-drawing";
import { useGalleryMemory, type GalleryOrder } from "./gallery-memory";

export interface GalleryItem {
  readonly slug: string;
  readonly name: string;
  readonly summary: string;
  readonly period: number;
  readonly figure: OrbitFigure;
}

const ORDERS: readonly { readonly value: GalleryOrder; readonly label: string }[] = [
  { value: "statement", label: "Enunciado" },
  { value: "period", label: "Periodo" },
];

const cardId = (slug: string) => `orbita-${slug}`;

/**
 * Puts the window scroll and the focus back where the visitor left them whenever the
 * gallery comes on screen again, whether React Activity kept it hidden or it is
 * rendered afresh: the window scroll is shared with the page that replaced it, and
 * focus is lost when the focused card is hidden.
 */
function useReturnPosition() {
  const { scrollYRef, lastOpenedRef } = useGalleryMemory();

  useLayoutEffect(() => {
    window.scrollTo(0, scrollYRef.current);
    if (lastOpenedRef.current) {
      document.getElementById(cardId(lastOpenedRef.current))?.focus({ preventScroll: true });
    }
    const save = () => {
      scrollYRef.current = window.scrollY;
    };
    window.addEventListener("scroll", save, { passive: true });
    return () => window.removeEventListener("scroll", save);
  }, [scrollYRef, lastOpenedRef]);

  return (slug: string) => {
    lastOpenedRef.current = slug;
  };
}

export function GalleryGrid({ items }: { readonly items: readonly GalleryItem[] }) {
  const { order, setOrder } = useGalleryMemory();
  const rememberOpened = useReturnPosition();
  const groupName = useId();
  const sorted = order === "period" ? [...items].sort((a, b) => a.period - b.period) : items;

  return (
    <div className="mt-8">
      <fieldset className="flex flex-wrap items-center gap-3">
        <legend className="float-left text-sm text-muted">Ordenar por</legend>
        <div className="inline-flex rounded-lg border border-line bg-panel p-1">
          {ORDERS.map(({ value, label }) => (
            <label
              key={value}
              className="relative rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:text-ink has-checked:bg-accent has-checked:font-medium has-checked:text-night has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
            >
              {/* Transparent and covering the label: the click lands on the radio itself. */}
              <input
                type="radio"
                name={groupName}
                value={value}
                checked={order === value}
                onChange={() => setOrder(value)}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((item) => (
          <li key={item.slug}>
            <article className="relative flex h-full flex-col rounded-2xl border border-line bg-panel/80 p-4 transition-colors hover:border-accent/60 has-focus-visible:border-accent has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent">
              {/* Absolutely placed, so the drawing never stretches the 16:10 box to its own shape. */}
              <div className="relative aspect-16/10 rounded-xl bg-night/70">
                <div className="absolute inset-2">
                  <OrbitDrawing figure={item.figure} markStarts className="size-full" />
                </div>
              </div>
              <h2 className="mt-4 font-display text-xl font-semibold">
                <Link
                  id={cardId(item.slug)}
                  href={`/galeria/${item.slug}`}
                  onClick={() => rememberOpened(item.slug)}
                  className="outline-none after:absolute after:inset-0 after:rounded-2xl"
                >
                  {item.name}
                </Link>
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.summary}</p>
              <p className="mt-auto pt-3 text-sm text-muted">
                Periodo: <span className="tabular-nums text-ink">{formatNumber(item.period, 2)}</span>
              </p>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
