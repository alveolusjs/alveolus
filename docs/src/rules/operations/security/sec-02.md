---
code: SEC-02
title: L’identité de l’appelant vient de l’authentification, jamais de la requête
group: Identité
scope: [driving, application]
style: [tactical, transaction-script]
severity: blocking
detection: []
review: approved
sources: []
---

# SEC-02 · L’identité de l’appelant vient de l’authentification, jamais de la requête

<RuleMeta />

## Signal

- `body.customerId`, ou un en-tête `X-Customer-Id`, pris pour l’identité de l’appelant.
- Le token, ou son contenu brut, passé au use case.
- Un use case qui lit l’utilisateur courant dans un état global.

## Pourquoi

Tout ce que porte la requête, le client le choisit : seule l’authentification dit qui appelle. Passé dans la command, l’appelant se teste, et vaut pour chaque point d’entrée : HTTP, consumer ou job (UC-06).

## Exceptions

Aucune.

## Correction

- Un guard vérifie le token. L’adapter driving en tire un concept local, `Caller` : son identité et ses rôles.
- La command porte l’appelant, et le use case vérifie ses droits (UC-06).
- Un consumer ou un job passe un appelant système, nommé.

## Voir aussi

UC-06 vérifie l’autorisation dans chaque use case. CTX-05 construit un concept local à partir d’un autre bounded context.
