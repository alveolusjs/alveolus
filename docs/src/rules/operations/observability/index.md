---
menu: Vue d’ensemble
---

# Observabilité

Une panne se voit chez le client, une autre jamais : un forwarder arrêté ne fait échouer aucune requête. Ces règles rendent visible ce que fait l’application : des logs que l’on peut filtrer, une opération que l’on suit de la requête au consumer, une santé que l’orchestrateur et l’équipe peuvent lire.

## En pratique {#in-practice}

Un débit refusé, logué par le handler :

```ts
const debited = wallet.debit(command.reference, amount, cashOut, now);

if (!debited.ok) {
	this.#logger.log({ event: 'wallet.debit.refused', walletId: command.walletId, reason: debited.error.type });

	return debited;
}
```

- Un message fixe, et les valeurs dans des champs : le log se filtre par `event` ou par `walletId` (OBS-01).
- C’est le handler qui logue, pas le wallet : le domaine renvoie un refus, sans logger (OBS-01).
- Un refus métier est une issue prévue : il se logue au niveau normal, jamais en `error` (OBS-02).
- Le logger ajoute de lui-même l’identifiant de corrélation de l’opération (OBS-03).

## Règles {#rules}

<RuleTable />
