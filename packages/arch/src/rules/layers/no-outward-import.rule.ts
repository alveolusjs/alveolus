import { basename, dirname } from "node:path";

import type { Codebase, CodeFile, Import, Layer, Location } from "../../codebase/index.ts";
import { CoreApi } from "../../codebase/index.ts";
import type { Config, RuleId } from "../../config/index.ts";
import { ImportRule } from "../import-rule.ts";
import { LayerShape } from "../layer-shape.ts";
import type { Violation } from "../violation.ts";

type OuterLayer = Exclude<Layer, "domain">;

const allowedLayers: Readonly<Record<OuterLayer, readonly Layer[]>> = {
	application: ["domain", "application", "published-language"],
	driven: ["domain", "application", "published-language", "driven"],
	driving: ["domain", "application", "published-language", "driving"],
	"published-language": ["published-language"],
};

export class NoOutwardImportRule extends ImportRule {
	public readonly id: RuleId = "layers/no-outward-import";
	private readonly shape = new LayerShape();

	public override check(codebase: Codebase): Violation[] {
		return [...this.filesOutsideLayers(codebase), ...this.extraCompositionRoots(codebase), ...super.check(codebase)];
	}

	protected appliesTo(file: CodeFile): boolean {
		const location = file.location;
		return location.isAtRoot || location.isCompositionRoot || (location.isInLayer && location.layer !== "domain");
	}

	protected problemWith(imported: Import, file: CodeFile, codebase: Codebase): string | undefined {
		if (imported.target.kind === "file") {
			return this.fileProblem(file.location, imported.target.location, this.describeTarget(imported, codebase));
		}
		return this.packageProblem(file.location, imported, codebase.config);
	}

	private filesOutsideLayers(codebase: Codebase): Violation[] {
		const violations: Violation[] = [];
		for (const file of codebase.files) {
			const location = file.location;
			if (location.isOutside) {
				violations.push(
					this.violation(codebase, file, {
						line: 1,
						message: "The file is outside the bounded contexts and the shared kernel declared in alveolus.config.ts: move it, or add it to ignore.",
						symbol: location.fileName,
					}),
				);
			} else if (!location.isAtRoot && !location.isInLayer && !location.isCompositionRoot) {
				violations.push(
					this.violation(codebase, file, {
						line: 1,
						message: "The file is outside the layers: move it to domain/, application/, published-language/, driven/ or driving/.",
						symbol: location.fileName,
					}),
				);
			} else if (location.isInLayer) {
				const message = this.shape.problemWith(location);
				if (message !== undefined) {
					violations.push(this.violation(codebase, file, { line: 1, message, symbol: location.fileName }));
				}
			}
		}
		return violations;
	}

	/** A context, or a feature of the shared kernel, has one composition root: the files of its folder that match the glob. */
	private extraCompositionRoots(codebase: Codebase): Violation[] {
		const byFolder = new Map<string, CodeFile[]>();
		for (const file of codebase.files.filter((candidate) => candidate.location.isCompositionRoot)) {
			const folder = dirname(file.path);
			byFolder.set(folder, [...(byFolder.get(folder) ?? []), file]);
		}
		const violations: Violation[] = [];
		for (const roots of byFolder.values()) {
			if (roots.length < 2) {
				continue;
			}
			const names = roots.map((root) => basename(root.path)).sort();
			for (const root of roots) {
				const message = `${root.location.context} has ${roots.length} composition roots (${names.join(", ")}): keep one, and move the rest into the layers.`;
				violations.push(this.violation(codebase, root, { line: 1, message, symbol: root.location.fileName }));
			}
		}
		return violations;
	}

	private fileProblem(from: Location, to: Location, target: string): string | undefined {
		if (from.isAtRoot) {
			return to.isInBoundedContext && !to.isCompositionRoot ? `Files at the root import composition roots only, not ${target}.` : undefined;
		}
		if (from.isCompositionRoot || to.isOtherBoundedContextThan(from)) {
			return undefined;
		}
		if (to.isCompositionRoot) {
			return `Imports ${target}: only the composition root wires the layers.`;
		}

		const layer = from.layer;
		if (layer === undefined || layer === "domain") {
			return undefined;
		}
		const allowed = allowedLayers[layer];
		if (to.layer !== undefined && allowed.includes(to.layer)) {
			return undefined;
		}
		return `The ${layer} layer imports ${target}: it may only import ${allowed.join(", ")}.`;
	}

	private packageProblem(from: Location, imported: Import, config: Config): string | undefined {
		if (from.layer === "application") {
			return this.applicationPackageProblem(imported, config);
		}
		if (from.layer === "published-language" && imported.isFromPackage(CoreApi.packageName)) {
			const forbidden = imported.names.filter((name) => !CoreApi.isPublishedLanguageSymbol(name));
			return forbidden.length === 0 ? undefined : `The published language imports ${forbidden.join(", ")} from ${CoreApi.packageName}: only published-language types are allowed.`;
		}
		return undefined;
	}

	private applicationPackageProblem(imported: Import, config: Config): string | undefined {
		if (imported.target.kind !== "package" || imported.isFromPackage(CoreApi.packageName)) {
			return undefined;
		}
		const name = imported.target.name;
		const allowed = config.applicationDependencies;
		if (!allowed.has(name)) {
			return `The application imports ${name}: add it to applicationDependencies if the application really needs it.`;
		}
		const forbidden = allowed.forbiddenNames(name, imported.names);
		if (forbidden.length === 0) {
			return undefined;
		}
		return `The application imports ${forbidden.join(", ")} from ${name}: applicationDependencies only allows ${allowed.allowedNames(name).join(", ")}.`;
	}
}
