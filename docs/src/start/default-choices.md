# Choix par défaut

Plusieurs décisions appartiennent à l’équipe. Alveolus en prend une par défaut, marquée **Notre choix** dans la section Adaptation des règles concernées. Les exemples de code suivent ces choix. Un projet peut s’en écarter par une ADR (voir les [prérequis du projet](./prerequisites#decisions-adr)).

| Choix | Règles qui le portent |
| --- | --- |
| Un style par bounded context, déclaré dans `architecture.json` : modèle tactique pour les core subdomains, transaction scripts pour les supporting et generic | CTX-14, TXS-05, TXS-08 |
| Les transaction scripts utilisent Prisma directement, à travers le client du Unit of Work | TXS-06, TXS-07 |
| Les refus métier en `Result<T, E>`, les exceptions réservées aux pannes | AGG-01, UC-02, UC-08, UC-07, ENT-15, ENT-16, REP-03, TXS-04 |
| Un refus devient un statut HTTP par son `type`, sans importer le domaine | UC-02, UC-07, API-01 |
| Le Unit of Work dans `application`, la transaction portée par `AsyncLocalStorage` | REP-13, REP-14 |
| Outbox et forwarder interne, pas de broker au départ | AGG-08, MSG-01, MSG-03, MSG-07 |
| Une classe par identité (`UuidIdentifier`), l’identité suivante donnée par le repository, des UUIDv7 générés dans `driven` | ENT-03, ENT-05, ENT-08 |
| PostgreSQL et Prisma, les modèles Prisma séparés du domaine | LAY-01, AGG-15, REP-02, REP-05, REP-07, REP-08, VO-11 |
| Aucune suppression en cascade dans la base : le repository supprime les parties, puis l’aggregate root, dans la transaction | REP-02 |
| Pas de test double in-memory : les tests d’application et d’adapter sur un PostgreSQL jetable (Testcontainers) | TST-01, REP-16 |
| Les command handlers sur les aggregates, les query handlers sur les views, mêmes tables | UC-01, UC-08 |
| `domain` et `application` par concept, `driving` et `driven` par technologie ; le suffixe du fichier nomme le rôle, le type garde son nom métier | PLC-04, NAM-01, NAM-05, ACL-01 |
| Pas de CQRS ni d’event sourcing au départ | CTX-16 |
| Le comportement dans des classes : aggregate, value object, puis domain service ; des fonctions libres seulement dans les fichiers de wiring | SRV-01 |
| Des classes simples construites par le module avec `construct`, aucun décorateur NestJS hors de `driving/http` et des modules | WIR-05 |
| Les tests démarrent les vrais modules, sans port remplacé | TST-03 |
| Un schéma PostgreSQL par bounded context ; les montants en `BigInt` d’unités mineures, les statuts en enums Prisma, reflétés dans le domaine par une union de littéraux | PER-01, PER-02, VO-08 |
| Un message publié porte sa `version`, un fichier par version dans `public`, les deux versions publiées pendant la migration | PUB-04 |
| Les mappers étendent `RowMapper` : une ligne corrompue lève une erreur à la lecture | PER-04 |
| Le waiver signalé par un commentaire, avec une ADR s’il est structurel | [Waivers](./overview#waivers) |
