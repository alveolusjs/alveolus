import { basename, dirname, isAbsolute, matchesGlob, relative, sep } from "node:path";

import type { Config, ContextFolder } from "../config/index.ts";
import type { Layer } from "./location.ts";
import { Location } from "./location.ts";

const layers: ReadonlySet<string> = new Set<Layer>(["domain", "application", "published-language", "driven", "driving"]);

export class Layout {
	public constructor(private readonly config: Config) {}

	public locate(path: string): Location {
		const fileName = basename(path);
		const folder = this.contextFolderOf(path);

		if (folder === undefined) {
			const isAtRoot = dirname(path) === this.config.rootDir;
			return new Location({ area: isAtRoot ? "root" : "outside", fileName });
		}

		const area = folder.isSharedKernel ? "shared-kernel" : "context";
		const context = folder.name;
		const directories = this.directoriesBetween(folder.dir, path);

		if (directories.length === 0) {
			return new Location({ area, context, fileName, isCompositionRoot: this.isCompositionRoot(fileName) });
		}

		const layerIndex = directories.findIndex((directory) => layers.has(directory));
		if (layerIndex === -1) {
			const isFeatureRoot = folder.isSharedKernel && directories.length === 1;
			return new Location({ area, context, fileName, isCompositionRoot: isFeatureRoot && this.isCompositionRoot(fileName) });
		}

		const layer = directories[layerIndex] as Layer;
		const subfolder = directories.length - 1 > layerIndex ? directories.at(-1) : undefined;
		return new Location({ area, context, fileName, layer, ...(subfolder === undefined ? {} : { folder: subfolder }) });
	}

	private isCompositionRoot(fileName: string): boolean {
		return matchesGlob(fileName, this.config.compositionRoot);
	}

	private contextFolderOf(path: string): ContextFolder | undefined {
		const containing = this.config.contextFolders.filter((folder) => this.isInside(folder.dir, path));
		return containing.sort((left, right) => right.dir.length - left.dir.length)[0];
	}

	private directoriesBetween(dir: string, path: string): string[] {
		const between = relative(dir, dirname(path));
		return between === "" ? [] : between.split(sep);
	}

	private isInside(dir: string, path: string): boolean {
		const offset = relative(dir, path);
		return offset !== "" && !offset.startsWith("..") && !isAbsolute(offset);
	}
}
