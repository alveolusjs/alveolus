---
menu: Vue d’ensemble
---

# Conception stratégique

Avant de modéliser, on décide où un modèle s’applique. Toutes les autres parties le supposent : le modèle vit dans un bounded context, l’architecture découpe le code par bounded context, l’intégration relie des frontières déjà claires.

## Pourquoi c’est essentiel pour faire évoluer un projet {#why-it-matters}

Un projet grandit : de nouveaux besoins, de nouvelles équipes, de nouveaux partenaires. Sans frontières, chaque ajout touche tout le reste.

- **Un changement reste local.** Payment revoit l’exécution d’un paiement sans toucher au Ledger, tant que leur contrat tient.
- **Les mots gardent leur sens.** « Compte » n’a pas à servir à la fois la relation client et la comptabilité.
- **Les équipes avancent sans s’attendre.** Chacune a son bounded context, et sait qui prévenir quand un contrat change.
- **L’effort va où il compte.** Le core reçoit le modèle le plus soigné, le supporting et le generic restent simples ou s’achètent.
- **Les choix restent réversibles.** Un bounded context bien délimité se remplace, se découpe ou se déploie à part.

Sans conception stratégique, on obtient un big ball of mud : tout dépend de tout, et chaque évolution coûte plus cher que la précédente.

## Idées clés {#key-ideas}

### Problème et solution {#problem-and-solution}

|  | Problem space | Solution space |
| --- | --- | --- |
| Qui s’en charge | Le produit | La tech |
| Son unité | Le subdomain : une part de l’activité | Le bounded context : la frontière d’un modèle et de son langage |
| Ses variantes | Core, supporting, generic | Tactique, transaction scripts |

- Un subdomain **core** distingue l’entreprise. **Supporting**, il lui est propre mais simple. **Generic**, il est le même partout, et souvent acheté.
- Dans un bounded context, chaque terme a un seul sens : c’est son **ubiquitous language**, écrit dans son glossaire et repris dans le code.
- Idéalement, un bounded context par subdomain, et son style suit le subdomain : tactique pour le core, transaction scripts ailleurs. Voir [choisir un style](../domain-logic/choosing-a-style).

### Context map {#context-map}

Les relations déclarées entre bounded contexts. Dans chacune, l’un est **upstream** : l’autre dépend de lui et suit ses changements. L’autre est **downstream** : son pattern dit s’il se plie à ces changements ou s’en protège. Le sens est celui de l’influence, pas celui des données.

| Pattern | Côté | Ce qu’il signifie |
| --- | --- | --- |
| Open host service (OHS) | Upstream | Un seul protocole, pensé pour tous les consumers |
| Published language (PL) | Upstream | Un contrat documenté, distinct du modèle interne |
| Anticorruption layer (ACL) | Downstream | Une traduction qui tient le modèle étranger à l’écart |
| Conformist (CF) | Downstream | Le modèle upstream repris tel quel |
| Shared kernel (SK) | Les deux | Un petit modèle que les deux équipes possèdent |

Le détail de chaque pattern : partie [intégration](../integration/).

## L’exemple, vu de haut {#the-example-from-above}

Un établissement de paiement, découpé en cinq bounded contexts. À l’extérieur, le CSM achemine les paiements entre prestataires de services de paiement. Sur chaque relation, `U` marque le côté upstream, `D` le côté downstream.

![Context map de l’exemple : Customer, Compliance, Ledger et le CSM sont upstream de Payment, Customer de Compliance, Ledger de Safeguarding](./context-map/generated/payment-services_ContextMap.svg)

| Bounded context | Subdomain | Style | Ce qu’il possède |
| --- | --- | --- | --- |
| Payment | Core | Tactique | Les paiements, de l’ordre à leur exécution |
| Ledger | Core | Tactique | Les comptes et les écritures équilibrées |
| Customer | Supporting | Transaction scripts | Les clients et la façon de les joindre |
| Safeguarding | Supporting | Transaction scripts | La protection des fonds des clients |
| Compliance | Core | Tactique | Le filtrage des clients et des paiements |
| CSM | Generic | Système externe | La compensation et le règlement entre prestataires de services de paiement |

Le détail : le même mot avec deux sens dans [bounded contexts](./bounded-contexts/#in-practice), chaque relation expliquée dans [context maps](./context-maps/#in-practice).

## En revue de code {#reviewing-a-change}

1. Chaque fichier modifié reste-t-il dans son bounded context, sans concept d’un autre subdomain ? (CTX-01, CTX-04)
2. Chaque terme garde-t-il le sens de son glossaire ? (CTX-02, CTX-03)
3. Un import, un appel ou un message franchit une frontière ? La context map le déclare (MAP-01), et aucune table n’est partagée (MAP-02).
4. Les données venues de l’extérieur sont-elles traduites en un concept local ? (CTX-05, CTX-06)
5. L’effort suit-il le subdomain : tactique pour le core, transaction scripts ailleurs ? (CTX-13, CTX-14)

::: tip Ce dont cette partie a besoin
Ces règles jugent le code par rapport à ce que le projet a déclaré : une **context map**, un **glossaire** par bounded context, la **déclaration des styles** et un fichier **CODEOWNERS**. Sans eux, une règle ne conclut pas à un défaut : elle pose une question. Voir [mettre en place un projet](../../start/prerequisites).
:::

## Thèmes {#themes}

<ThemeTable part="strategic-design" />
