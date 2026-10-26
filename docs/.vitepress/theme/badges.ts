export const severities = ['blocking', 'major', 'minor', 'question'] as const;

const badgeLabels: Record<string, string> = {
	blocking: 'bloquante',
	major: 'majeure',
	minor: 'mineure',
};

export function badgeLabel(value: string): string {
	return badgeLabels[value] ?? value;
}

/** CSS class of a badge, without accents or capitals. */
export function badgeClass(kind: 'severity', value: string): string {
	const slug = value
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase();

	return `rule-badge rule-badge--${kind} rule-badge--${slug}`;
}
