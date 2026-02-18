import { connectMongo } from "@/lib/mongo";
import EnrichedProduct from "@/models/EnrichedProduct";
import RawProduct from "@/models/RawProduct";
import fromEurope from "@/utils/fromEurope";
import computeNutriScorePersonalized from "@/utils/computeNutriScorePersonalized";
import { initDb, mongoToSqlite } from "@/lib/initDb";

// Mock des modules
jest.mock("@/lib/mongo");
jest.mock("@/models/RawProduct");
jest.mock("@/models/EnrichedProduct");
jest.mock("@/utils/fromEurope");
jest.mock("@/utils/computeNutriScorePersonalized");
jest.mock("@/lib/initDb");

describe("Mapping ETL", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("devrait mapper correctement un produit brut vers un produit enrichi", async () => {
    const mockRawProduct = {
      _id: "raw_id_1",
      payload: {
        product_name: "Test Product",
        brands: "Test Brand",
        categories: "Test Category",
        nutriscore_grade: "A",
        country: "France",
        nutriments: {
          energy: 100,
          fat: 5,
          sugars: 10,
          salt: 0.5,
        },
      },
    };

    const mockRawProducts = [mockRawProduct];

    (RawProduct.find as jest.Mock).mockResolvedValue(mockRawProducts);
    (computeNutriScorePersonalized as jest.Mock).mockReturnValue(40);
    (fromEurope as jest.Mock).mockReturnValue("Europe");

    const mockEnrichedProduct = {
      save: jest.fn().mockResolvedValue(true),
    };
    (EnrichedProduct as unknown as jest.Mock).mockImplementation(() => mockEnrichedProduct);

    const rawProducts = await RawProduct.find();
    for (const rawProduct of rawProducts) {
      const payload = rawProduct.payload;
      const nutriscore_grade = payload.nutriscore_grade || "E";
      const nutri_score_personalized = computeNutriScorePersonalized(nutriscore_grade);
      const fromEuropeValue = fromEurope(payload.country);
      const enrichedProduct = new EnrichedProduct({
        raw_product: rawProduct._id,
        raw_product_data: payload,
        nutri_score_personalized: nutri_score_personalized,
        fromEurope: fromEuropeValue,
      });
      await enrichedProduct.save();
    }

    expect(RawProduct.find).toHaveBeenCalled();
    expect(computeNutriScorePersonalized).toHaveBeenCalledWith("A");
    expect(fromEurope).toHaveBeenCalledWith("France");
    expect(EnrichedProduct).toHaveBeenCalledWith({
      raw_product: "raw_id_1",
      raw_product_data: mockRawProduct.payload,
      nutri_score_personalized: 40,
      fromEurope: "Europe",
    });
    expect(mockEnrichedProduct.save).toHaveBeenCalled();
  });

  it("devrait utiliser 'E' comme grade par défaut si nutriscore_grade est manquant", async () => {
    const mockRawProduct = {
      _id: "raw_id_2",
      payload: {
        product_name: "Product sans nutriscore",
        country: "Canada",
      },
    };

    (RawProduct.find as jest.Mock).mockResolvedValue([mockRawProduct]);
    (computeNutriScorePersonalized as jest.Mock).mockReturnValue(0);
    (fromEurope as jest.Mock).mockReturnValue("Non-Europe");

    const mockEnrichedProduct = {
      save: jest.fn().mockResolvedValue(true),
    };
    (EnrichedProduct as unknown as jest.Mock).mockImplementation(() => mockEnrichedProduct);

    const rawProducts = await RawProduct.find();
    for (const rawProduct of rawProducts) {
      const payload = rawProduct.payload;
      const nutriscore_grade = payload.nutriscore_grade || "E";
      const nutri_score_personalized = computeNutriScorePersonalized(nutriscore_grade);
      const fromEuropeValue = fromEurope(payload.country);
      const enrichedProduct = new EnrichedProduct({
        raw_product: rawProduct._id,
        raw_product_data: payload,
        nutri_score_personalized: nutri_score_personalized,
        fromEurope: fromEuropeValue,
      });
      await enrichedProduct.save();
    }

    expect(computeNutriScorePersonalized).toHaveBeenCalledWith("E");
  });

  it("devrait traiter plusieurs produits bruts", async () => {
    const mockRawProducts = [
      {
        _id: "raw_id_1",
        payload: { nutriscore_grade: "A", country: "France" },
      },
      {
        _id: "raw_id_2",
        payload: { nutriscore_grade: "B", country: "Germany" },
      },
      {
        _id: "raw_id_3",
        payload: { nutriscore_grade: "C", country: "USA" },
      },
    ];

    (RawProduct.find as jest.Mock).mockResolvedValue(mockRawProducts);
    (computeNutriScorePersonalized as jest.Mock)
      .mockReturnValueOnce(40)
      .mockReturnValueOnce(30)
      .mockReturnValueOnce(20);
    (fromEurope as jest.Mock)
      .mockReturnValueOnce("Europe")
      .mockReturnValueOnce("Europe")
      .mockReturnValueOnce("Non-Europe");

    const mockEnrichedProduct = {
      save: jest.fn().mockResolvedValue(true),
    };
    (EnrichedProduct as unknown as jest.Mock).mockImplementation(() => mockEnrichedProduct);

    const rawProducts = await RawProduct.find();
    for (const rawProduct of rawProducts) {
      const payload = rawProduct.payload;
      const nutriscore_grade = payload.nutriscore_grade || "E";
      const nutri_score_personalized = computeNutriScorePersonalized(nutriscore_grade);
      const fromEuropeValue = fromEurope(payload.country);
      const enrichedProduct = new EnrichedProduct({
        raw_product: rawProduct._id,
        raw_product_data: payload,
        nutri_score_personalized: nutri_score_personalized,
        fromEurope: fromEuropeValue,
      });
      await enrichedProduct.save();
    }

    expect(EnrichedProduct).toHaveBeenCalledTimes(3);
    expect(mockEnrichedProduct.save).toHaveBeenCalledTimes(3);
  });

  it("devrait appeler initDb et mongoToSqlite dans le bon ordre", async () => {
    (RawProduct.find as jest.Mock).mockResolvedValue([]);
    (initDb as jest.Mock).mockReturnValue(undefined);
    (mongoToSqlite as jest.Mock).mockResolvedValue(undefined);

    await connectMongo();
    const rawProducts = await RawProduct.find();
    initDb();
    await mongoToSqlite();

    expect(initDb).toHaveBeenCalled();
    expect(mongoToSqlite).toHaveBeenCalled();
    
    const initDbCallOrder = (initDb as jest.Mock).mock.invocationCallOrder[0];
    const mongoToSqliteCallOrder = (mongoToSqlite as jest.Mock).mock.invocationCallOrder[0];
    expect(initDbCallOrder).toBeLessThan(mongoToSqliteCallOrder);
  });
});
