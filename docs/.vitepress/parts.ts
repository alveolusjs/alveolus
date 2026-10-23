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
		summary: 'Placer le code, suivre une opération, la prouver : la structure, le flux d’un use case, les tests.',
	},
	{
		slug: 'integration',
		title: 'Intégration',
		icon: 'ArrowLeftRight',
		summary: 'Relier les bounded contexts : des appels, des messages et des contrats qui résistent au changement.',
	},
];
