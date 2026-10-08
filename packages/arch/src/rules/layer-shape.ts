import type { Layer, Location } from "../codebase/index.ts";

const kindFolders: Readonly<Partial<Record<Layer, readonly string[]>>> = {
	application: ["commands", "queries", "translators"],
	domain: ["aggregates", "entities", "value-objects", "events", "errors", "services", "repositories", "ports", "views"],
};

/** The folders each layer expects between itself and a file, as the project layout describes them. */
export class LayerShape {
	public problemWith(location: Location): string | undefined {
		const layer = location.layer;
		const folders = location.foldersInLayer;
		if (layer === "domain" || layer === "application") {
			return this.kindFolderProblem(layer, folders);
		}
		if (layer === "published-language") {
			return folders.length === 0 ? undefined : "The file is nested in published-language/: the published language holds its files directly.";
		}
		if (layer === "driven") {
			return this.drivenProblem(folders);
		}
		if (layer === "driving" && folders.length === 0) {
			return "The file is not under a technology: driving/ holds driving/<technology>/, such as driving/http/.";
		}
		return undefined;
	}

	private kindFolderProblem(layer: "domain" | "application", folders: readonly string[]): string | undefined {
		const allowed = kindFolders[layer] ?? [];
		const example = `${layer}/${allowed[0]}/`;
		if (folders.length === 0) {
			return `The file sits directly in ${layer}/: put it in the folder of its kind, such as ${example}.`;
		}
		if (folders.length > 1) {
			return `The file is nested too deep: ${layer}/ holds one folder per kind, such as ${example}.`;
		}
		const [folder] = folders;
		if (folder !== undefined && !allowed.includes(folder)) {
			return `${layer}/${folder}/ is no folder of the ${layer}: use ${allowed.map((name) => `${name}/`).join(", ")}.`;
		}
		return undefined;
	}

	private drivenProblem(folders: readonly string[]): string | undefined {
		if (folders.length < 2) {
			return "The file is not under a technology: driven/ holds driven/<technology>/<folder>/, such as driven/pg/adapters/.";
		}
		if (folders.length > 2) {
			return "The file is nested too deep: driven/ holds driven/<technology>/<folder>/, such as driven/pg/adapters/.";
		}
		return undefined;
	}
}
