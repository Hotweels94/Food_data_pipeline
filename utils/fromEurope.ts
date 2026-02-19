export default function fromEurope(country: string): string {
  const normalized = (country ?? "").trim();

  const europeCountries = [
    // Austria
    "Austria",
    "Österreich",
    // Belgium
    "Belgium",
    "Belgique",
    "België",
    // Bulgaria
    "Bulgaria",
    "България",
    // Croatia
    "Croatia",
    "Hrvatska",
    // Cyprus
    "Cyprus",
    "Κύπρος",
    "Kıbrıs",
    // Czech Republic / Czechia
    "Czech Republic",
    "Czechia",
    "Česko",
    // Denmark
    "Denmark",
    "Danmark",
    // Estonia
    "Estonia",
    "Eesti",
    // Finland
    "Finland",
    "Suomi",
    // France
    "France",
    // Germany
    "Germany",
    "Deutschland",
    // Greece
    "Greece",
    "Ελλάδα",
    // Hungary
    "Hungary",
    "Magyarország",
    // Ireland
    "Ireland",
    "Éire",
    // Italy
    "Italy",
    "Italia",
    // Latvia
    "Latvia",
    "Latvija",
    // Lithuania
    "Lithuania",
    "Lietuva",
    // Luxembourg
    "Luxembourg",
    "Luxemburg",
    "Lëtzebuerg",
    // Malta
    "Malta",
    // Netherlands
    "Netherlands",
    "Nederland",
    // Poland
    "Poland",
    "Polska",
    // Portugal
    "Portugal",
    // Romania
    "Romania",
    "România",
    // Slovakia
    "Slovakia",
    "Slovensko",
    // Slovenia
    "Slovenia",
    "Slovenija",
    // Spain
    "Spain",
    "España",
    // Sweden
    "Sweden",
    "Sverige",
    // United Kingdom
    "United Kingdom",
    "United Kingdom of Great Britain and Northern Ireland",
    "United-Kingdom",
    "UK",
    "Great Britain",
    "Britain",
    "Royaume-Uni",
  ];

  return europeCountries.includes(normalized) ? "Europe" : "Non-Europe";
}