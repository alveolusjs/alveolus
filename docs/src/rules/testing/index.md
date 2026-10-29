---
menu: Vue d’ensemble
---

# Tests

Un test qui passe doit vouloir dire que le code marche. Cette partie répond à trois questions :

- Comment écrire un test, le ranger, et croire son résultat ? (TST)
- Sur quoi tourne-t-il : quelle base, quels systèmes tiers ? (INF)
- Que doivent prouver les tests ? (COV)

## Trois niveaux {#three-levels}

| Niveau | Ce qu’il prouve | Fichier | Infrastructure |
| --- | --- | --- | --- |
| Unitaire | Le domaine : chaque invariant, chaque refus, chaque calcul | `*.spec.ts` | Aucune |
| Intégration | Un adapter, sur sa vraie infrastructure | `*.integration-spec.ts` | La base jetable, ou les stubs du système tiers |
| End-to-end | Un use case, et les règles que le domaine ne tient pas seul, de l’entrée de l’application à la base | `*.e2e-spec.ts` | L’application démarrée depuis `AppModule`, la base jetable |

Les tests propres à un building block restent dans son thème : VO-09 pour les value objects, SRV-08 pour les domain services, REP-16 pour les repositories.

## En revue de code {#reviewing-a-change}

1. Les tests tournent-ils sur le vrai adapter, depuis les vrais modules ? (TST-01, TST-03)
2. Chaque test suit-il Arrange, Act, Assert, avec une seule action ? (TST-04)
3. Le test est-il à côté de ce qu’il prouve, et son nom dit-il son niveau ? (TST-05, TST-06)
4. Le test dépend-il de l’heure, d’une identité générée, d’une attente ou d’un autre test ? Est-il désactivé, isolé ou relancé ? (TST-07, TST-08)
5. Un système tiers est-il simulé depuis son contrat figé, et ses parcours critiques et ses pannes ont-ils leurs stubs ? (INF-03, INF-04)
6. Chaque nouvelle branche du domaine a-t-elle son test unitaire ? (COV-01)
7. Une nouvelle règle métier a-t-elle sa preuve, au plus bas niveau qui la tient, avec ce qu’elle accepte et ce à quoi elle résiste ? (COV-02)
8. Les events publiés sont-ils vérifiés, et un refus n’en publie-t-il aucun ? (COV-03)

::: tip Ce dont cette partie a besoin
- **Vitest**, avec un projet pour les tests unitaires et un pour les tests sur base, et la couverture du domaine en CI (COV-01).
- **Docker**, pour que Testcontainers démarre la base jetable, en local comme en CI (INF-01).
- Le **contrat OpenAPI** de chaque système tiers, figé et commité (INF-03).
- Les **migrations commitées**, qui construisent la base de test comme celle de la production (PER-10).
:::

## Thèmes {#themes}

<ThemeTable part="testing" />
