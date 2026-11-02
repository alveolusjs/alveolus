export type Kind = 'safeguard' | 'structure' | 'convention';

export const kinds: Record<
	Kind,
	{ readonly label: string; readonly plural: string; readonly meaning: string; readonly severity: string }
> = {
	safeguard: {
		label: 'Garde-fou',
		plural: 'garde-fous',
		meaning:
			'Un défaut peut perdre ou corrompre de l’argent, des données ou un message, ouvrir une faille, ou empêcher de détecter ou de réparer une telle perte.',
		severity: 'blocking',
	},
	structure: {
		label: 'Structure',
		plural: 'règles de structure',
		meaning:
			'Un défaut fait diverger le code du modèle, casse une frontière (couche, bounded context, aggregate) ou crée un couplage cher à défaire.',
		severity: 'major',
	},
	convention: {
		label: 'Convention',
		plural: 'conventions',
		meaning: 'La règle fixe une forme parmi plusieurs valables. Une autre forme protégerait aussi bien.',
		severity: 'minor',
	},
};

export const kindOrder: Kind[] = ['safeguard', 'structure', 'convention'];

export function isKind(value: unknown): value is Kind {
	return value === 'safeguard' || value === 'structure' || value === 'convention';
}
