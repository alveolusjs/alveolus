import type { AllowedPackages } from "./allowed-packages.ts";

export interface ContextFolder {
	readonly name: string;
	readonly dir: string;
	readonly isSharedKernel: boolean;
}

export type ExtraFolders = Readonly<Partial<Record<"domain" | "application", readonly string[]>>>;

export interface Settings {
	readonly rootDir: string;
	readonly contextFolders: readonly ContextFolder[];
	readonly compositionRoot: string;
	readonly extraFolders: ExtraFolders;
	readonly domainDependencies: AllowedPackages;
	readonly applicationDependencies: AllowedPackages;
}
