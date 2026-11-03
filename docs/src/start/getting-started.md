---
pageClass: getting-started
---

# Premiers pas

<p class="gs-lead">Cette page installe Alveolus dans une application NestJS, en cinq étapes. Chaque étape peut se faire sans les suivantes.</p>

<p class="gs-requirements"><span>Node.js 24+</span><span>TypeScript</span><span>NestJS</span></p>

<nav class="gs-overview" aria-label="Étapes">
	<a href="#contexts"><span class="gs-overview__number">1</span><strong>Déclarer</strong><span>les bounded contexts</span></a>
	<a href="#core"><span class="gs-overview__number">2</span><strong>Écrire</strong><span>le modèle</span></a>
	<a href="#claude-code"><span class="gs-overview__number">3</span><strong>Coder</strong><span>avec Claude Code</span></a>
	<a href="#lint"><span class="gs-overview__number">4</span><strong>Vérifier</strong><span>dans l’éditeur et en CI</span></a>
	<a href="#artifacts"><span class="gs-overview__number">5</span><strong>Déclarer</strong><span>les artefacts</span></a>
</nav>

## Déclarer les bounded contexts {#contexts}

Le code de chaque bounded context vit dans un dossier de `src/` : ses couches dans `internal/`, son contrat dans `public/` ([architecture de référence](./reference-architecture)). Le fichier `architecture.json`, à la racine, déclare chaque bounded context et son style (CTX-14) :

```json
{
	"contexts": {
		"wallets": "tactical",
		"notifications": "transaction-script",
		"legacy": "big-ball-of-mud"
	}
}
```

| Style | Signification |
| --- | --- |
| `tactical` | Le bounded context a un modèle dans `domain`, écrit avec les building blocks. |
| `transaction-script` | Le bounded context n’a pas de `domain` : chaque use case est un script (TXS-05). |
| `big-ball-of-mud` | Un ancien code sans frontière claire. On l’isole sans le modéliser (MAP-04). |

::: tip Choisir un style
La page [choisir un style](../rules/domain-logic/choosing-a-style) donne le style selon le type de subdomain : core, supporting ou generic.
:::

## Écrire le modèle {#core}

::: code-group

```sh [pnpm]
pnpm add @alveolus/core
```

```sh [npm]
npm install @alveolus/core
```

```sh [yarn]
yarn add @alveolus/core
```

```sh [bun]
bun add @alveolus/core
```

:::

`@alveolus/core` contient les building blocks : aggregates, entities, value objects, domain events, ports, repositories, handlers, Unit of Work, outbox et `Result`. Il n’a aucune dépendance à l’exécution, donc le domaine n’importe ni NestJS ni ORM (LAY-01).

Exemple : un value object qui renvoie un `Result` quand la valeur est invalide, au lieu de lancer une exception.

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

## Coder avec Claude Code {#claude-code}

::: code-group

```sh [pnpm]
pnpm add -D @alveolus/claude-rules
pnpm exec alveolus-claude install
```

```sh [npm]
npm install -D @alveolus/claude-rules
npx alveolus-claude install
```

```sh [yarn]
yarn add -D @alveolus/claude-rules
yarn alveolus-claude install
```

```sh [bun]
bun add -d @alveolus/claude-rules
bunx alveolus-claude install
```

:::

La commande lit `architecture.json` et écrit dans `.claude/` : les règles, que Claude Code charge selon le dossier où il travaille, trois skills et un agent de revue.

<div class="gs-flow">
	<div><strong>Concevoir</strong><code>/alveolus-design &lt;story&gt;</code><span>Fait écrire la conception technique de la user story, de la tâche ou de l’epic par des agents spécialisés, chacun sur une partie des règles, sur un modèle fixe, et la découpe en incréments. Le skill ne modifie pas le code.</span></div>
	<div><strong>Implémenter</strong><code>/alveolus-implement &lt;conception&gt;</code><span>Écrit l’incrément suivant sur une nouvelle branche, en commençant par son test. Le commit n’est pas poussé.</span></div>
	<div><strong>Relire</strong><code>/alveolus-review</code><span>Lance les contrôles du projet, fait vérifier les règles par l’agent et compare l’incrément à la conception.</span></div>
</div>

Chaque agent décide une partie de la conception : le besoin, les bounded contexts, le modèle, l’intégration, le flux et les données, les tests, l’exploitation. Ils décident l’un après l’autre, chacun sur ce que les précédents ont écrit, et un dernier agent relit la conception sans avoir vu leurs notes. Une epic est d’abord conçue d’un bloc : ses stories, leur ordre et ce qu’elles partagent. Chaque story est ensuite conçue à part.

