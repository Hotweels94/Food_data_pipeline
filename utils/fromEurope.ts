export default function fromEurope(country: string): string {
    const europeCountries = [
        "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic",
        "Denmark", "Estonia", "Finland", "France", "Germany", "Greece", "Hungary",
        "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta",
        "Netherlands", "Poland", "Portugal", "Romania", "Slovakia", "Slovenia",
        "Spain", "Sweden", "United Kingdom"
    ];
    return europeCountries.includes(country) ? "Europe" : "Non-Europe";
}