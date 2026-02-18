import computeNutriScorePersonalized from "@/utils/computeNutriScorePersonalized";
import fromEurope from "@/utils/fromEurope";

describe("Enrichissement - computeNutriScorePersonalized", () => {
  it("devrait retourner 40 pour le grade A", () => {
    expect(computeNutriScorePersonalized("A")).toBe(40);
  });

  it("devrait retourner 30 pour le grade B", () => {
    expect(computeNutriScorePersonalized("B")).toBe(30);
  });

  it("devrait retourner 20 pour le grade C", () => {
    expect(computeNutriScorePersonalized("C")).toBe(20);
  });

  it("devrait retourner 10 pour le grade D", () => {
    expect(computeNutriScorePersonalized("D")).toBe(10);
  });

  it("devrait retourner 0 pour le grade E", () => {
    expect(computeNutriScorePersonalized("E")).toBe(0);
  });

  it("devrait être insensible à la casse", () => {
    expect(computeNutriScorePersonalized("a")).toBe(40);
    expect(computeNutriScorePersonalized("b")).toBe(30);
    expect(computeNutriScorePersonalized("e")).toBe(0);
  });

  it("devrait retourner 0 pour un grade invalide", () => {
    expect(computeNutriScorePersonalized("X")).toBe(0);
    expect(computeNutriScorePersonalized("")).toBe(0);
    expect(computeNutriScorePersonalized("invalid")).toBe(0);
  });
});

describe("Enrichissement - fromEurope", () => {
  it("devrait retourner 'Europe' pour la France", () => {
    expect(fromEurope("France")).toBe("Europe");
  });

  it("devrait retourner 'Europe' pour l'Allemagne", () => {
    expect(fromEurope("Germany")).toBe("Europe");
  });

  it("devrait retourner 'Europe' pour le Royaume-Uni", () => {
    expect(fromEurope("United Kingdom")).toBe("Europe");
  });

  it("devrait retourner 'Europe' pour tous les pays de l'UE", () => {
    const europeanCountries = [
      "Austria",
      "Belgium",
      "Bulgaria",
      "Croatia",
      "Cyprus",
      "Czech Republic",
      "Denmark",
      "Estonia",
      "Finland",
      "France",
      "Germany",
      "Greece",
      "Hungary",
      "Ireland",
      "Italy",
      "Latvia",
      "Lithuania",
      "Luxembourg",
      "Malta",
      "Netherlands",
      "Poland",
      "Portugal",
      "Romania",
      "Slovakia",
      "Slovenia",
      "Spain",
      "Sweden",
      "United Kingdom",
    ];

    europeanCountries.forEach((country) => {
      expect(fromEurope(country)).toBe("Europe");
    });
  });

  it("devrait retourner 'Non-Europe' pour les États-Unis", () => {
    expect(fromEurope("United States")).toBe("Non-Europe");
  });

  it("devrait retourner 'Non-Europe' pour le Canada", () => {
    expect(fromEurope("Canada")).toBe("Non-Europe");
  });

  it("devrait retourner 'Non-Europe' pour le Japon", () => {
    expect(fromEurope("Japan")).toBe("Non-Europe");
  });

  it("devrait retourner 'Non-Europe' pour un pays vide", () => {
    expect(fromEurope("")).toBe("Non-Europe");
  });

  it("devrait retourner 'Non-Europe' pour un pays inconnu", () => {
    expect(fromEurope("Unknown Country")).toBe("Non-Europe");
  });
});
