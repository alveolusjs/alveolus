---
code: FAC-01
title: Une création contrôlée passe par une factory method de l’aggregate qui la contrôle
group: Règles
scope: [domain, application]
style: [tactical]
severity: major
severityNote: Bloquante dans un système multi-tenant si le tenant du nouvel aggregate peut être faux.
detection: []
review: approved
sources:
  - "Factories in the Domain Model"
  - "Factory Method on Aggregate Root › Creating CalendarEntry Instances"
  - "Factory Method on Aggregate Root › Creating Discussion Instances"
---

# FAC-01 · Une création contrôlée passe par une factory method de l’aggregate qui la contrôle

<RuleMeta />

## Signal

- Un use case qui instancie lui-même un aggregate, en lui passant l’identité du tenant ou du parent (`new Wallet(walletId, holder.id, currency)`).
- Une règle de création qui appartient à un autre aggregate, mais vérifiée dans l’application (« un titulaire suspendu n’ouvre pas de wallet »).

## Pourquoi

Certaines données de construction doivent être protégées. Un aggregate créé sous le mauvais tenant, ou un wallet rattaché au mauvais titulaire, est une catastrophe.

Une factory method sur l’aggregate root fixe elle-même le tenant et les identités des associations. Elle applique aussi ses propres règles : `holder.openWallet()` refuse un titulaire fermé ou suspendu.

L’appelant ne passe que des paramètres simples, souvent des value objects, et moins que n’en demande le constructeur.

## Exceptions

Une création sans règle ni identité imposée. Un constructeur ou une factory method statique suffit alors.

Ce pattern a un coût : il faut d’abord charger l’aggregate qui crée. Mesurer ce coût à mesure que le trafic grandit.

## Correction

Une méthode de l’aggregate root qui contrôle la création et renvoie le nouvel aggregate.

## Voir aussi

ENT-14 réserve au wallet la création des écritures qui le débitent. ENT-09 traite du tenant. AGG-06 admet qu’un aggregate en crée un autre sans être modifié : la transaction ne modifie toujours qu’une instance.

## Exemple

```ts
// Avoid: the application checks the holder's rule and builds the wallet itself
if (holder.status === 'suspended') {
	return err(new HolderIsSuspended(holder.id));
}

const wallet = new Wallet(await this.#wallets.nextIdentity(), holder.id, currency.value);
```

```ts
// Preferred: the holder controls the creation
const wallet = holder.openWallet(await this.#wallets.nextIdentity(), currency.value, this.#clock.now());

if (!wallet.ok) {
	return wallet;
}

const saved = await this.#wallets.save(wallet.value);

if (!saved.ok) {
	return saved;
}

await this.#outbox.append(wallet.value.pullEvents());

return ok();
```

Dans le premier bloc, le use case oublie le titulaire fermé, et rien n’empêche un autre use case d’oublier aussi le titulaire suspendu.
