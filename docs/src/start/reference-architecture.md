# Architecture de référence

Le DDD n’impose pas d’organisation des dossiers. Toutes les règles d’Alveolus supposent celle-ci : une architecture hexagonale où chaque bounded context est découpé en cinq dossiers, selon le **rôle** du code et le **sens** de ses dépendances. Quand une règle nomme `domain`, `application`, `driving`, `driven` ou `public`, elle parle de ces dossiers.

## Cinq dossiers {#folders}

| Dossier | Rôle |
| --- | --- |
| `domain` | Le modèle : aggregates, entities, value objects, domain events, domain services, et les ports dont le modèle a besoin, comme les repositories. |
| `application` | Les commands (elles modifient des aggregates, ouvrent la transaction, contrôlent la sécurité) et les queries (elles lisent des views à travers des view ports). Les ports purement applicatifs (Unit of Work, outbox, horloge). |
| `driving` | Les adapters **entrants**, qui pilotent l’application : contrôleurs REST, resolvers, consumers de messages, une facade appelée par un autre contexte. |
| `driven` | Les adapters **sortants**, pilotés par l’application : implémentations des repositories, publication des events, clients d’autres contextes (anticorruption layer). |
| `public` | Le **published language** du contexte : les contrats exposés aux autres contextes (contrat de facade, DTO, integration events). Des types uniquement. |

## Règles de dépendance {#dependency-rules}

```
domain       → (nothing but shared and @alveolus/core)
application  → domain
driving      → application, public
driven       → domain, application, public
public       → (nothing)
other context → public only
```

- `domain` n’importe ni NestJS, ni ORM, ni client HTTP, ni broker (LAY-01, AGG-04, CTX-06).
- `application` ne sait rien du transport : pas de `Request`, pas d’exception HTTP, pas de message brut (UC-02).
- `driving` traduit l’entrée en command et délègue. Il ne décide rien (CTX-10, UC-04). Il traduit un refus en réponse par le `type` de l’erreur, sans importer `domain` (UC-02).
- `driven` implémente les ports de `domain` et d’`application`. Il traduit les domain events en integration events de `public` (PUB-01).
- `public` ne contient que des types : un contrat stable qui ne laisse pas fuir le modèle interne.
- Un autre contexte importe **uniquement** depuis `public` (CTX-01, MAP-01).
- Une technologie n’est importée que dans son dossier d’adapter : Prisma dans `driven/prisma`, les adapters NestJS dans `driving/http` (PLC-07).
- Le module NestJS du contexte est le seul endroit qui lie une implémentation à un port (WIR-01).

## Contextes transaction script {#transaction-script-variant}

Cette organisation est celle du style tactique, pour les contextes core. Un contexte supporting ou generic déclaré `transaction-script` (CTX-14) n’a pas de modèle à protéger : il n’a pas de dossier `domain` (TXS-05), et ses use cases vivent dans `application`, un service par concept et une méthode par use case (TXS-01). Voir [Transaction scripts](../rules/domain-logic/transaction-scripts/) et [choisir un style](../rules/domain-logic/choosing-a-style).

## Pour aller plus loin {#details}

| Question | Où |
| --- | --- |
| Où va chaque fichier, l’arborescence complète d’une application | [Ce qui va où](../rules/architecture-and-placement/placement/) (PLC) |
| Les rôles de fichiers que chaque couche accepte | [Ce qui va où](../rules/architecture-and-placement/placement/) (PLC-03) |
| Comment nommer un fichier et un type | [Nommage et rôles de fichiers](../rules/architecture-and-placement/naming/) (NAM) |
| Ce que fait une command, une query, ce qu’un écran lit | [Use cases](../rules/architecture-and-placement/use-cases/) (UC-01, UC-08 à UC-10) |
| Comment assembler un contexte avec NestJS | [Wiring](../rules/architecture-and-placement/wiring/) (WIR) |
| Où placer les tests | [Écrire un test](../rules/testing/writing-tests/) (TST), et la partie [Tests](../rules/testing/) |
| Les choix qu’Alveolus fait par défaut | [Choix par défaut](./default-choices) |
| Les building blocks | [Outillage](./prerequisites#tooling) |
