# @alveolus/fitness-functions

Fitness functions that check an app against the Alveolus rules, from a test of the app. Each one automates a rule
of the site and carries its code, its title and the url of its page.

```sh
pnpm add -D @alveolus/fitness-functions
```

The app chooses the rules it checks, one test each:

```ts
import { FitnessFunctions } from '@alveolus/fitness-functions';
import { expect, it } from 'vitest';

const fitness = FitnessFunctions.of(process.cwd());
const lay04 = fitness.rule('LAY-04');

it(`${lay04.code} ${lay04.title}`, () => {
	expect(fitness.check(lay04.code)).toEqual([]);
});
```

A new version of the package adds no check to the app by itself, and a rule the app waives has no test. Each
violation gives `code`, `title` and `url` of its rule, and `file`, `line` and `message` of what it found.

`FitnessFunctions.of` takes the root of the app and reads its `architecture.json`, the file
[CTX-14](https://alveolus.dev/rules/strategic-design/bounded-contexts/ctx-14) asks for: each bounded context and its
style, and its folder when it does not live in `src/<name>/`.

```json
{
	"contexts": {
		"wallets": "tactical",
		"notifications": "transaction-script",
		"legacy": { "style": "big-ball-of-mud", "path": "apps/back-office/src" }
	}
}
```

A rule only checks the bounded contexts of its styles. No rule checks a big ball of mud from the inside. Files in
`src/shared/` and at the root of `src/` are checked by every rule, and `__test__` folders are left out. Imports are
resolved the way TypeScript resolves them, `paths` of the nearest `tsconfig.json` and `@types` packages included.

`FitnessFunctions.of` throws rather than pass on a project it cannot read: when `architecture.json` is missing or
invalid, when a declared folder does not exist, when a folder of `src/` other than `shared` is not declared, and
when an import does not resolve, unless it targets a Node module or a package declared in `package.json`.

| Code | What it checks |
| --- | --- |
| [LAY-04](https://alveolus.dev/rules/architecture-and-placement/layers/lay-04) | A file of a bounded context imports nothing from another bounded context outside its `public` folder: static, type-only, re-exported or dynamic with a literal path. |

- [Documentation](https://alveolus.dev/)
- [Source](https://github.com/alveolusjs/alveolus/tree/main/packages/fitness-functions)

Node.js 24 or later. MIT.
