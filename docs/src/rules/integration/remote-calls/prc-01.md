---
code: PRC-01
title: Un appel distant n’est pas un appel local
group: Appels distants
scope: [driven]
style: [tactical, transaction-script]
severity: major
review: approved
sources:
  - "Integration Basics"
  - "Distributed Systems Are Fundamentally Different"
---

# PRC-01 · Un appel distant n’est pas un appel local

<RuleMeta />

## Signal

- Un client HTTP ou RPC vers un autre bounded context ou un partenaire, sans timeout.
- Des appels distants dans une boucle, un par élément, là où un seul échange suffirait.
- Un retry immédiat, sans limite.
- Une URL d’hôte écrite en dur.
- Un appel interne sans authentification ni chiffrement, au motif qu’il reste dans le réseau privé.

## Pourquoi

Beaucoup de problèmes d’intégration viennent d’un appel distant traité comme un appel local. Une seule panne, même courte, peut alors se propager en cascade.

Il faut partir de ces faits :

- le réseau n’est pas fiable ;
- la latence existe ;
- la bande passante est limitée ;
- le réseau n’est pas sûr ;
- la topologie change ;
- l’administration est répartie ;
- le transport a un coût ;
- le réseau est hétérogène.

C’est aussi la faiblesse du RPC : si le service appelé tombe, ses clients tombent avec lui.

## Exceptions

Aucune.

## Correction

- Un timeout explicite sur chaque client.
- Des retries limités, avec un back-off exponentiel plafonné.
- Un seul échange groupé plutôt qu’un appel par élément.
- L’hôte dans la configuration (WIR-11).

## Adaptation

`fetch` n’a aucun timeout par défaut : `AbortSignal.timeout()` en pose un. Avec `@nestjs/axios`, le timeout d’axios vaut 0 par défaut, c’est-à-dire aucun.

## Voir aussi

PRC-02 se demande s’il faut appeler. PRC-01 dit comment faire l’appel quand il reste nécessaire.
