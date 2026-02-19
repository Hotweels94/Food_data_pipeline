import { OpenFoodFactsProduct } from "@/types/openFoodFacts";

type OpenFoodFactsResponse = {
  products: OpenFoodFactsProduct[];
};

export async function fetchOpenFoodFacts(
  page: number,
  pageSize: number
): Promise<OpenFoodFactsProduct[]> {
  const url = new URL("https://world.openfoodfacts.org/api/v2/search");

  url.searchParams.set("page", page.toString());
  url.searchParams.set("page_size", pageSize.toString());


  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "food-data-pipeline/1.0 (student project)",
      "Accept": "application/json"
    }
  });

  if (!res.ok) {
    throw new Error(`OpenFoodFacts HTTP ${res.status}`);
  }

  const data: OpenFoodFactsResponse = await res.json();
  return data.products ?? [];
}