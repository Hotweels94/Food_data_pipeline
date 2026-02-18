"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

type Props = Readonly<{
  defaultName: string;
  defaultNutriscore: string;
  defaultFromEurope: string;
  defaultCategory: string;
  defaultBrand: string;
}>;

export function ProductsFilters({
  defaultName,
  defaultNutriscore,
  defaultFromEurope,
  defaultCategory,
  defaultBrand,
}: Props) {
  const router = useRouter();

  const handleSubmit = useCallback(
    (e: React.SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const data = new FormData(form);
      const params = new URLSearchParams();
      data.forEach((raw, key) => {
        const v = typeof raw === "string" ? raw.trim() : "";
        if (v) params.set(key, v);
      });
      params.set("page", "1");
      router.push(`/products?${params.toString()}`);
    },
    [router]
  );

  const name = defaultName;
  const nutriscore = defaultNutriscore;
  const fromEurope = defaultFromEurope;
  const category = defaultCategory;
  const brand = defaultBrand;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
      <label className="flex flex-col gap-1 sm:w-48">
        <span className="text-sm font-medium text-stone-700">Nom</span>
        <input
          type="search"
          name="name"
          defaultValue={name}
          placeholder="Rechercher par nom"
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-800 placeholder-stone-400 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          aria-label="Rechercher par nom du produit"
        />
      </label>

      <label className="flex flex-col gap-1 sm:w-40">
        <span className="text-sm font-medium text-stone-700">Nutri-Score</span>
        <select
          name="nutriscore"
          defaultValue={nutriscore}
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-800 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          aria-label="Filtrer par Nutri-Score"
        >
          <option value="">Tous</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
          <option value="E">E</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 sm:w-44">
        <span className="text-sm font-medium text-stone-700">Origine</span>
        <select
          name="from_europe"
          defaultValue={fromEurope}
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-800 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          aria-label="Filtrer par origine"
        >
          <option value="">Tous</option>
          <option value="Europe">Europe</option>
          <option value="Non-Europe">Non-Europe</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 sm:w-52">
        <span className="text-sm font-medium text-stone-700">Catégorie</span>
        <input
          type="search"
          name="category"
          defaultValue={category}
          placeholder="Ex. boissons, biscuits"
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-800 placeholder-stone-400 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          aria-label="Filtrer par catégorie"
        />
      </label>

      <label className="flex flex-col gap-1 sm:w-44">
        <span className="text-sm font-medium text-stone-700">Marque</span>
        <input
          type="search"
          name="brand"
          defaultValue={brand}
          placeholder="Ex. Nestlé, Danone"
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-800 placeholder-stone-400 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          aria-label="Filtrer par marque"
        />
      </label>

      <div className="flex gap-2 sm:items-end">
        <button
          type="submit"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
        >
          Filtrer
        </button>
        <button
          type="button"
          onClick={() => router.push("/products")}
          className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:ring-offset-2"
        >
          Réinitialiser
        </button>
      </div>
    </form>
  );
}
