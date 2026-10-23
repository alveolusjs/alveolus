---
code: PUB-02
title: Le consumer reçoit des données, pas le comportement du producer
group: Published language
scope: [driving, public]
style: [tactical, transaction-script]
severity: major
review: approved
sources:
  - "Exchanging Information across System Boundaries"
---

# PUB-02 · Le consumer reçoit des données, pas le comportement du producer

<RuleMeta />

## Signal

- Un bounded context qui importe les classes d’event ou de représentation d’un autre, avec leurs méthodes, pour s’en servir chez lui.
- Un consumer qui appelle une méthode de ces classes.
- Un consumer qui refait un calcul du producer à partir des données brutes de l’event : des frais, un taux appliqué, un solde.

## Pourquoi

Des classes partagées se déploient partout, et chaque consumer se reconstruit à chaque version. Pire, le consumer se sert des objets de l’autre bounded context comme des siens : la frontière entre les deux disparaît. Appeler ce partage un shared kernel ne le rend pas plus sûr.

Un contrat en published language remplace ces classes. Le consumer le lit sans les classes du producer. Il ne reçoit que des données, et rien ne le pousse à utiliser le comportement d’un autre modèle.

Les adapters du consumer passent ces données au domaine en types locaux. Si un calcul est nécessaire, le producer le fait, et publie le résultat dans l’event.

## Exceptions

Aucune. Le typage fort ne justifie pas de partager des classes : les interfaces de `public` le donnent, sans comportement.

## Correction

Le producer publie le résultat de ses calculs. Le consumer lit les champs dont il a besoin, et les traduit en concepts locaux.

## Adaptation

En TypeScript, `public` n’exporte que des types et des constantes : des interfaces, sans classe ni méthode. Le consumer garde le typage sans recevoir de comportement. Quand les deux bounded contexts vivent dans des dépôts différents, un package de types généré depuis le schéma du contrat joue le même rôle.

## Voir aussi

CTX-01 pour l’import de classes d’un autre bounded context. PUB-01 pour le published language. EVT-05 pour un event assez riche pour agir.
