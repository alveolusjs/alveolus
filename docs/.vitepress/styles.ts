export type Style = 'tactical' | 'transaction-script';

export const styles: Record<Style, { readonly label: string; readonly short: string; readonly contexts: string }> = {
	tactical: { label: 'Modèle tactique', short: 'Tactique', contexts: 'bounded contexts tactiques' },
	'transaction-script': {
		label: 'Transaction scripts',
		short: 'Transaction script',
		contexts: 'bounded contexts en transaction scripts',
	},
};

export const styleOrder: Style[] = ['tactical', 'transaction-script'];

export function styleListLabel(list: readonly Style[]): string {
	if (list.length === styleOrder.length) {
		return 'Les deux styles';
	}

	return list.map((style) => styles[style].short).join(', ');
}

export const styleLegend: { readonly styles: Style[]; readonly meaning: string }[] = [
	{ styles: ['transaction-script'], meaning: 'la règle ne vaut que pour les transaction scripts' },
	{ styles: ['tactical'], meaning: 'la règle ne vaut que pour le modèle tactique' },
	{ styles: ['tactical', 'transaction-script'], meaning: 'la règle vaut pour les deux styles' },
];

export function isStyleList(value: unknown): value is Style[] {
	return (
		Array.isArray(value) &&
		value.length > 0 &&
		value.every((item) => item === 'tactical' || item === 'transaction-script')
	);
}
