/** The layers of a bounded context. */
export const layers = ["domain", "application", "published-language", "driven", "driving"] as const;

export type Layer = (typeof layers)[number];

/** Within a context or towards the shared kernel, what each layer may import. The domain imports the domain only, under its own rule. */
export const layerImports: Readonly<Record<Exclude<Layer, "domain">, readonly Layer[]>> = {
	application: ["domain", "application", "published-language"],
	driven: ["domain", "application", "published-language", "driven"],
	driving: ["domain", "application", "published-language", "driving"],
	"published-language": ["published-language"],
};
