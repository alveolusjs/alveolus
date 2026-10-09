import type { AllowedPackages } from "./allowed-packages.ts";
import type { ContextMap } from "./context-map.ts";

export type SubdomainType = "core" | "supporting" | "generic";

export type Subdomains = Readonly<Partial<Record<SubdomainType, readonly string[]>>>;

export interface ContextFolder {
	readonly name: string;
	readonly dir: string;
	readonly isSharedKernel: boolean;
	readonly subdomain?: SubdomainType;
}

export type ExtraFolders = Readonly<Partial<Record<"domain" | "application", readonly string[]>>>;

export interface Settings {
	readonly rootDir: string;
	readonly contextFolders: readonly ContextFolder[];
	readonly compositionRoot: string;
	readonly extraFolders: ExtraFolders;
	readonly contextMap: ContextMap | undefined;
	readonly domainDependencies: AllowedPackages;
	readonly applicationDependencies: AllowedPackages;
}
