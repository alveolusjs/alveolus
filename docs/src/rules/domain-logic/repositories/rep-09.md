---
code: REP-09
title: La forme stockée d’un aggregate évolue avec un chemin de migration
group: Stockage et reconstitution
scope: [driven, schema]
style: [tactical]
severity: blocking
detection: []
review: approved
sources:
  - "MongoDB Implementation (field mapping on deserialization)"
---

# REP-09 · La forme stockée d’un aggregate évolue avec un chemin de migration

<RuleMeta />

## Signal

- Un champ renommé ou supprimé dans un aggregate ou un value object stocké comme document (JSONB, MongoDB, cache), sans migration des données ni mapping à la lecture.
- Un mapper qui suppose que chaque document a la forme actuelle.

## Pourquoi

Un document stocké garde la forme qu’il avait à son écriture. Migrer toute une collection pour renommer un champ peut prendre trop de temps.

À la place, le sérialiseur fait correspondre l’ancien nom au nouveau, à la lecture. Le document prend la nouvelle forme à son prochain enregistrement. Les instances qui ne sont plus jamais lues gardent l’ancienne forme : peser ce compromis.

## Exceptions

Aucune.

## Correction

Une migration des données, ou une lecture qui accepte les anciennes formes, avec un test qui reconstitue un document à l’ancienne forme.

## Adaptation

Le même problème touche toute colonne JSONB qui sérialise un aggregate ou un value object (VO-10).

## Voir aussi

VO-10 range une collection dans une colonne JSONB. Pour un event publié, PUB-04 en fait un contrat versionné.

## Exemple

L’adresse du titulaire est rangée dans une colonne JSONB. Le champ `zip` vient d’être renommé `postalCode`.

```ts
// Avoid: addresses written before the rename can no longer be read
toAddress(stored: StoredAddress): PostalAddress {
	return this.stored(
		PostalAddress.of({ street: stored.street, postalCode: stored.postalCode, city: stored.city }),
	);
}
```

```ts
// Preferred: the read accepts the old name, and the next save writes the new shape
interface StoredAddress {
	readonly street: string;
	readonly postalCode?: string;
	readonly zip?: string;
	readonly city: string;
}

toAddress(stored: StoredAddress): PostalAddress {
	return this.stored(
		PostalAddress.of({ street: stored.street, postalCode: stored.postalCode ?? stored.zip, city: stored.city }),
	);
}
```

```ts
it('reads an address written before zip was renamed postalCode', () => {
	const address = mapper.toAddress({ street: '1 rue de la Paix', zip: '75002', city: 'Paris' });

	expect(address.postalCode).toBe('75002');
});
```

`zip` n’est lu qu’à la lecture : le prochain enregistrement écrit `postalCode`. Si aucune des deux clés n’existe, `PostalAddress.of` refuse, et la ligne corrompue arrête la lecture (PER-04).
