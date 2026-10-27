import { Rule } from './rule.ts';

const site = 'https://alveolus.dev/rules';

export const ctx06: Rule = new Rule(
	'CTX-06',
	'An external system is another bounded context',
	`${site}/strategic-design/bounded-contexts/ctx-06`,
);

export const lay01: Rule = new Rule(
	'LAY-01',
	'The domain declares its interfaces, `driven` implements them',
	`${site}/architecture-and-placement/layers/lay-01`,
);

export const lay02: Rule = new Rule(
	'LAY-02',
	'No cycle between sibling modules',
	`${site}/architecture-and-placement/layers/lay-02`,
);

export const lay04: Rule = new Rule(
	'LAY-04',
	'Another bounded context comes in only through `public`, which holds only the contract',
	`${site}/architecture-and-placement/layers/lay-04`,
);

export const plc07: Rule = new Rule(
	'PLC-07',
	'Adapters are split by technology, and a technology is imported only in its folder',
	`${site}/architecture-and-placement/placement/plc-07`,
);

export const pub01: Rule = new Rule(
	'PUB-01',
	'A documented published language, distinct from the internal model',
	`${site}/integration/contracts/pub-01`,
);

export const wir05: Rule = new Rule(
	'WIR-05',
	'Only wiring files and framework adapters know the container',
	`${site}/architecture-and-placement/wiring/wir-05`,
);

export const rules: readonly Rule[] = [ctx06, lay01, lay02, lay04, plc07, pub01, wir05];
