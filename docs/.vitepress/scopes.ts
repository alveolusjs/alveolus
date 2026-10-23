export interface Scope {
	id: string;
	label: string;
}

/** Rule scopes, in reference architecture order. */
export const scopes: Scope[] = [
	{
		id: 'domain',
		label: 'Modèle (domain)',
	},
	{
		id: 'application',
		label: 'Use cases (application)',
	},
	{
		id: 'driving',
		label: 'Adapters driving',
	},
	{
		id: 'driven',
		label: 'Adapters driven',
	},
	{
		id: 'public',
		label: 'Contrats publiés (public)',
	},
	{
		id: 'schema',
		label: 'Schéma et migrations',
	},
	{
		id: 'tests',
		label: 'Tests',
	},
	{
		id: 'structure',
		label: 'Structure et décisions',
	},
];

export function scopeLabel(id: string): string {
	return scopes.find((scope) => scope.id === id)?.label ?? id;
}
