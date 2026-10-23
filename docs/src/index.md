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
---

<div class="home-content">

<HomeSearch />

## Avant, après

Chaque règle se termine par la correction, souvent en code. AGG-01 : c’est l’aggregate qui décide, et il refuse avec un résultat, pas avec une exception.

::: code-group

```ts [Avant]
// The use case decides, the aggregate obeys
if (transfer.status === TransferStatus.Executed) {
  throw new TransferAlreadyExecutedError(transfer.id);
}

transfer.status = TransferStatus.Cancelled;
```

```ts [Après · AGG-01]
// The aggregate decides, and answers with a result
const cancelled = transfer.cancel();

if (!cancelled.ok) {
  return cancelled;
}
```

:::

</div>
