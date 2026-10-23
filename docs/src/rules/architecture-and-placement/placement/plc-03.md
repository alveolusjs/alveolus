---
code: PLC-03
title: Chaque fichier va dans la couche de son rôle
group: Les couches
scope: [structure]
style: [tactical, transaction-script]
severity: major
review: approved
sources: []
---

# PLC-03 · Chaque fichier va dans la couche de son rôle

<RuleMeta />

## Signal

- `domain/wallet/wallet.controller.ts`, `application/wallet/wallet.mapper.ts`, `driving/http/wallet.aggregate.ts`.
- Un `.service` ou un `.value-object` dans l’`application` d’un bounded context tactique.
- `src/wallets/wallet.aggregate.ts`, hors de toute couche.

## Pourquoi

Le rôle dit ce que fait un fichier, la couche dit ce dont il peut dépendre (LAY-01). Un controller dans le domaine, un mapper dans l’application ou un aggregate dans un adapter est une règle de dépendance qui attend d’être enfreinte : le fichier importera ce dont son rôle a besoin, et sa couche le lui interdit. Associer chaque rôle à ses couches rend l’erreur de placement visible dès le nom, avant qu’elle n’apparaisse dans les imports.

## Exceptions

Les rôles de wiring (`.module`, `.wiring`, `.bootstrap`, `.config`) vont partout : ils assemblent ce qui vit autour d’eux.

## Correction

Déplacer le fichier dans la couche de son rôle, ou le renommer d’après le rôle qu’il joue vraiment.

| Couche | Rôles |
| --- | --- |
| `domain` | `.aggregate`, `.entity`, `.value-object`, `.id`, `.events`, `.errors`, `.repository`, `.port`, `.service`, `.factory`, `.policy`, `.specification` |
| `application` | `.command`, `.query`, `.view`, `.port` ; dans un bounded context en transaction scripts, `.service`, `.errors` et `.value-object` |
| `driven` | `.repository`, `.adapter`, `.mapper`, `.translator`, `.client` |
| `driving` | `.controller`, `.listener`, `.consumer`, `.relay`, `.scheduler`, `.cli`, `.adapter`, `.request`, `.representation`, `.parser`, `.http`, `.filter`, `.pipe`, `.guard` |
| `public` | `.facade`, `.dto`, `.integration-events`, `.contract` |
| toutes | `.module`, `.wiring`, `.bootstrap`, `.config` |

## Voir aussi

NAM-01 fait finir chaque fichier par son rôle, pris dans cette liste. PLC-04 à PLC-09 découpent chaque couche. TXS-05 donne les couches d’un bounded context en transaction scripts.
