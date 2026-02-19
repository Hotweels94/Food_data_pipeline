import Link from "next/link";
import { notFound } from "next/navigation";

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
  created_at?: string;
  image_url?: string | null;
  barcode?: string | null;
};

async function getProduct(id: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${base}/api/products/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json() as Promise<Product>;
}

// Score en base : A=40, B=30, C=20, D=10, E=0 (voir computeNutriScorePersonalized)
const NUTRI_GRADE_COLORS = ["#10b981", "#84cc16", "#eab308", "#f97316", "#ef4444"];

function scoreToGradeIndex(score: number): number {
  const idx = Math.round((40 - score) / 10);
  return Math.max(0, Math.min(4, idx));
}

function NutriGrade({ score }: Readonly<{ score: number | null }>) {
  if (score == null) return null;
  const grades = ["A", "B", "C", "D", "E"] as const;
  const idx = scoreToGradeIndex(score);
  return (
    <span
      className="inline-flex h-14 w-14 items-center justify-center rounded-2xl font-bold text-white text-2xl shadow-lg"
      style={{ backgroundColor: NUTRI_GRADE_COLORS[idx] }}
    >
      {grades[idx]}
    </span>
  );
}

function InfoRow({
  label,
  value,
  unit,
}: Readonly<{
  label: string;
  value: number | string | null;
  unit?: string;
}>) {
  let display: string;
  if (value === null || value === undefined) {
    display = "—";
  } else if (typeof value === "number") {
    display = `${value}${unit ?? ""}`;
  } else {
    display = value;
  }
  return (
    <div className="flex justify-between border-b border-stone-100 py-3">
      <span className="text-stone-500">{label}</span>
      <span className="font-medium text-stone-800">{display}</span>
    </div>
  );
}

export default async function ProductPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const product = await getProduct(id);
  if (product === null) notFound();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-stone-200 bg-[var(--card)] shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link
            href="/products"
            className="text-stone-500 transition hover:text-[var(--accent)]"
          >
            ← Catalogue
          </Link>
          <Link
            href="/stats"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Statistiques
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <article className="overflow-hidden rounded-2xl border border-stone-200 bg-[var(--card)] shadow-md">
          <div className="border-b border-stone-100 bg-[var(--accent-light)]/50 px-6 py-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-stone-800">
                  {product.name || "Sans nom"}
                </h1>
                {product.brand && (
                  <p className="mt-1 text-stone-600">{product.brand}</p>
                )}
              </div>
              <NutriGrade score={product.nutriscore_score} />
            </div>
            {product.category && (
              <p className="mt-3 text-sm text-stone-500">{product.category}</p>
            )}
          </div>

          <div className="px-6 py-6">
            {product.image_url && (
              <div className="mb-6 flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image_url}
                  alt={product.name || "Image du produit"}
                  className="max-h-64 rounded-xl object-contain shadow-sm"
                />
              </div>
            )}
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-stone-500">
              Informations nutritionnelles
            </h2>
            <div className="space-y-0">
              <InfoRow
                label="Score Nutri-Score"
                value={
                  product.nutriscore_score === null ||
                  product.nutriscore_score === undefined
                    ? null
                    : `Grade ${["A", "B", "C", "D", "E"][scoreToGradeIndex(product.nutriscore_score)]}`
                }
              />
              <InfoRow label="Code-barres" value={product.barcode ?? null} />
              <InfoRow label="Origine" value={product.from_europe} />
              <InfoRow label="Calories" value={product.calories} unit=" kcal" />
              <InfoRow label="Matières grasses" value={product.fat} unit=" g" />
              <InfoRow label="Sucres" value={product.sugar} unit=" g" />
              <InfoRow label="Sel" value={product.salt} unit=" g" />
            </div>
          </div>
        </article>

        <div className="mt-6 flex gap-3">
          <Link
            href="/products"
            className="rounded-xl border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
          >
            Retour au catalogue
          </Link>
          <Link
            href="/"
            className="rounded-xl bg-stone-100 px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-200"
          >
            Accueil
          </Link>
        </div>
      </main>
    </div>
  );
}
