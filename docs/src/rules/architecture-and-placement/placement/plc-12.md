---
code: PLC-12
title: Pendant un remplacement, l’ancien et le nouvel adapter implémentent le même port, côte à côte
group: Dans la durée
scope: [structure, driven, driving]
style: [tactical, transaction-script]
severity: minor
detection: []
review: approved
sources: []
---

# PLC-12 · Pendant un remplacement, l’ancien et le nouvel adapter implémentent le même port, côte à côte

<RuleMeta />

## Signal

- Un `if` sur la configuration, dans un use case ou dans un adapter, pour choisir entre l’ancien et le nouveau provider.
- Le nouvel adapter écrit en modifiant l’ancien, ou un port changé pour les besoins du nouveau.
- Un ancien adapter que plus aucun module ne lie, encore là des mois après la bascule.

## Pourquoi

On remplace rarement un provider ou une technologie d’un coup. L’ancien et le nouvel adapter cohabitent le temps de comparer, de basculer, et de revenir en arrière si besoin.

Derrière le même port, la bascule ne touche ni le domaine, ni les use cases : c’est le module qui lie l’un ou l’autre (WIR-01). Le retour en arrière est un changement de configuration. Une fois la bascule confirmée, l’ancien adapter n’est plus que du code mort : il garde ses dépendances et ses tests, et il trompe le lecteur qui cherche ce qui tourne.

## Exceptions

Un remplacement qui demande un autre port n’est plus un simple remplacement d’adapter : le port change d’abord, avec ses use cases, dans sa propre MR.

## Correction

```txt
src/wallets/driven/http/
├── <current-provider>/     l’adapter en place
└── <next-provider>/        son remplaçant, derrière le même port ExchangeRates
```

- Le module du bounded context lie l’un ou l’autre, d’après sa configuration (WIR-01, WIR-11).
- Les deux adapters passent les mêmes tests.
- Une fois la bascule confirmée, une MR retire l’ancien adapter, sa configuration et ses tests.

## Voir aussi

WIR-01 réserve au module le choix de l’implémentation. PLC-07 découpe les adapters par technologie. NAM-06 nomme l’adapter d’après sa technologie et ce qu’il adapte.
