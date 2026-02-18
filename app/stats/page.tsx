import Link from "next/link";

async function getStats() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${base}/api/stats`, { cache: "no-store" });
  if (res.ok) return res.json();
  return { totalProducts: 0, averageNutriScore: null as number | null };
}

export default async function StatsPage() {
  const { totalProducts, averageNutriScore } = await getStats();
  // Score en base : A=40, B=30, C=20, D=10, E=0
  const avg =
    averageNutriScore === null || averageNutriScore === undefined
      ? null
      : Math.round(averageNutriScore * 10) / 10;
  const gradeIndex =
    avg === null || avg === undefined
      ? null
      : Math.max(0, Math.min(4, Math.round((40 - avg) / 10)));
  const grade =
    gradeIndex === null ? "—" : ["A", "B", "C", "D", "E"][gradeIndex];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-stone-200 bg-[var(--card)] shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="text-stone-500 transition hover:text-[var(--accent)]"
          >
            ← Accueil
          </Link>
          <h1 className="text-xl font-semibold text-stone-800">
            Statistiques
          </h1>
          <Link
            href="/products"
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
          >
            Catalogue
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-[var(--card)] shadow-md">
            <div className="border-b border-stone-100 bg-amber-50 px-6 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-800">
                Total des produits
              </h2>
            </div>
            <div className="px-6 py-8">
              <p className="text-4xl font-bold text-stone-800">
                {totalProducts.toLocaleString("fr-FR")}
              </p>
              <p className="mt-2 text-sm text-stone-500">
                produits en base
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-[var(--card)] shadow-md">
            <div className="border-b border-stone-100 bg-amber-50 px-6 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-800">
                Nutri-Score moyen
              </h2>
            </div>
            <div className="flex flex-col items-start gap-3 px-6 py-8">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-stone-800">
                  {avg ?? "—"}
                </span>
                {avg != null && (
                  <span className="rounded-lg bg-amber-100 px-2 py-0.5 text-lg font-semibold text-amber-800">
                    Grade {grade}
                  </span>
                )}
              </div>
              <p className="text-sm text-stone-500">
                score moyen sur l’échelle A–E
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-stone-200 bg-[var(--card)] p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-stone-800">
            À propos des statistiques
          </h3>
          <p className="text-stone-600 text-sm leading-relaxed">
            Ces chiffres sont calculés à partir des produits enrichis présents
            dans la base. Le Nutri-Score moyen reflète la qualité nutritionnelle
            globale du catalogue (A = meilleur, E = moins bon).
          </p>
        </div>

        <div className="mt-8 flex gap-3">
          <Link
            href="/products"
            className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            Voir le catalogue
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
          >
            Accueil
          </Link>
        </div>
      </main>
    </div>
  );
}