La conception est relue et approuvée avant que le code commence. Le métier lit le besoin et ce qui est à valider : les décisions et les questions ouvertes. La tech lit aussi la conception et les incréments. Chaque élément y est défini une seule fois, et cité ailleurs par son identifiant : `AC-1` pour un critère d’acceptation, `D-1` pour une décision, `UC:DepositMoney` pour un use case.

```sh
pnpm exec alveolus-claude design check docs/designs/<conception>.md
```

La commande vérifie la conception sans IA : chaque section présente, chaque identifiant cité défini, chaque critère d’acceptation et chaque invariant prouvé par un test, chaque décision justifiée, chaque incrément sûr à fusionner, et ses diagrammes Mermaid quand `mermaid` et `happy-dom` sont installés. Le skill la relance jusqu’à ce qu’elle passe.

Chaque incrément fait ensuite l’objet d’une merge request : implémenter, relire, fusionner, puis passer au suivant. Quand la story ou la conception ne suffit pas, le skill s’arrête et pose la question.

::: tip Versionner `.claude/`
Le dossier `.claude/` est versionné, pour que toute l’équipe utilise les mêmes règles. Relancer la commande après une mise à jour du package ou l’ajout d’un bounded context.
:::

## Vérifier dans l’éditeur et en CI {#lint}

Installer les outils :

::: code-group

```sh [pnpm]
pnpm add -D @alveolus/lint-config eslint typescript-eslint dependency-cruiser
```

```sh [npm]
npm install -D @alveolus/lint-config eslint typescript-eslint dependency-cruiser
```

```sh [yarn]
yarn add -D @alveolus/lint-config eslint typescript-eslint dependency-cruiser
```

```sh [bun]
bun add -d @alveolus/lint-config eslint typescript-eslint dependency-cruiser
```

:::

Ajouter les deux fichiers de configuration :

::: code-group

```js [eslint.config.mjs]
import alveolus from '@alveolus/lint-config/eslint';

export default [...alveolus];
```

```js [.dependency-cruiser.cjs]
module.exports = { extends: '@alveolus/lint-config/dependency-cruiser' };
```

:::

Lancer les deux outils :

::: code-group

```sh [pnpm]
pnpm exec eslint src --format ./node_modules/@alveolus/lint-config/eslint-formatter.mjs
pnpm exec depcruise src --output-type plugin:@alveolus/lint-config/dependency-cruiser-reporter
```

```sh [npm]
npx eslint src --format ./node_modules/@alveolus/lint-config/eslint-formatter.mjs
npx depcruise src --output-type plugin:@alveolus/lint-config/dependency-cruiser-reporter
```

```sh [yarn]
yarn eslint src --format ./node_modules/@alveolus/lint-config/eslint-formatter.mjs
yarn depcruise src --output-type plugin:@alveolus/lint-config/dependency-cruiser-reporter
```

```sh [bun]
bunx eslint src --format ./node_modules/@alveolus/lint-config/eslint-formatter.mjs
bunx depcruise src --output-type plugin:@alveolus/lint-config/dependency-cruiser-reporter
```

:::

ESLint affiche les erreurs dans l’éditeur. dependency-cruiser cherche les cycles entre modules et tourne en CI. Chaque erreur donne le code de la règle et l’adresse de sa page. Les règles qu’un lint ne peut pas vérifier sans faux positif restent à la revue. Le [README du package](https://github.com/alveolusjs/alveolus/tree/main/packages/lint-config) liste les règles vérifiées.

::: info oxlint
`nest new` installe oxlint. Le projet peut le retirer, ou le garder pour ses propres règles. Alveolus ne fixe pas le format du code.
:::

## Déclarer les artefacts du projet {#artifacts}

Certaines règles lisent des fichiers du projet : context map, glossaire, ADR, propriété du code. La page [mettre en place un projet](./prerequisites) les décrit.

## Et ensuite {#next .gs-plain}

<div class="gs-next">
	<a href="/start/overview#how-to-read"><strong>Lire une règle</strong><span>Les sections d’une règle, sa sévérité et son périmètre.</span></a>
	<a href="/start/default-choices"><strong>Packs et choix par défaut</strong><span>Les conventions que les règles supposent quand le projet n’a rien décidé, en six packs à adopter ou remplacer d’un bloc.</span></a>
	<a href="/rules/"><strong>Toutes les règles</strong><span>La liste complète, à filtrer par partie, thème ou sévérité.</span></a>
</div>
