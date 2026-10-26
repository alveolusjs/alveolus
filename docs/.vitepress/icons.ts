import * as lucide from 'lucide-static';

import { parts } from './parts';

const icons = new Map(
	Object.entries(lucide).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
);

export function iconSvg(name: string): string {
	return icons.get(name) ?? '';
}

interface Feature {
	icon?: unknown;
	link?: unknown;
}

function iconName(feature: Feature): string | undefined {
	if (typeof feature.icon === 'string') {
		return feature.icon;
	}

	return parts.find((part) => feature.link === `/rules/${part.slug}/`)?.icon;
}

export function withIcons<T extends Feature>(features: T[]): T[] {
	return features.map((feature) => {
		const name = iconName(feature);
		const svg = name ? icons.get(name) : undefined;

		return svg ? { ...feature, icon: svg } : feature;
	});
}
