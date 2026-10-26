# Premiers pas

Alveolus s’adopte en trois temps : déclarer ses bounded contexts, écrire le modèle avec les building blocks, puis laisser Claude Code coder avec les règles. Chaque étape sert seule. Ensemble, elles se renforcent.

Il faut Node.js 24 ou plus récent et TypeScript. Les packages sont publiés sur npm. Les commandes ci-dessous utilisent pnpm : avec npm, `npm install` remplace `pnpm add`, et `npx` remplace `pnpm exec`.

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

- les règles, un dossier par style et un fichier par couche, chacun ouvert par son sommaire. Claude Code charge celles de `domain` quand il travaille dans `src/wallets/domain/`, celles de `driven` dans `src/wallets/driven/` ;
- trois skills, qui mènent une user story de la conception à la revue ;
- un agent de revue, qui vérifie les règles dans son propre contexte.

Relancer la commande après chaque mise à jour du package ou l’ajout d’un bounded context, et versionner `.claude/` : toute l’équipe code alors avec les mêmes règles.

1. **Concevoir**, avec `/alveolus-design` suivi de la user story. Le skill lit le code et les règles de chaque dossier touché, puis écrit une conception technique : critères d’acceptation, modèle, use cases, adapters, fichiers, tests, incréments, règles appliquées, questions ouvertes. Aucun code.
2. **Implémenter**, avec `/alveolus-implement` suivi de la conception approuvée. Le skill construit un seul incrément, le suivant, sur sa propre branche : un test d’abord, puis le code, en lisant les règles de chaque dossier avant d’y écrire. Il coche l’incrément et l’enregistre dans Git, sans le pousser. Il s’arrête sur un manque de la story ou de la conception, sur une règle qu’il ne peut pas tenir, ou sur un incrément qui déborde de son plan.
3. **Relire**, avec `/alveolus-review`. Le skill lance les contrôles du projet, fait vérifier les règles par l’agent de revue, et compare l’incrément à la conception : son test, ses fichiers, ce qui le rend sûr à fusionner. Au dernier incrément, il vérifie aussi chaque critère de la story. Il propose la merge request et ne corrige rien.

La conception découpe la story en incréments, une merge request chacun, assez petite pour être relue d’une traite. Chacun se fusionne seul, garde tous les contrôles au vert et ne casse rien : le premier critère se construit couche par couche, de `domain` vers les adapters, et reste injoignable jusqu’à son wiring ; chaque autre critère tient en un incrément, de bout en bout ; un changement de comportement existant passe par un changement en parallèle, l’ancien chemin restant en place jusqu’au dernier pas. On relit la conception et on la fusionne avant tout code. Puis, pour chaque incrément : implémenter, relire, pousser, fusionner, et passer au suivant.

Chaque skill attend d’être lancé : on relit entre deux étapes, et la conception reste en brouillon tant qu’on ne l’a pas approuvée.

## 4. Vérifier en CI {#lint}

Les règles qu’un lint décide sans faux positif sont livrées pour deux outils : oxlint, que `nest new` installe, et dependency-cruiser, qui suit les imports.

```sh
pnpm add -D @alveolus/lint-config oxlint dependency-cruiser
```

```ts
// oxlint.config.mts
import { defineConfig } from 'oxlint';
import alveolus from '@alveolus/lint-config/oxlint';

export default defineConfig({ extends: [alveolus] });
```

```js
// .dependency-cruiser.cjs
module.exports = { extends: '@alveolus/lint-config/dependency-cruiser' };
```

Chaque erreur cite le code de sa règle et l’adresse de sa page. Peu de règles sont vérifiées ainsi : les autres restent à la revue, par l’agent de revue et par l’équipe. Le [README du package](https://github.com/alveolusjs/alveolus/tree/main/packages/lint-config) liste ce que chaque outil vérifie, et ce qu’il ne voit pas.

## 5. Déclarer les artefacts du projet {#artifacts}

Certaines règles lisent ce que le projet a déclaré : context map, glossaire, ADR, propriété du code. [Mettre en place un projet](./prerequisites) les décrit.

## Et ensuite {#next}

- [Lire une règle](./overview#how-to-read) : ses sections, sa sévérité, son périmètre.
- [Choix par défaut](./default-choices) : ce que les règles supposent quand rien n’est décidé.
- [Toutes les règles](../rules/), à filtrer par partie, thème ou sévérité.
