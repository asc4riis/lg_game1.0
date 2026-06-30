# Aide au Narrateur — Loups-Garous de Thiercelieux

Application web mobile-first pour faciliter la narration d'une partie de Loups-Garous.

## Fonctionnalités

- **Gestion des joueurs** — ajout, suppression, jusqu'à 30 joueurs
- **Sélection des rôles** — tous les classiques + extensions + rôles maison, avec filtres par camp
- **Presets** — Équilibré, Chaos, Classique, Social, Traîtres — génération automatique de compositions
- **Jauger l'équilibre** — score et remarques en temps réel
- **Attribution secrète** — révélation carte par carte, le Loup Amnésique voit "Villageois"
- **Guide de nuit pas à pas** — instructions narrateur pour chaque rôle dans l'ordre exact
- **Gestion des effets** — protections, hypnose, endormissement, jetons du Parieur
- **Résolution automatique** — mort, survie, interception, amoureux, conversion
- **Détection de victoire** — tous les camps, dans le bon ordre de priorité
- **Journal de partie** — historique complet des événements

## Rôles inclus

### Classiques
Villageois, Voyante, Sorcière, Chasseur, Cupidon, Petite Fille, Ancien, Sœurs, Chevalier à l'épée rouillée, Renard, Montreur d'Ours, Joueur de Flûte, Ange, Loup-Garou, Grand Méchant Loup, Loup Blanc, Loup Noir, Chien-Loup, Enfant Sauvage

### Maison (✦)
Pharmacien, Hypnotiseur, Évaluateur, Protecteur, Garde du Corps, Parieur, Ancien Loup, Loup Amnésique

## Structure du projet

```
aide-au-narrateur/
├── index.html    Interface principale
├── roles.js      Base de données des rôles + ordre des nuits
├── presets.js    Logique des presets et suggestions
├── app.js        Logique de partie (importable séparément)
└── README.md
```

## Hébergement sur GitHub Pages

1. Créer un dépôt public sur [github.com](https://github.com)
2. Uploader les 4 fichiers (`index.html`, `roles.js`, `presets.js`, `app.js`)
3. Aller dans **Settings → Pages**
4. Source : **Deploy from a branch** → branche `main`, dossier `/ (root)`
5. Sauvegarder — l'URL sera `https://ton-pseudo.github.io/nom-du-repo`

> **Note** : `app.js` est la logique découplée. L'interface `index.html` contient sa propre logique inline pour fonctionner sans serveur. Les deux coexistent.

## Ordre des nuits

### Nuit 1 (mise en place)
1. Cupidon
2. Enfant Sauvage
3. Chien-Loup
4. Sœurs
5. Ancien Loup *(puis suite identique aux nuits suivantes)*

### Nuits suivantes
1. Ancien Loup
2. Pharmacien ✦
3. Voyante
4. Hypnotiseur ✦
5. Renard
6. Évaluateur ✦
7. Protecteur ✦
8. Garde du Corps ✦
9. Parieur ✦
10. Joueur de Flûte
11. Loups-Garous
12. Loup Noir *(si pouvoir non utilisé)*
13. Grand Méchant Loup *(si tous compères vivants)*
14. Loup Blanc *(nuits paires uniquement)*
15. Loup Amnésique ✦ *(si réveil)*
16. Sorcière
17. Petite Fille *(passive)*

## Distinctions importantes

| Protection | Attaques physiques | Attaques psychiques | Passifs |
|---|---|---|---|
| **Protecteur** | ✓ bloque | ✗ | ✗ |
| **Garde du Corps** | ✓ bloque | ✓ bloque | ✗ |

Attaques **physiques** : Loups, Grand Méchant Loup, Sorcière (mort), Pharmacien, Chasseur (riposte)  
Attaques **psychiques** : Hypnotiseur  
**Passifs** (non redirectibles) : Évaluateur, Voyante, Renard, Montreur d'Ours, Parieur (défense)
