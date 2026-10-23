---
menu: Vue d’ensemble
---

# Bounded contexts

Un bounded context donne à chaque terme un sens précis. Ces règles vérifient que le code respecte cette frontière :

- un langage par bounded context ;
- aucun concept étranger dans le modèle ;
- une traduction à chaque entrée ;
- une taille fixée par le langage ;
- un style d’implémentation qui suit la complexité du domaine.

Elles s’appuient sur la [context map](../../../start/prerequisites#context-map) : avant de juger un dossier, il faut savoir à quel bounded context il appartient. C’est pourquoi plusieurs d’entre elles concluent par une `question` plutôt que par un défaut.

## En pratique {#in-practice}

Dans les services d’un établissement de paiement, les mêmes mots changent de sens d’un bounded context à l’autre :

| Terme | Dans Customer | Dans Ledger |
| --- | --- | --- |
| Compte | La relation avec un client : qui il est, comment le joindre | Une ligne des livres comptables, débitée et créditée, avec un solde |
| Clôturer un compte | Mettre fin à la relation | Refuser toute nouvelle écriture sur cette ligne |

Chaque bounded context garde son propre modèle, et déclare comment il est construit :

```json
{
	"contexts": {
		"payment": "tactical",
		"ledger": "tactical",
		"customer": "transaction-script",
		"safeguarding": "transaction-script",
		"compliance": "tactical"
	}
}
```

- Un langage par bounded context : aucun n’emprunte le modèle de compte de l’autre (CTX-01, CTX-07).
- L’effort de modélisation suit la complexité de chaque bounded context (CTX-13), et ce choix est déclaré (CTX-14).

## Règles {#rules}

<RuleTable />
