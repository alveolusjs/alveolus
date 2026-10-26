---
code: MAP-04
title: Un big ball of mud reste contenu
group: Relations particulières
scope: [structure]
style: [tactical, transaction-script]
severity: major
severityNote: Majeure pour une fuite. Question pour de la modélisation à l’intérieur.
detection: []
review: approved
sources:
  - "Big Ball of Mud (definition)"
  - "Why Context Maps Are So Essential"
---

# MAP-04 · Un big ball of mud reste contenu

<RuleMeta />

## Signal

- Du nouveau code importe directement depuis le big ball of mud (une classe, un service, une table), sans anticorruption layer.
- Une nouvelle fonctionnalité écrite à l’intérieur du big ball of mud, alors que la context map lui prévoit un bounded context propre.
- Un effort de modélisation tactique (aggregates, value objects) à l’intérieur du big ball of mud.

## Pourquoi

Un big ball of mud est un système sans frontières claires : les mêmes classes et les mêmes tables servent à tout, un mot y a plusieurs sens, et chaque changement peut casser une partie éloignée. C’est l’état de beaucoup d’applications qui ont grandi vite. Ce n’est pas une faute : c’est un point de départ.

Le réécrire d’un coup est risqué. Le remodeler de l’intérieur ne tient pas : chaque amélioration se dilue dans le reste. Le geste sûr est de le contenir :

- le nommer : il figure sur la context map comme un bounded context à part ;
- l’empêcher de déborder : le nouveau code vit dans des bounded contexts propres, et ne lit le big ball of mud qu’à travers une anticorruption layer ;
- le laisser rétrécir : chaque fonctionnalité déplacée vers un bounded context propre lui retire une part.

Sans cette frontière, le nouveau code reprend les noms, les tables et les raccourcis de l’ancien, et devient à son tour un big ball of mud.

## Exceptions

- Une correction ou une petite évolution dans le big ball of mud lui-même : on le maintient, sans chercher à le remodeler.
- Un refactoring qui extrait du big ball of mud un bounded context propre.

## Correction

Pour partir d’un big ball of mud :

1. Le déclarer dans la context map, comme un bounded context à part, avec son dossier ou son dépôt, et dans `architecture.json` avec la valeur `big-ball-of-mud` (CTX-14).
2. Écrire chaque nouvelle fonctionnalité dans un bounded context propre, avec son modèle et son langage.
3. Faire passer chaque échange avec le big ball of mud par une anticorruption layer, dans `driven` : elle lit ce dont le bounded context a besoin, et le traduit en concepts locaux.
4. Quand une fonctionnalité existante doit beaucoup changer, envisager de la déplacer dans un bounded context propre plutôt que de l’améliorer sur place.

## Exemple

Un nouveau bounded context Payment doit savoir si un client peut payer. Dans le big ball of mud, l’information est dans une table `users`, codée en chiffres et en flags.

```ts
// Avoid: the new context reads the legacy tables and inherits their codes
const user = await legacy.query('SELECT status, flag_blocked FROM users WHERE id = $1', [customerId]);

if (user.status === 2 && !user.flag_blocked) {
  // ...
}
```

```ts
// Preferred: the new context asks a question in its own language
export abstract class Payers {                                          // domain/
  abstract payer(customerId: CustomerId): Promise<Payer | undefined>;
}

export class LegacyPayers extends Payers {                              // driven/sql/legacy/
  readonly #legacy: LegacyDatabase;

  constructor(legacy: LegacyDatabase) {
    super();
    this.#legacy = legacy;
  }

  async payer(customerId: CustomerId): Promise<Payer | undefined> {
    const user = await this.#legacy.user(customerId.value);

    if (!user) {
      return undefined;
    }

    return user.status === 2 && !user.flag_blocked ? Payer.allowed(customerId) : Payer.blocked(customerId);
  }
}
```

Les codes de l’ancien système (`2`, `flag_blocked`) ne vivent qu’à un endroit. Le jour où il change, ou où la donnée part dans un bounded context propre, seule cette classe bouge.
