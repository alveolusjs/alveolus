import { Rule } from './rule.ts';

const site = 'https://alveolus.dev/rules';

export const ctx06: Rule = new Rule(
	'CTX-06',
	'Un système externe est un autre bounded context',
	`${site}/strategic-design/bounded-contexts/ctx-06`,
);

export const lay01: Rule = new Rule(
	'LAY-01',
	'Le domaine déclare ses interfaces, `driven` les implémente',
	`${site}/architecture-and-placement/layers/lay-01`,
);

export const lay02: Rule = new Rule(
	'LAY-02',
	'Aucun cycle entre modules de même niveau',
	`${site}/architecture-and-placement/layers/lay-02`,
);

export const lay04: Rule = new Rule(
	'LAY-04',
	'Un autre bounded context n’entre que par `public`, qui ne contient que le contrat',
	`${site}/architecture-and-placement/layers/lay-04`,
);

export const plc07: Rule = new Rule(
	'PLC-07',
	'Les adapters se découpent par technologie, et une technologie n’est importée que dans son dossier',
	`${site}/architecture-and-placement/placement/plc-07`,
);

export const pub01: Rule = new Rule(
	'PUB-01',
	'Un published language documenté, distinct du modèle interne',
	`${site}/integration/contracts/pub-01`,
);

export const wir05: Rule = new Rule(
	'WIR-05',
	'Seuls les fichiers de wiring et les adapters du framework connaissent le container',
	`${site}/architecture-and-placement/wiring/wir-05`,
);

export const rules: readonly Rule[] = [ctx06, lay01, lay02, lay04, plc07, pub01, wir05];
