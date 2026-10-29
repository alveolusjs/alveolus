---
code: SEC-03
title: Un secret ne sort jamais de la configuration
group: Secrets et données personnelles
scope: [structure, driving, driven]
style: [tactical, transaction-script]
severity: blocking
detection: []
review: approved
sources: []
---

# SEC-03 · Un secret ne sort jamais de la configuration

<RuleMeta />

## Signal

- Une clé d’API, un mot de passe ou un token dans le code, un fichier commité ou un test.
- Une configuration loguée en entier au démarrage.
- Un en-tête `Authorization` dans un log de requête, ou dans une erreur renvoyée.
- Un secret dans un message publié, ou dans l’outbox.

## Pourquoi

Un secret commité reste dans l’historique de Git, même supprimé. Un log ou un message part vers des systèmes que d’autres lisent. Une fuite oblige à changer le secret partout, dans l’urgence.

## Exceptions

Aucune.

## Correction

- Le secret vient de l’environnement ou d’un coffre, lu par le fichier de configuration (WIR-11).
- Le logger masque les champs sensibles (`authorization`, `password`, `token`) avant d’écrire.
- Les identifiants d’une sandbox sont des variables masquées de la CI (INF-05).
- Un secret commité par erreur se révoque, puis se remplace : le retirer du dépôt ne suffit pas.

## Voir aussi

WIR-11 lit la configuration à un seul endroit. SEC-04 garde les données personnelles de la même façon.
