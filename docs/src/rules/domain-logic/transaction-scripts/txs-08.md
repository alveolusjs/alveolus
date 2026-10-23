---
code: TXS-08
title: Quand les règles se répètent, passer le bounded context au style tactique
group: Quand changer de style
scope: [structure, application]
style: [transaction-script]
severity: question
review: approved
sources: []
---

# TXS-08 · Quand les règles se répètent, passer le bounded context au style tactique

<RuleMeta />

## Signal

- La même condition métier, comme « on ne renonce qu’à des frais en attente », copiée dans plusieurs scripts.
- Un invariant qui s’étend sur plusieurs scripts : chacun doit penser à le respecter.
- Des scripts qui bifurquent encore et encore sur le même champ de statut.
- Le subdomain a été reclassé core dans la context map.

## Pourquoi

Les transaction scripts ne restent bon marché que tant que chaque use case tient seul. Dès que les règles se répètent, chaque nouveau script est une occasion d’en oublier une, et le bounded context paie le coût d’un modèle sans en avoir un.

## Exceptions

Une lecture partagée par deux scripts du même application service est une méthode privée `#` de cet application service (TXS-02). La question se pose quand la répétition devient la norme, ou passe d’un application service à l’autre.

## Correction

Consigner la décision dans une ADR, changer le style du bounded context dans `architecture.json` (CTX-14), et migrer le bounded context en entier : des aggregates dans `domain`, des repositories derrière des ports, Prisma dans `driven/prisma`. Les fitness functions vérifient alors l’organisation tactique.

Ne pas mélanger les deux styles sur la branche principale : la migration tient dans une seule merge request, qui change aussi la déclaration. Un bounded context en transaction scripts est petit par nature, et une migration tardive coûte cher : c’est pourquoi la question se pose dès que les règles commencent à se répéter, pas quand elles sont partout.

## Voir aussi

CTX-13 : l’investissement tactique suit la complexité du domaine.
