---
layout: home
title: "Alveolus : le Domain-Driven Design, règle par règle"
titleTemplate: false

hero:
  name: Alveolus
  text: Le Domain-Driven Design, règle par règle.
  tagline: Des règles de Domain-Driven Design et d’architecture pour écrire et relire du code TypeScript / NestJS.
  image:
    src: /logo.svg
    alt: Logo Alveolus
  actions:
    - theme: brand
      text: Commencer ici
      link: /start/overview
    - theme: alt
      text: Parcourir les règles
      link: /rules/

features:
  - title: Conception stratégique
    details: Des frontières nettes. Un langage par bounded context, et des relations entre bounded contexts déclarées avant d’être codées.
    link: /rules/strategic-design/
    linkText: Voir les règles
  - title: Logique du domaine
    details: Des règles métier qui ont une adresse. Un modèle tactique pour le core, des transaction scripts pour le reste.
    link: /rules/domain-logic/
    linkText: Voir les règles
  - title: Architecture et placement
    details: Chaque fichier à sa place. Couches, dépendances, rôles de fichiers et wiring, sans débat.
    link: /rules/architecture-and-placement/
    linkText: Voir les règles
  - title: Intégration
    details: Des bounded contexts qui se parlent sans se casser. Appels, messages et contrats qui survivent au changement.
    link: /rules/integration/
    linkText: Voir les règles
  - title: Tests
    details: Des tests qui ne mentent pas. Un domaine couvert en entier, une vraie base jetable, aucun test instable.
    link: /rules/testing/
    linkText: Voir les règles
---

<div class="home-content">

<HomeSearch />

## Trois façons de s’en servir

Chaque brique sert seule. Ensemble, elles se renforcent : les règles disent quoi faire, `@alveolus/core` donne les classes pour le faire, et Claude Code les applique en codant.

<HomeUses />

## Une règle, une fiche

Toutes les règles suivent le même format, pensé pour la revue de code : ce qu’on voit dans le diff, ce que cela coûte, et comment corriger. Ici, un extrait d’AGG-15.

<HomeAnatomy />

## Deux styles, un filtre

Un bounded context ne mérite pas toujours un modèle tactique. Chaque règle dit à quel style elle s’applique, et le filtre en haut de page adapte tout le site, chiffres compris.

<HomeStyles />

</div>
