import { fetchOpenFoodFacts } from "@/services/openFood";

describe("Tests d'intégration - Appel réel d'un endpoint API", () => {
  // These tests make real calls to the OpenFoodFacts API

  it("devrait faire un appel réel à l'API OpenFoodFacts et recevoir des données", async () => {
    const products = await fetchOpenFoodFacts(1, 5);

    expect(products).toBeDefined();
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBeGreaterThan(0);
  }, 10000);

  it("devrait retourner des produits avec la structure attendue", async () => {
    const products = await fetchOpenFoodFacts(1, 3);

    if (products.length > 0) {
      const product = products[0];

      expect(product).toHaveProperty("product_name");
    }
  }, 10000);

  it("devrait respecter le paramètre page_size", async () => {
    const products = await fetchOpenFoodFacts(1, 10);

    expect(products.length).toBeLessThanOrEqual(10);
  }, 10000);

  it("devrait gérer correctement les erreurs réseau", async () => {
    const originalFetch = global.fetch;
    
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("Network error"));

    await expect(fetchOpenFoodFacts(1, 5)).rejects.toThrow();

    global.fetch = originalFetch;
  });

  it("devrait inclure les bons headers dans la requête", async () => {
    const originalFetch = global.fetch;
    let capturedHeaders: HeadersInit | undefined;

    global.fetch = jest.fn().mockImplementation((url, options) => {
      capturedHeaders = options?.headers;
      return Promise.resolve({
        ok: true,
        json: async () => ({ products: [] }),
      });
    });

    await fetchOpenFoodFacts(1, 5);

    expect(capturedHeaders).toBeDefined();
    expect(capturedHeaders).toHaveProperty("User-Agent");
    expect(capturedHeaders).toHaveProperty("Accept");

    global.fetch = originalFetch;
  });
});
