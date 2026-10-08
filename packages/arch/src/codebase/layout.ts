import { basename, dirname, isAbsolute, matchesGlob, relative, sep } from "node:path";

import type { Config, ContextFolder } from "../config/index.ts";
import type { Layer, Unseen } from "./location.ts";
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

		const layerIndex = this.layerIndexOf(directories, folder.isSharedKernel);
		if (layerIndex === undefined) {
			const isFeatureRoot = folder.isSharedKernel && directories.length === 1;
			return new Location({ area, context, fileName, isCompositionRoot: isFeatureRoot && this.isCompositionRoot(fileName) });
		}

		const layer = directories[layerIndex] as Layer;
		const foldersInLayer = directories.slice(layerIndex + 1);
		const subfolder = foldersInLayer.at(-1);
		return new Location({ area, context, fileName, foldersInLayer, layer, ...(subfolder === undefined ? {} : { folder: subfolder }) });
	}

	/** The layer is the first folder of a context, or the second one in a feature of the shared kernel. */
	private layerIndexOf(directories: readonly string[], isSharedKernel: boolean): number | undefined {
		if (layers.has(directories[0] ?? "")) {
			return 0;
		}
		if (isSharedKernel && layers.has(directories[1] ?? "")) {
			return 1;
		}
		return undefined;
	}

	/** An imported file the analysis does not see: it lies outside the layers, whatever its folder. */
	public unseen(path: string, reason: Unseen): Location {
		return new Location({ area: "outside", fileName: basename(path), unseen: reason });
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
