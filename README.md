# Nationalité Visualizer

Cette application React affiche l'évolution du nombre d'itérations par nationalité pour différents types d'entreprises en France entre 2015 et 2024. Elle permet de visualiser les données de manière interactive à travers différents graphiques.

## Fonctionnalités

- Visualisation de données pour trois ensembles de données : Auto-entrepreneurs, Sociétés, et Tout confondu
- Affichage des top nationalités avec un slider pour contrôler le nombre de nationalités affichées
- Sélection personnalisée des nationalités pour créer des graphiques comparatifs
- Interface utilisateur intuitive avec des onglets, des boutons radio et des menus déroulants
- Graphiques interactifs avec Plotly.js

## Prérequis

- Node.js (version 14 ou supérieure)
- npm ou yarn

## Installation

1. Clonez ce dépôt
2. Naviguez vers le répertoire du projet
3. Installez les dépendances:

```bash
npm install
# ou
yarn install
```

## Configuration des données

Placez vos fichiers CSV dans le dossier `public/data/`:

- `data-auto-entreprise-nationalite.csv`
- `data-societe-nationalite.csv`
- `data-tout-confondu-nationalite.csv`

Chaque fichier CSV doit contenir les colonnes suivantes:
- `annee`: L'année (2015-2024)
- `nationalite`: Le nom de la nationalité
- `iterations`: Le nombre d'itérations pour cette nationalité cette année-là

## Démarrage de l'application

Pour lancer l'application en mode développement:

```bash
npm start
# ou
yarn start
```

L'application sera disponible à l'adresse [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Construction pour la production

Pour construire l'application pour la production:

```bash
npm run build
# ou
yarn build
```

Cela créera un dossier `build` avec les fichiers optimisés pour la production.

## Technologies utilisées

- React (avec TypeScript)
- Plotly.js pour les graphiques
- Material-UI pour l'interface utilisateur
- PapaParse pour l'analyse des fichiers CSV 