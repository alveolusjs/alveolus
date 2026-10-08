import { basename, dirname, isAbsolute, matchesGlob, relative, resolve, sep } from "node:path";

import type { Layer } from "../../conventions/index.ts";
import { layers } from "../../conventions/index.ts";
import type { ContextFolder, Settings } from "../settings.ts";
import { Location } from "./location.ts";

export class Layout {
	public constructor(private readonly settings: Settings) {}

	public locate(path: string): Location {
		const file = resolve(path);
		const fileName = basename(file);
		const folder = this.contextFolderOf(file);

		if (folder === undefined) {
			const isAtRoot = dirname(file) === this.settings.rootDir;
			return new Location({ area: isAtRoot ? "root" : "outside", fileName });
		}

		const area = folder.isSharedKernel ? "shared-kernel" : "context";
		const context = folder.name;
		const directories = this.directoriesBetween(folder.dir, file);

		if (directories.length === 0) {
			return new Location({ area, context, fileName, isCompositionRoot: this.isCompositionRoot(fileName) });
		}

		const layerIndex = this.layerIndexOf(directories, folder.isSharedKernel);
		if (layerIndex === undefined) {
			const isFeatureRoot = folder.isSharedKernel && directories.length === 1;
			return new Location({ area, context, fileName, isCompositionRoot: isFeatureRoot && this.isCompositionRoot(fileName) });
		}

		const layer = directories[layerIndex];
		if (layer === undefined || !this.isLayer(layer)) {
			return new Location({ area, context, fileName });
		}
		const foldersInLayer = directories.slice(layerIndex + 1);
		const subfolder = foldersInLayer.at(-1);
		return new Location({ area, context, fileName, foldersInLayer, layer, ...(subfolder === undefined ? {} : { folder: subfolder }) });
	}

	private layerIndexOf(directories: readonly string[], isSharedKernel: boolean): number | undefined {
		if (this.isLayer(directories[0] ?? "")) {
			return 0;
		}
		if (isSharedKernel && this.isLayer(directories[1] ?? "")) {
			return 1;
		}
		return undefined;
	}

	private isLayer(name: string): name is Layer {
		return (layers as readonly string[]).includes(name);
	}

	private isCompositionRoot(fileName: string): boolean {
		return matchesGlob(fileName, this.settings.compositionRoot);
	}

	private contextFolderOf(path: string): ContextFolder | undefined {
		const containing = this.settings.contextFolders.filter((folder) => this.isInside(folder.dir, path));
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
