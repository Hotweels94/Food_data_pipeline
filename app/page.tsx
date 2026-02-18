import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] font-sans">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-16">
        <h1 className="text-center text-3xl font-bold tracking-tight text-stone-800 sm:text-4xl">
          Food Data Pipeline
        </h1>
        <p className="mt-3 text-center text-stone-600">
          Catalogue et statistiques des produits alimentaires enrichis.
        </p>

        <nav className="mt-10 flex flex-col gap-4 sm:flex-row sm:gap-6">
          <Link
            href="/products"
            className="flex min-w-[200px] items-center justify-center gap-2 rounded-xl border-2 border-amber-200 bg-amber-50 px-6 py-4 font-medium text-amber-900 transition hover:border-amber-300 hover:bg-amber-100"
          >
            <span aria-hidden>📦</span>{" "}
            Catalogue produits
          </Link>
          <Link
            href="/stats"
            className="flex min-w-[200px] items-center justify-center gap-2 rounded-xl border-2 border-stone-200 bg-white px-6 py-4 font-medium text-stone-700 shadow-sm transition hover:border-stone-300 hover:bg-stone-50"
          >
            <span aria-hidden>📊</span>{" "}
            Statistiques
          </Link>
        </nav>

        <p className="mt-8 text-center text-sm text-stone-500">
          Utilisez les liens ci-dessus pour parcourir les produits ou consulter
          les statistiques Nutri-Score.
        </p>
      </main>
    </div>
  );
}
