# Premiers pas

Alveolus s’adopte en trois temps : déclarer ses bounded contexts, écrire le modèle avec les building blocks, puis laisser Claude Code coder avec les règles. Chaque étape sert seule. Ensemble, elles se renforcent.

Il faut Node.js 24 ou plus récent, TypeScript et pnpm.

## 1. Déclarer les bounded contexts {#contexts}

Le projet suit l’[architecture de référence](./reference-architecture) : un dossier par bounded context sous `src/`, découpé en couches. À la racine, `architecture.json` déclare chaque bounded context et son style (CTX-14) :

```json
{
	"contexts": {
		"wallets": "tactical",
		"notifications": "transaction-script",
		"legacy": "big-ball-of-mud"
	}
}
```

Un bounded context `tactical` a un dossier `domain`. Un bounded context en transaction scripts n’en a pas (TXS-05). Pour décider, voir [choisir un style](../rules/domain-logic/choosing-a-style). Un ancien code sans frontière claire se déclare `big-ball-of-mud` : on le contient au lieu de le modéliser (MAP-04).

## 2. Installer les building blocks {#core}

```sh
pnpm add @alveolus/core
```

`@alveolus/core` fournit les building blocks du Domain-Driven Design : aggregates, entities, value objects, domain events, domain errors, ports, repositories, handlers, Unit of Work, outbox et `Result`. Il n’a aucune dépendance à l’exécution, ni NestJS ni ORM : le domaine reste pur (LAY-01).

Un value object étend `ValueObject`. Il refuse une valeur invalide avec un `Result`, pas avec une exception :

::: code-group

```ts [money.value-object.ts]
import { err, ok, type Result, ValueObject } from '@alveolus/core';
import type { Currency } from './currency.value-object';
import { InvalidMoney } from './money.errors';

export class Money extends ValueObject<{ minor: bigint; currency: Currency }> {
	static of(minor: bigint, currency: Currency): Result<Money, InvalidMoney> {
		if (minor < 0n) {
			return err(new InvalidMoney({ minor }));
		}

		return ok(new Money({ minor, currency }));
	}
}
```

```ts [money.errors.ts]
import { DomainError } from '@alveolus/core';

export class InvalidMoney extends DomainError<{ minor: bigint }> {}
```

:::

Deux `Money` de même montant et de même devise sont égaux : `equals` compare le contenu, pas la référence.

## 3. Coder avec Claude Code {#claude-code}

```sh
pnpm add -D @alveolus/claude-rules
pnpm exec alveolus-claude install
```

La commande lit `architecture.json` et écrit dans `.claude/` :

- les règles, un fichier par couche et par style. Claude Code charge celles de `domain` quand il travaille dans `src/wallets/domain/`, celles de `driven` dans `src/wallets/driven/` ;
- trois skills, qui mènent une user story de la conception à la revue ;
- un agent de revue, qui vérifie les règles dans son propre contexte.

Seules les règles relues sont livrées. Une règle encore à relire n’y figure pas, une règle rejetée non plus.

Relancer la commande après chaque mise à jour du package ou l’ajout d’un bounded context, et versionner `.claude/` : toute l’équipe code alors avec les mêmes règles.

1. **Concevoir**, avec `/alveolus-design` suivi de la user story. Le skill lit le code et les règles de chaque dossier touché, puis écrit une conception technique : critères d’acceptation, modèle, use cases, adapters, fichiers, tests, règles appliquées, questions ouvertes. Aucun code.
2. **Implémenter**, avec `/alveolus-implement` suivi de la conception approuvée. Un test d’abord, critère par critère, de `domain` vers les adapters. Le skill s’arrête sur un manque de la story ou de la conception, ou sur une règle qu’il ne peut pas tenir.
3. **Relire**, avec `/alveolus-review`. Le skill lance les contrôles du projet, fait vérifier les règles par l’agent de revue, et compare le code à la conception et à ses critères. Il ne corrige rien.

Chaque skill attend d’être lancé : on relit entre deux étapes, et la conception reste en brouillon tant qu’on ne l’a pas approuvée.

## 4. Déclarer les artefacts du projet {#artifacts}

Certaines règles lisent ce que le projet a déclaré : context map, glossaire, ADR, propriété du code. [Mettre en place un projet](./prerequisites) les décrit.

## Et ensuite {#next}

- [Lire une règle](./overview#how-to-read) : ses sections, sa sévérité, son périmètre.
- [Choix par défaut](./default-choices) : ce que les règles supposent quand rien n’est décidé.
- [Toutes les règles](../rules/), à filtrer par partie, thème ou sévérité.
