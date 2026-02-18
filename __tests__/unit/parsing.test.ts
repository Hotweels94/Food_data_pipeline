import { fetchOpenFoodFacts } from "@/services/openFood";
import { OpenFoodFactsProduct } from "@/types/openFoodFacts";

// Mock global fetch
globalThis.fetch = jest.fn();

describe("Parsing des données", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("devrait parser correctement une réponse valide de l'API OpenFoodFacts", async () => {
    const mockProducts: OpenFoodFactsProduct[] = [
      {
        product_name: "Test Product",
        brands: "Test Brand",
        categories: "Test Category",
        nutriscore_grade: "A",
        ingredients_text: "ingredient1, ingredient2",
        nutriments: {
          energy: 100,
          fat: 5,
          sugars: 10,
          salt: 0.5,
        },
        countries: "France",
      },
    ];

    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ products: mockProducts }),
    });

    const result = await fetchOpenFoodFacts(1, 10);

    expect(result).toEqual(mockProducts);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("world.openfoodfacts.org/api/v2/search"),
      expect.objectContaining({
        headers: expect.objectContaining({
          "User-Agent": "food-data-pipeline/1.0 (student project)",
        }),
      })
    );
  });

  it("devrait retourner un tableau vide si products est undefined", async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const result = await fetchOpenFoodFacts(1, 10);

    expect(result).toEqual([]);
  });

  it("devrait gérer les erreurs HTTP correctement", async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(fetchOpenFoodFacts(1, 10)).rejects.toThrow(
      "OpenFoodFacts HTTP 500"
    );
  });

  it("devrait construire correctement l'URL avec les paramètres", async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ products: [] }),
    });

    await fetchOpenFoodFacts(2, 50);

    const callUrl = (globalThis.fetch as jest.Mock).mock.calls[0][0];
    const url = new URL(callUrl);

    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("page_size")).toBe("50");
    expect(url.searchParams.get("fields")).toContain("product_name");
    expect(url.searchParams.get("fields")).toContain("brands");
    expect(url.searchParams.get("fields")).toContain("categories");
    expect(url.searchParams.get("fields")).toContain("nutriscore_grade");
  });

  it("devrait parser correctement un produit avec des champs optionnels manquants", async () => {
    const mockProduct: OpenFoodFactsProduct = {
      product_name: "Product sans tous les champs",
    };

    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ products: [mockProduct] }),
    });

    const result = await fetchOpenFoodFacts(1, 1);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(mockProduct);
  });
});
