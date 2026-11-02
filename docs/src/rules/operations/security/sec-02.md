---
code: SEC-02
title: L’identité de l’appelant vient de l’authentification, jamais de la requête
group: Identité
scope: [driving, application]
style: [tactical, transaction-script]
kind: safeguard
severity: blocking
detection: []
review: approved
sources: []
---

# SEC-02 · L’identité de l’appelant vient de l’authentification, jamais de la requête

<RuleMeta />

## Signal

`body.customerId`, un paramètre de l’URL ou un en-tête `X-Customer-Id`, pris pour l’identité de l’appelant.

## Pourquoi

Tout ce que porte la requête, le client le choisit : seule l’authentification dit qui appelle. Un client qui change un identifiant dans sa requête agit alors au nom d’un autre.

## Exceptions

Aucune.

## Correction

Un guard vérifie le token. L’adapter driving en tire un concept local, `Caller` : son identité et ses rôles. Aucun identifiant de la requête ne le remplace.

## Voir aussi

UC-13 fait porter l’appelant par la command. UC-06 vérifie l’autorisation dans chaque use case. CTX-05 construit un concept local à partir d’un autre bounded context.
