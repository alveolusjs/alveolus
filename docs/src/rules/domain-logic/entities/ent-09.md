---
code: ENT-09
title: En multi-tenant, chaque entity et chaque requête portent l’identité du tenant
group: Identité
scope: [domain, driven]
style: [tactical]
context: Seulement si le système est multi-tenant.
severity: blocking
severityNote: Bloquante pour une requête sans filtre sur le tenant. Majeure sinon.
detection: []
review: approved
sources:
  - "Uncovering Entities and Properties"
  - "When the Timing of Identity Generation Matters (User equality)"
---

# ENT-09 · En multi-tenant, chaque entity et chaque requête portent l’identité du tenant

<RuleMeta />

## Signal

- Une entity qui appartient à un tenant mais ne porte pas son identité.
- Une requête de repository qui ne filtre pas par tenant.
- Une égalité d’entities qui ignore le tenant.

## Pourquoi

Quand les clients sont des entreprises concurrentes sur la même plateforme, chaque entity, dans chaque bounded context, porte l’identité du tenant. Chaque requête en a besoin pour trouver une entity.

Le tenant fait partie de l’identité : deux wallets de tenants différents ne sont jamais égaux.

## Exceptions

Les objets réellement partagés entre tenants, et déclarés comme tels.

## Correction

Un `TenantId` typé sur chaque entity concernée, et en paramètre obligatoire de chaque méthode de repository.
