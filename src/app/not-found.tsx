import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">No encontramos esta página</h1>
      <p className="mt-4 leading-relaxed text-muted">
        La dirección no corresponde a ninguna página ni a ninguna órbita de la galería.
      </p>
      <p className="mt-6 flex flex-wrap gap-3">
        <Link href="/galeria" scroll={false} className="rounded-lg bg-accent px-4 py-2 font-medium text-night">
          Ir a la galería
        </Link>
        <Link href="/" className="rounded-lg border border-line px-4 py-2">
          Ir al inicio
        </Link>
      </p>
    </div>
  );
}
