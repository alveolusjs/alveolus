---
code: SEC-04
title: Une donnée personnelle ne va que là où elle sert
group: Secrets et données personnelles
scope: [application, driving, driven, public]
style: [tactical, transaction-script]
severity: major
severityNote: Bloquante quand elle sort de l’application, dans un event publié ou vers un système tiers.
detection: []
review: approved
sources: []
---

# SEC-04 · Une donnée personnelle ne va que là où elle sert

<RuleMeta />

## Signal

- Un email, un nom ou une adresse dans un log.
- Un event publié qui porte le profil du client, quand ses consumers n’en lisent que l’identité.
- Une donnée personnelle dans une URL, ou dans le message d’une erreur renvoyée.

## Pourquoi

Chaque copie d’une donnée personnelle est une copie de plus à protéger, à purger, et à retrouver le jour d’une demande d’effacement. La plus sûre est celle que l’on n’a pas copiée.

## Exceptions

Aucune.

## Correction

- Un log porte des identités, pas les données qu’elles désignent.
- Un event publié ne porte que ce que ses consumers lisent (PUB-05), le plus souvent une identité.
- Aucune donnée personnelle dans une URL : elle finit dans les logs des proxies.
- La durée de conservation se décide avec la conformité, pas dans le code (REP-06).

## Voir aussi

SEC-03 garde les secrets. PUB-01 sépare le contrat publié du modèle interne.
