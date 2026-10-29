import { GalleryMemoryProvider } from "@/components/gallery/gallery-memory";

export default function GalleryLayout({ children }: LayoutProps<"/galeria">) {
  return <GalleryMemoryProvider>{children}</GalleryMemoryProvider>;
}
