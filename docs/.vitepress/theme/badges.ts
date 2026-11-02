export const severities = ['blocking', 'major', 'minor', 'question'] as const;

const badgeLabels: Record<string, string> = {
	blocking: 'bloquante',
	major: 'majeure',
	minor: 'mineure',
};

export function badgeLabel(value: string): string {
	return badgeLabels[value] ?? value;
}
