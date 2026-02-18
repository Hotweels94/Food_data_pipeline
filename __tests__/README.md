# Tests pour Food Data Pipeline

Ce répertoire contient tous les tests pour le pipeline de données alimentaires.

## Structure

```
__tests__/
├── unit/                    # Tests unitaires
│   ├── parsing.test.ts      # Tests pour le parsing des données
│   ├── enrichissement.test.ts # Tests pour l'enrichissement
│   ├── normalisation.test.ts # Tests pour la normalisation
│   └── mapping-etl.test.ts   # Tests pour le mapping ETL
└── integration/              # Tests d'intégration
    ├── api-endpoint.test.ts  # Tests d'appel API réel
    ├── sql-query.test.ts     # Tests de requêtes SQL
    └── pipeline-complet.test.ts # Tests du pipeline complet
```

## Installation

Installer les dépendances de test :

```bash
npm install
```

## Exécution des tests

### Tous les tests
```bash
npm test
```

### Tests en mode watch
```bash
npm run test:watch
```

### Tests avec couverture de code
```bash
npm run test:coverage
```

### Tests unitaires uniquement
```bash
npm test -- __tests__/unit
```

### Tests d'intégration uniquement
```bash
npm test -- __tests__/integration
```

## Types de tests

### Tests unitaires

- **Parsing** : Teste la récupération et le parsing des données depuis l'API OpenFoodFacts
- **Enrichissement** : Teste les fonctions `computeNutriScorePersonalized` et `fromEurope`
- **Normalisation** : Teste la transformation des données MongoDB vers SQLite
- **Mapping ETL** : Teste le processus complet de transformation des données

### Tests d'intégration

- **Appel API réel** : Fait de vrais appels à l'API OpenFoodFacts (peut être désactivé avec `.skip`)
- **Requêtes SQL** : Teste les requêtes SQL sur une base de données SQLite en mémoire
- **Pipeline complet** : Teste le flux complet collect -> enrich -> normalize sur un petit jeu de données

## Notes

- Les tests d'intégration qui font des appels API réels peuvent prendre du temps et nécessitent une connexion internet
- Les tests utilisent des bases de données en mémoire pour éviter de modifier les données de production
- Certains tests peuvent nécessiter une configuration MongoDB pour fonctionner complètement
