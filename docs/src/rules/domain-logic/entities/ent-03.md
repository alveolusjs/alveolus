---
code: ENT-03
title: L’identité est un value object
group: Identité
scope: [domain]
style: [tactical]
severity: minor
detection: []
review: approved
sources:
  - "Unique Identity"
  - "Unique Identity › Application Generates Identity (ProductId)"
  - "Uncovering Entities and Properties (TenantId)"
---

# ENT-03 · L’identité est un value object

<RuleMeta />

## Signal

- Une identité manipulée comme un `string` ou un `number` nu, surtout quand elle sert partout (l’identité du wallet portée par chaque virement, chaque mouvement et chaque relevé).
- Du code appelant qui découpe le format brut d’une identité pour en tirer une information.

## Pourquoi

Un value object d’identité est immuable : l’identité reste stable. Il garde aussi la logique de l’identité en un seul endroit, au lieu de la disperser dans le modèle et chez ses appelants.

Par exemple, une identité peut rendre la date de création encodée dans sa valeur, sans que l’appelant connaisse le format. Le typage fort empêche aussi de passer un `WalletId` là où un `HolderId` est attendu.

## Exceptions

Aucune.

## Correction

Un value object ou un branded type par identité, qui porte le parsing et la validation de son format.

## Adaptation

**Notre choix** : une classe par identité, qui étend `UuidIdentifier` de `@alveolus/core`. Son paramètre `Tag` empêche TypeScript de confondre deux identités de même forme. `of` lit une valeur reçue : tout UUID de la RFC 9562, quelle que soit sa version, mis en minuscules. Il refuse le reste par `InvalidIdentifier`, y compris le UUID nil, qui n’identifie rien. Une identité qui n’est pas un UUID, comme une clé entière héritée, étend directement `Identifier`. La génération d’une nouvelle identité relève d’ENT-05.

Pas de préfixe dans la valeur (`wallet_…`). La colonne dit déjà ce qu’elle contient, le type `uuid` de PostgreSQL reste possible (ENT-08), et le nom du concept n’entre pas dans les données, où le renommer obligerait à les migrer. Deux identités échangées à la reconstruction sont attrapées par la clé étrangère et par le test du repository contre la vraie base (REP-16).

## Voir aussi

AGG-05 l’exige pour les aggregate roots. Cette règle l’étend à toute identité, y compris celles reçues d’un autre bounded context.

## Exemple

```ts
export class WalletId extends UuidIdentifier<'WalletId'> {
	private constructor(value: string) {
		super(value);
	}

	static generate(ids: IdGenerator): WalletId {
		return new WalletId(ids.next());
	}

	static of(value: string): Result<WalletId, InvalidIdentifier> {
		return WalletId.parse(value, (valid) => new WalletId(valid));
	}
}
```

`of` lit une valeur venue de l’extérieur et peut la refuser. `generate` construit une valeur que l’application vient de générer, sans la relire.
