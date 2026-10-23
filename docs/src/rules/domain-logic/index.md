---
menu: Vue d’ensemble
---

# Logique du domaine

Dans un bounded context, les règles métier ont besoin d’un lieu. Cette partie en propose deux. Chaque bounded context choisit le sien, et le déclare une fois (CTX-14) :

| Style | Pour | Forme |
| --- | --- | --- |
| **Transaction scripts** | Les subdomains supporting et generic, où la logique est mince | Une procédure par use case : charger, vérifier, écrire, répondre, dans une transaction |
| **Modèle tactique** | Les subdomains core, où les règles sont riches et changent souvent | Aggregates, entities, value objects et domain events gardent les invariants ; les repositories les chargent et les enregistrent |

Une règle propre à un seul style porte son badge. Les autres règles valent pour les deux. Pour décider, voir [choisir un style](./choosing-a-style).

<StyleLegend />

## Transaction scripts {#transaction-scripts}

<ThemeTable part="domain-logic" with-style="transaction-script" />

## Modèle tactique {#tactical-model}

<ThemeTable part="domain-logic" with-style="tactical" />
