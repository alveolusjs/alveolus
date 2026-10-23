import { iconSvg } from './icons';

const sections: { readonly ids: string[]; readonly icon: string; readonly color: string }[] = [
	{ ids: ['signal'], icon: 'Search', color: 'var(--vp-c-warning-1)' },
	{ ids: ['why', 'pourquoi'], icon: 'Lightbulb', color: 'var(--vp-c-brand-1)' },
	{ ids: ['exceptions'], icon: 'Scale', color: 'var(--vp-c-text-3)' },
	{ ids: ['fix', 'correction'], icon: 'Wrench', color: 'var(--vp-c-success-1)' },
	{ ids: ['adaptation'], icon: 'SlidersHorizontal', color: 'var(--vp-c-brand-1)' },
	{ ids: ['related', 'voir-aussi'], icon: 'Link', color: 'var(--vp-c-text-3)' },
	{ ids: ['example', 'exemple'], icon: 'Code', color: 'var(--vp-c-brand-1)' },
];

function dataUri(svg: string): string {
	return `url("data:image/svg+xml,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}")`;
}

export function sectionIconsCss(): string {
	return sections
		.map(({ ids, icon, color }) => {
			const selectors = ids.map((id) => `.vp-doc:has(.rule-meta--inline) h2#${id}`).join(', ');

			return `${selectors} { --rb-section-icon: ${dataUri(iconSvg(icon))}; --rb-section-color: ${color}; }`;
		})
		.join('\n');
}
