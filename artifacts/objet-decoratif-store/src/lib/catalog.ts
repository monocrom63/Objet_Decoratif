import {
  Catalog as ApiCatalog,
  Product as ApiProduct,
  Scent as ApiScent,
} from "@workspace/api-client-react";

export type ProductCollection = string;

export type ScentOption = {
  id: string;
  name: string;
  notes: string;
  description: string;
  image?: string;
};

export type FrontendProduct = {
  id: string;
  name: string;
  collection: ProductCollection;
  category: string;
  description: string;
  explanation: string;
  price: number; // in euros
  art: string; // derived from id/slug
  tag?: string;
  scents: string[];
  images?: string[];
  scentOptions?: ScentOption[];
};

export function resolveImagePath(
  path: string | null | undefined,
): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("/objects/")) {
    return `/api/storage${path}`;
  }
  if (path.startsWith("http") || path.startsWith("data:")) {
    return path;
  }
  const clean = path.replace(/^\/+/, "");
  if (clean.startsWith("images/")) {
    return `${import.meta.env.BASE_URL}${clean}`;
  }
  return `${import.meta.env.BASE_URL}images/${clean}`;
}

export function mapApiCatalogToFrontend(catalog: ApiCatalog | undefined): {
  products: FrontendProduct[];
  scents: ScentOption[];
} {
  if (!catalog) return { products: [], scents: [] };

  const scentMap = new Map<string, ScentOption>();
  const scents = catalog.scents
    .filter((s) => s.active && s.published)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => {
      const option = {
        id: s.id,
        name: s.name,
        notes: s.notes,
        description: s.description,
        image: resolveImagePath(s.imagePath),
      };
      scentMap.set(s.id, option);
      return option;
    });

  const products = catalog.products
    .filter((p) => p.active && p.published)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((p) => {
      const pScents = p.scentIds
        .map((id) => scentMap.get(id))
        .filter((s): s is ScentOption => !!s);

      return {
        id: p.id,
        name: p.name,
        collection: p.collection,
        category: p.category,
        description: p.description,
        explanation: p.explanation,
        price: p.priceCents / 100,
        art: `art-${p.id}`,
        tag: p.tag || undefined,
        scents: pScents.map((s) => s.name),
        images: p.imagePaths
          .map(resolveImagePath)
          .filter((p): p is string => !!p),
        scentOptions: pScents,
      };
    });

  return { products, scents };
}

import { useGetCatalog } from "@workspace/api-client-react";
import { useMemo } from "react";

export function useCatalogFrontend() {
  const query = useGetCatalog();
  const { products, scents } = useMemo(
    () => mapApiCatalogToFrontend(query.data),
    [query.data],
  );
  return { products, scents, isLoading: query.isLoading, error: query.error };
}
