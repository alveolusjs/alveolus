# Mettre en place un projet

Un projet qui suit ces règles déclare quatre artefacts, que certaines règles lisent, et installe les building blocks.

## Artefacts du projet {#artifacts}

La plupart des règles se jugent sur le code seul. Certaines dépendent de ce que le projet a **déclaré** : quels contextes existent et comment ils se parlent, quels mots sont permis, quelles décisions ont été prises.

| Artefact | Emplacement suggéré | Règles qui en dépendent |
| --- | --- | --- |
| [Context map](#context-map) | `docs/context-map.md` | CTX-01, CTX-13, CTX-04, CTX-07, CTX-11, MAP-01, MAP-02, MAP-03, MAP-04, PRC-04, REP-06 |
| [Glossaire](#glossary) | `docs/<context>/glossary.md` | ENT-11, CTX-03, PLC-05, CTX-02, CTX-08, CTX-09 |
| [Décisions (ADR)](#decisions-adr) | `docs/adr/NNNN-title.md` | Toutes les règles conditionnelles, AGG-10, CTX-16, CTX-13, et les waivers structurels |
| [Propriété du code](#code-ownership) | `CODEOWNERS` | CTX-12, MAP-03 |

Dans un monorepo, `docs/` peut se trouver à côté de chaque application. L’essentiel est qu’on les trouve sans chercher, et qu’ils changent dans la même MR que le code qu’ils décrivent.

::: tip Sans ces artefacts
Une règle qui dépend d’un artefact absent ne peut pas conclure à un défaut. Elle devient une **question**, et la revue signale l’artefact manquant dans son résumé.
:::

### Context map {#context-map}

Elle déclare les contextes et leurs relations. Sa forme la plus détaillée est le code d’intégration lui-même : la carte dit ce que ce code doit respecter (MAP-01).

Pour chaque contexte :

- le **nom**, tel que le langage le dit ;
- le **type de subdomain** : core, supporting ou generic (CTX-13) ;
- l’**équipe** propriétaire (CTX-12) ;
- le **dossier** du code ;
- les **tables** qu’il possède, que personne d’autre ne lit (MAP-02) ;
- les **aggregates conservés**, jamais supprimés physiquement (REP-06).

Pour chaque relation entre deux contextes :

- lequel est **upstream**, lequel est **downstream** ;
- le **pattern** de chaque côté : open host service, published language, anticorruption layer, conformist, customer-supplier, partnership, shared kernel ou separate ways ;
- le **mode d’intégration** : appel dans le processus, HTTP, messages ;
- le **contrat publié**, c’est-à-dire le dossier `public` ou le schéma qui le décrit (PUB-01).

Enfin, les zones déclarées **big ball of mud** (MAP-04), qu’`architecture.json` déclare aussi (CTX-14), et les **shared kernels** avec leurs deux équipes (MAP-03).

```md
## Contextes

| Contexte | Subdomain | Équipe | Dossier | Tables | Aggregates conservés |
| --- | --- | --- | --- | --- | --- |
| Payments | core | Équipe Payments | src/payments | transfer, transfer_leg | Transfer |
| Treasury | supporting | Équipe Treasury | src/treasury | wallet, funding | Wallet |

## Relations

| Upstream | Downstream | Côté upstream | Côté downstream | Intégration | Contrat |
| --- | --- | --- | --- | --- | --- |
| Treasury | Payments | Open host service, published language | Anticorruption layer | Appel dans le processus | src/treasury/public |
| Payments | Treasury | Published language | Conformist | Messages (outbox) | src/payments/public/transfer-executed.v1.ts |
```

### Glossaire {#glossary}

Un glossaire **par contexte** : le langage n’est pas universel (CTX-01). Il relie le langage de l’équipe au code, et liste les termes à ne pas employer.

| Colonne | Contenu |
| --- | --- |
| Terme | Le mot tel que l’équipe le dit. |
| Code | Le nom dans le code (classe, méthode, event). |
| Définition | Une phrase, validée avec les experts métier. |
| Termes rejetés | Les synonymes ou anciens noms à ne pas employer dans ce contexte (CTX-03). |

```md
| Terme | Code | Définition | Termes rejetés |
| --- | --- | --- | --- |
| Virement | `Transfer` | Un ordre de transférer un montant d’un wallet vers un bénéficiaire. | Paiement, transaction |
| Exécuter | `execute()` | Débiter le wallet et envoyer le virement. | Traiter, gérer |
```

Un glossaire vieillit : un terme absent n’est pas forcément une erreur, c’est une question (CTX-03).

### Décisions (ADR) {#decisions-adr}

Une décision d’architecture par fichier, numérotée et jamais réécrite : une nouvelle ADR la remplace et la marque « superseded ». Format court : contexte, décision, conséquences, règles concernées.

Une ADR est attendue pour :

- **activer une règle conditionnelle** : multi-tenant (ENT-09) ;
- **s’écarter d’un [choix par défaut](./default-choices)** d’Alveolus ;
- **trancher une question** que posent les règles : cohérence dans la transaction ou eventual consistency (AGG-10), style structurel (CTX-16), investissement tactique (CTX-13) ;
- **appuyer un waiver structurel**, cité par le commentaire du waiver (voir les [waivers](./overview#waivers)).

### Propriété du code {#code-ownership}

Un fichier `CODEOWNERS` attribue chaque dossier de contexte à une seule équipe (CTX-12). Un dossier de shared kernel demande l’approbation des deux équipes qui le partagent (MAP-03). On le déclare par une ligne de commentaire juste au-dessus de son entrée :

```
# shared kernel: money, owned by payments and treasury (MAP-03)
/src/money/ @bank/payments @bank/treasury
```

## Outillage {#tooling}

Les building blocks sont livrés dans un package, réutilisable d’un projet à l’autre.

| Package | Contenu |
| --- | --- |
| `@alveolus/core` | `AggregateRoot`, `Entity`, `ValueObject`, `Identifier`, `DomainEvent`, `DomainError`, les ports (`Clock`, `IdGenerator`), les repositories, `CommandHandler` et `QueryHandler`, `UnitOfWork`, `Outbox` et `OutboxRelay`, `Result`. Aucune dépendance à l’exécution. |
