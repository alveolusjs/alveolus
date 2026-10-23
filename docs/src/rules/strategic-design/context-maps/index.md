---
menu: Vue d’ensemble
---

# Context maps

Une context map indique, pour chaque paire de bounded contexts, lequel est upstream, lequel est downstream, et le pattern de chaque côté : anticorruption layer, open host service, published language, conformist, shared kernel… Ces règles vérifient que le code suit ce que la context map déclare, et gardent les relations particulières sous contrôle. Voir [mettre en place un projet](../../../start/prerequisites#context-map).

La construction de chaque pattern est le sujet de la partie intégration : contrats, traduction, messages et appels distants.

## En pratique {#in-practice}

La context map des services d’un établissement de paiement, écrite en CML :

<<< @/rules/strategic-design/context-map/payment-services.cml{txt}

Context Mapper la valide et la dessine :

![Context map de l’exemple, dessinée par Context Mapper](../context-map/generated/payment-services_ContextMap.svg)

| Relation | Ce qu’elle signifie |
| --- | --- |
| Ledger → Payment | Payment demande au Ledger de passer les écritures de ses paiements, par l’open host service du Ledger, et traduit ses réponses. |
| Customer → Payment | Payment a besoin de connaître le client qui paie. |
| Compliance → Payment | Payment demande si un paiement peut partir. |
| CSM → Payment | Le CSM impose son format de message, et Payment le traduit en un seul endroit. |
| Customer → Compliance | Compliance utilise les données client telles que Customer les publie. |
| Ledger → Safeguarding | Safeguarding utilise les soldes tels que le Ledger les publie. |

- Le code met en œuvre ces relations, et aucune autre (MAP-01).
- Aucune table n’est partagée : chaque bounded context ne lit et n’écrit que les siennes (MAP-02).

## Règles {#rules}

<RuleTable />
