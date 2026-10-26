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

`FitnessFunctions.of` takes the root of the app. It follows the reference architecture: each folder of `src/` is a
bounded context, except `shared`, and `__test__` folders are left out. Imports are resolved the way TypeScript
resolves them, `paths` of the nearest `tsconfig.json` included.

| Code | What it checks |
| --- | --- |
| [LAY-04](https://alveolus.dev/rules/architecture-and-placement/layers/lay-04) | A file of a bounded context imports nothing from another bounded context outside its `public` folder: static, type-only, re-exported or dynamic with a literal path. |

- [Documentation](https://alveolus.dev/)
- [Source](https://github.com/alveolusjs/alveolus/tree/main/packages/fitness-functions)

Node.js 24 or later. MIT.
