# Présentation

Des règles courtes et vérifiables pour un backend TypeScript / NestJS, appliquées en revue de code et en CI. Elles couvrent deux choses : comment modéliser le métier avec le Domain-Driven Design, et où placer chaque morceau de code.

- Une règle = un **signal** à chercher dans le code, pourquoi c’est un problème, ses exceptions et la correction attendue.
- Chaque règle a un **code stable** (`AGG-06`) à citer dans une revue, un commit ou un waiver.
- Les règles sont regroupées par **thème**, chacun avec son préfixe, et les thèmes par **partie**.

## Cinq parties

| Partie | Ce qu’elle protège |
| --- | --- |
| [Conception stratégique](../rules/strategic-design/) | Les frontières : un langage par contexte, des relations déclarées entre contextes. |
| [Logique du domaine](../rules/domain-logic/) | Les règles métier à l’intérieur d’un contexte : un modèle tactique pour le core, des transaction scripts pour les contextes supporting et generic. |
| [Architecture et placement](../rules/architecture-and-placement/) | L’organisation du code : couches, dépendances, rôles de fichiers, wiring, et ce qui va où. |
| [Intégration](../rules/integration/) | Les échanges entre contextes : des appels, des messages et des contrats qui résistent au changement. |
| [Tests](../rules/testing/) | La preuve que le code marche : un domaine couvert en entier, sur une vraie base, par des tests stables. |

Les parties s’appuient les unes sur les autres : un modèle vit dans un contexte, l’architecture découpe le code de chaque contexte, l’intégration relie des contextes dont les frontières sont déjà claires, et les tests prouvent le tout.

## Lire une règle {#how-to-read}

Toutes les règles suivent le même format.

### Sections {#sections}

| Section | Contenu |
| --- | --- |
| **Signal** | Ce qu’il faut chercher dans le code. |
| **Pourquoi** | Ce que cela coûte si cela passe. |
| **Exceptions** | Les cas où le signal n’est pas un défaut. |
| **Correction** | La correction attendue. |
| **Adaptation** | Facultative. Ce qui est propre à TypeScript et à NestJS. Un paragraphe **Notre choix** donne le choix par défaut d’Alveolus (voir les [choix par défaut](./default-choices)). |
| **Voir aussi** | Facultative. Le lien avec une règle voisine, et comment éviter de signaler deux fois la même chose. |
| **Exemple** | Facultative. Le code à éviter et le code attendu. |

Chaque règle déclare aussi son **périmètre** : les parties du code qu’elle vise (`domain`, `application`, `driving`, `driven`, `public`, schéma, tests, structure). Les noms de dossiers renvoient à l’[architecture de référence](./reference-architecture).

Une règle peut aussi porter un **contexte** : elle ne s’applique alors que si le bounded context a adopté le style correspondant (multi-tenant…), par une décision enregistrée. Sinon, on l’ignore.

En haut de la page, une fiche résume le **style**, la **sévérité** et le **périmètre**. Les termes gardés en anglais sont dans le [glossaire](./glossary).

### Sévérité {#severity}

| Sévérité | Sens | Attendu en revue |
| --- | --- | --- |
| <span class="rule-badge rule-badge--blocking">bloquante</span> | Le code peut corrompre l’état ou casser un invariant en production. | Corriger avant de merger. |
| <span class="rule-badge rule-badge--major">majeure</span> | Le modèle ne garantit plus ses règles, ou le couplage coûtera cher. | Corriger avant de merger, sauf waiver documenté. |
| <span class="rule-badge rule-badge--minor">mineure</span> | Un écart de conception, à faible risque immédiat. | Corriger la prochaine fois que le code est touché. |
| <span class="rule-badge rule-badge--question">question</span> | Pas un défaut en soi : une décision à rendre explicite avec le métier ou l’auteur. | Poser la question et consigner la réponse. |

Certaines règles nuancent leur sévérité selon le contexte (par exemple « bloquante si deux écritures concurrentes peuvent casser un invariant, majeure sinon »). La nuance apparaît sous le badge.

### Waivers {#waivers}

Plusieurs règles admettent une exception « à documenter ». Un waiver se signale par un commentaire sur la ligne concernée, qui cite le code de la règle et la raison. Comme tout le code, ce commentaire est en anglais : le mot-clé est `waiver`.

```ts
// waiver AGG-03: <reason>, see ADR-NNNN
```

Une règle vérifiée par ESLint garde la même forme, après le `--` du commentaire qui désactive le lint : `// eslint-disable-next-line no-restricted-imports -- waiver WIR-05: <reason>`.

Quand le waiver touche l’architecture ou plusieurs fichiers, il s’appuie aussi sur une ADR, citée dans le commentaire. Une recherche de `waiver [A-Z]+-[0-9]+` trouve ainsi tous les waivers, en revue comme en CI.

## Exemples

La présentation de chaque thème le montre sur un court exemple, avec des notions bancaires courantes : de l’argent, un wallet, un solde, un dépôt, un retrait. La partie conception stratégique s’appuie sur une petite context map des services d’un établissement de paiement.

## Par où commencer

- **Découvrir le code** : l’[architecture de référence](./reference-architecture), puis la [logique du domaine](../rules/domain-logic/).
- **Relire un changement** : l’[index de toutes les règles](../rules/), filtrable par partie, thème, sévérité et périmètre.
- **Mettre en place un projet** : [mettre en place un projet](./prerequisites) (context map, glossaire, ADR, CODEOWNERS, outillage), l’[architecture de référence](./reference-architecture) et les [choix par défaut](./default-choices), puis [architecture et placement](../rules/architecture-and-placement/).

## Thèmes

### [Conception stratégique](../rules/strategic-design/)

<ThemeTable part="strategic-design" />

### [Logique du domaine](../rules/domain-logic/)

<ThemeTable part="domain-logic" />

### [Architecture et placement](../rules/architecture-and-placement/)

<ThemeTable part="architecture-and-placement" />

### [Intégration](../rules/integration/)

<ThemeTable part="integration" />

### [Tests](../rules/testing/)

<ThemeTable part="testing" />
