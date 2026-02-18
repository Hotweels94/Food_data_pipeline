export default function computeNutriScorePersonalized(nutriscore_grade: string): number {
    const scores: Record<string, number> = {
        A: 40,
        B: 30,
        C: 20,
        D: 10,
        E: 0
    };

    return scores[nutriscore_grade.toUpperCase()] ?? 0;
}