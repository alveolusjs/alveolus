---
code: REP-01
title: Un repository par aggregate root, pas par entity ni par table
group: Contrat
scope: [domain, driven]
style: [tactical]
severity: major
detection: hybrid
detectionNote: Les repositories dont le type géré n’est pas un aggregate root.
review: approved
sources:
  - "Chapter introduction"
  - "Repository versus Data Access Object"
---

# REP-01 · Un repository par aggregate root, pas par entity ni par table

<RuleMeta />

## Signal

- Un repository pour une entity ou un value object interne à un aggregate (`WalletBlockRepository` à côté de `WalletRepository`).
- Un DAO ou un repository générique par table, avec un CRUD complet, dans un bounded context modélisé en aggregates.

## Pourquoi

Seuls les aggregates ont un repository. En règle générale, chaque type d’aggregate en a exactement un.

Un DAO travaille sur des tables et des opérations CRUD. Comme Table Data Gateway et Active Record, il appartient aux applications en transaction scripts. Il laisse le code lire et changer, au détail, des données qui appartiennent à un aggregate. L’éviter : l’aggregate gère ses propres parties et les cache au reste du code.

## Exceptions

- Un bounded context déclaré `transaction-script` (CTX-14). Un repository n’y sert à rien : ses scripts utilisent Prisma directement (TXS-06).
- Plusieurs types d’une même hiérarchie peuvent partager un repository (REP-15).

## Correction

Un repository par aggregate root. Les parties sont chargées et enregistrées avec l’aggregate root.

## Voir aussi

AGG-02 : les parties ne changent qu’à travers l’aggregate root.
