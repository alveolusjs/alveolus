export const layers = ["domain", "application", "published-language", "driven", "driving"] as const;

export type Layer = (typeof layers)[number];

export const layerImports: Readonly<Record<Exclude<Layer, "domain">, readonly Layer[]>> = {
	application: ["domain", "application", "published-language"],
	driven: ["domain", "application", "published-language", "driven"],
	driving: ["domain", "application", "published-language", "driving"],
	"published-language": ["published-language"],
};
