import Link from "next/link";
import { ProductsFilters } from "./ProductsFilters";

type Product = {
  id: number;
  name: string;
  brand: string | null;
  category: string | null;
  nutriscore_score: number | null;
  from_europe: string | null;
  calories: number | null;
  fat: number | null;
  sugar: number | null;
  salt: number | null;
};

const LIMIT = 12;

function buildProductsUrl(params: Record<string, string | number>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "" && String(v).trim() !== "") {
      sp.set(k, String(v));
    }
  });
  const q = sp.toString();
  return q ? `/products?${q}` : "/products";
}

async function getProducts(
  page: number,
  filters: { name?: string; nutriscore?: string; from_europe?: string; category?: string; brand?: string }
) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const sp = new URLSearchParams({
    page: String(page),
    limit: String(LIMIT),
    ...(filters.name && { name: filters.name }),
    ...(filters.nutriscore && { nutriscore: filters.nutriscore }),
    ...(filters.from_europe && { from_europe: filters.from_europe }),
    ...(filters.category && { category: filters.category }),
    ...(filters.brand && { brand: filters.brand }),
  });
  const res = await fetch(`${base}/api/products?${sp.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) return { page: 1, limit: LIMIT, total: 0, products: [] as Product[] };
  return res.json();
}

// Score en base : A=40, B=30, C=20, D=10, E=0 (voir computeNutriScorePersonalized)
const NUTRI_COLORS: Record<number, string> = {
  0: "#10b981",
  1: "#84cc16",
  2: "#eab308",
  3: "#f97316",
  4: "#ef4444",
};

function scoreToGradeIndex(score: number): number {
  const idx = Math.round((40 - score) / 10);
  return Math.max(0, Math.min(4, idx));
}

function NutriBadge({ score }: Readonly<{ score: number | null }>) {
  if (score == null) return <span className="text-stone-400">—</span>;
  const grades = ["A", "B", "C", "D", "E"] as const;
  const idx = scoreToGradeIndex(score);
  const grade = grades[idx];
  const bg = NUTRI_COLORS[idx] ?? "#ef4444";
  return (
    <span
      className="inline-flex h-8 w-8 items-center justify-center rounded-full font-bold text-white text-sm"
      style={{ backgroundColor: bg }}
    >
      {grade}
    </span>
  );
}

export default async function ProductsPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ page?: string; name?: string; nutriscore?: string; from_europe?: string; category?: string; brand?: string }> }>) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);
  const filters = {
    name: params.name ?? "",
    nutriscore: params.nutriscore ?? "",
    from_europe: params.from_europe ?? "",
    category: params.category ?? "",
    brand: params.brand ?? "",
  };

  const { products, limit, total } = await getProducts(page, filters);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasFilters = Boolean(filters.name || filters.nutriscore || filters.from_europe || filters.category || filters.brand);
  const pluralS = total > 1 ? "s" : "";
  const resultLabel =
    total === 0
      ? "Aucun résultat."
      : `${total} produit${pluralS} (page ${page}/${totalPages})`;

  const baseQuery: Record<string, string | number> = {
    ...(filters.name && { name: filters.name }),
    ...(filters.nutriscore && { nutriscore: filters.nutriscore }),
    ...(filters.from_europe && { from_europe: filters.from_europe }),
    ...(filters.category && { category: filters.category }),
    ...(filters.brand && { brand: filters.brand }),
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-stone-200 bg-[var(--card)] shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="text-stone-600 transition hover:text-[var(--accent)]"
          >
            ← Accueil
          </Link>
          <h1 className="text-xl font-semibold text-stone-800">
            Catalogue produits
          </h1>
          <Link
            href="/stats"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Statistiques
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <section
          className="mb-6 rounded-xl border border-stone-200 bg-[var(--card)] p-4 shadow-sm"
          aria-label="Filtres"
        >
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-stone-500">
            Filtres
          </h2>
          <ProductsFilters
            key={`${filters.name}|${filters.nutriscore}|${filters.from_europe}|${filters.category}|${filters.brand}`}
            defaultName={filters.name}
            defaultNutriscore={filters.nutriscore}
            defaultFromEurope={filters.from_europe}
            defaultCategory={filters.category}
            defaultBrand={filters.brand}
          />
          {hasFilters && (
            <p className="mt-3 text-sm text-stone-500">
              <Link href="/products" className="underline hover:text-[var(--accent)]">
                Réinitialiser les filtres
              </Link>
            </p>
          )}
        </section>

        <p className="mb-4 text-sm font-medium text-stone-700">
          {resultLabel}
        </p>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.length === 0 ? (
            <p className="col-span-full py-12 text-center text-stone-500">
              Aucun produit ne correspond aux critères.
            </p>
          ) : (
            products.map((p: Product) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-[var(--card)] shadow-sm transition hover:border-amber-200 hover:shadow-md"
              >
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <h2 className="line-clamp-2 font-semibold text-stone-800 group-hover:text-[var(--accent)]">
                      {p.name || "Sans nom"}
                    </h2>
                    <NutriBadge score={p.nutriscore_score} />
                  </div>
                  {p.brand && (
                    <p className="text-sm text-stone-600">{p.brand}</p>
                  )}
                  {p.category && (
                    <p className="mt-1 text-xs text-stone-500 line-clamp-1">
                      {p.category}
                    </p>
                  )}
                  <div className="mt-auto pt-4 text-sm text-stone-400">
                    Voir la fiche →
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        <nav
          className="mt-8 flex flex-wrap items-center justify-center gap-2"
          aria-label="Pagination"
        >
          {page > 1 && (
            <Link
              href={buildProductsUrl({ ...baseQuery, page: page - 1 })}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50"
            >
              Précédent
            </Link>
          )}
          <span className="px-4 py-2 text-sm font-medium text-stone-600">
            Page {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={buildProductsUrl({ ...baseQuery, page: page + 1 })}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50"
            >
              Suivant
            </Link>
          )}
        </nav>
      </main>
    </div>
  );
}
