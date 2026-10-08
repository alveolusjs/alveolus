import type { AllowedPackages } from "./allowed-packages.ts";

/** A folder of `src/` that is a bounded context, or the shared kernel. */
export interface ContextFolder {
	readonly name: string;
	readonly dir: string;
	readonly isSharedKernel: boolean;
}

/** What a project declares about its architecture in `alveolus.config.ts`. */
export interface Settings {
	readonly rootDir: string;
	readonly contextFolders: readonly ContextFolder[];
	/** The glob a composition root's file name matches, `*.module.ts` by default. */
	readonly compositionRoot: string;
	readonly domainDependencies: AllowedPackages;
	/** The packages the application may import: its own, and those of the domain. */
	readonly applicationDependencies: AllowedPackages;
}
