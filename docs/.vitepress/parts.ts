export interface Part {
	slug: string;
	title: string;
	summary: string;
	icon: string;
}

export const parts: Part[] = [
	{
		slug: 'strategic-design',
		title: 'Conception stratégique',
		icon: 'Map',
		summary:
			'Tracer les frontières : un langage par bounded context, des relations déclarées entre bounded contexts.',
	},
	{
		slug: 'domain-logic',
		title: 'Logique du domaine',
		icon: 'Box',
		summary:
			'Donner un lieu aux règles métier : un modèle tactique pour le core, des transaction scripts pour le reste.',
	},
	{
		slug: 'architecture-and-placement',
		title: 'Architecture et placement',
		icon: 'Layers',
		summary: 'Placer le code et suivre une opération : la structure, puis le flux d’un use case.',
	},
	{
		slug: 'integration',
		title: 'Intégration',
		icon: 'ArrowLeftRight',
		summary: 'Relier les bounded contexts : des appels, des messages et des contrats qui résistent au changement.',
	},
	{
		slug: 'testing',
		title: 'Tests',
		icon: 'FlaskConical',
		summary:
			'Prouver le code : un domaine couvert en entier, sur une vraie base, par des tests qui ne mentent pas.',
	},
	{
		slug: 'operations',
		title: 'Exploitation',
		icon: 'Activity',
		summary: 'Faire tourner le code : savoir ce qui se passe, et ne rien laisser fuir.',
	},
];
