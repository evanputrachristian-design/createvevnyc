import type { Package, Service } from "@/data/services";
import design from "@/assets/design.jpg";
import video from "@/assets/video.jpg";
import docs from "@/assets/docs.jpg";
import hero from "@/assets/hero.jpg";

/** Baris jasa dari database (DTO polos, aman dikirim lewat server function). */
export type ServiceRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  short: string;
  description: string;
  price: number;
  duration: string;
  image_key: string | null;
  photo_path: string | null;
  available: boolean;
  featured: boolean;
  extras: Record<string, unknown>;
  sort_order: number;
};

export type ServiceExtras = {
  benefits?: string[];
  deliverables?: string[];
  packages?: Package[];
  revisions?: string;
  requirements?: string[];
  gallery?: string[];
};

const imageByKey: Record<string, string> = { design, video, docs, hero };

/** Foto unggahan disajikan lewat rute server publik; selain itu pakai aset bawaan sesuai kunci. */
export const imageFor = (imageKey: string | null, photoPath: string | null): string =>
  photoPath ? `/api/public/foto/${photoPath}` : (imageByKey[imageKey ?? ""] ?? hero);

const keyImage = (key: string) => imageByKey[key] ?? hero;

/** Ubah baris database menjadi bentuk Service yang dipakai komponen situs. */
export function toService(row: ServiceRow): Service {
  const ex = (row.extras ?? {}) as ServiceExtras;
  const packages =
    ex.packages && ex.packages.length > 0
      ? ex.packages
      : [{ name: "Paket Standar", price: row.price, features: [] }];
  const galleryKeys = ex.gallery ?? [];
  const main = imageFor(row.image_key, row.photo_path);
  const gallery = row.photo_path
    ? [main, ...galleryKeys.map(keyImage)]
    : galleryKeys.length > 0
      ? galleryKeys.map(keyImage)
      : [main];
  return {
    slug: row.slug,
    name: row.name,
    category: row.category as Service["category"],
    image: main,
    gallery,
    short: row.short,
    description: row.description,
    benefits: ex.benefits ?? [],
    deliverables: ex.deliverables ?? [],
    packages,
    duration: row.duration,
    revisions: ex.revisions ?? "Sesuai paket",
    requirements: ex.requirements ?? [],
    available: row.available,
    featured: row.featured,
  };
}
