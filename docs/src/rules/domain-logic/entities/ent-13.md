---
code: ENT-13
title: Les secrets ne sortent pas de l’entity
group: Comportement
scope: [domain, driving]
style: [tactical]
severity: blocking
severityNote: Bloquante si le secret sort dans une API, un event ou un log. Majeure pour un getter.
detection: []
review: approved
sources:
  - "Digging for Essential Behavior (changePassword(), AuthenticationService)"
---

# ENT-13 · Les secrets ne sortent pas de l’entity

<RuleMeta />

## Signal

- Un getter qui expose un secret (code de confirmation, même sous forme d’empreinte ; token ; mot de passe).
- Un secret présent dans un DTO, un event ou un log.

## Pourquoi

Le code appelant n’a jamais accès au code de confirmation envoyé au titulaire, même sous forme d’empreinte. Une fois posé sur l’opération à confirmer, il ne franchit plus la frontière de l’aggregate. Toute vérification passe par un seul chemin : une méthode de l’entity.

## Exceptions

Aucune.

## Correction

Des méthodes métier sur l’entity. `withdrawal.confirm(digest, at)` compare l’empreinte du code reçu à celle qu’elle garde, et ne la rend jamais. Le calcul de l’empreinte passe par un service, avant que le code n’atteigne l’entity.

## Exemple

```ts
// Avoid: the digest leaves the entity, and the use case compares it
if (!withdrawal.codeDigest.equals(this.#digests.of(command.code))) {
	return err(new WrongConfirmationCode(withdrawal.id));
}
```

```ts
// Preferred: the use case hands over the digest, the entity compares and never returns its own
const confirmed = withdrawal.confirm(this.#digests.of(command.code), this.#clock.now());

if (!confirmed.ok) {
	return confirmed;
}
```

```ts
// domain/withdrawal/withdrawal.aggregate.ts
confirm(submitted: CodeDigest, at: Date): Result<void, WithdrawalNotPending | WrongConfirmationCode> {
	if (this.#status !== 'pending') {
		return err(new WithdrawalNotPending(this.id));
	}

	if (!this.#codeDigest.equals(submitted)) {
		return err(new WrongConfirmationCode(this.id));
	}

	this.#status = 'confirmed';
	this.record<WithdrawalConfirmed>({
		...eventMetadata(at),
		type: 'wallets.withdrawal.WithdrawalConfirmed',
		withdrawalId: this.id,
	});

	return ok();
}
```

L’empreinte reste dans un champ privé, sans getter. L’event `WithdrawalConfirmed` ne porte que l’identité du retrait : le code ne sort ni dans un event, ni dans un log.
