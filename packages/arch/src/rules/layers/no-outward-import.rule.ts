import { basename, dirname } from "node:path";

import type { Architecture, Location, ShapeIssue } from "../../architecture/index.ts";
import type { Dependency, SourceFile } from "../../model/index.ts";
import type { Finding, FindingData, RuleMeta } from "../framework/index.ts";
import { ImportRule } from "../framework/index.ts";

type MessageId =
	| ShapeIssue["kind"]
	| "outsideContexts"
	| "outsideLayers"
	| "compositionRoots"
	| "rootImport"
	| "wiring"
	| "outwardLayer"
	| "publishedLanguageCore"
	| "undeclaredPackage"
	| "packageName";

/** Which way a dependency between two files may not point. */
interface LayerProblem {
	readonly messageId: MessageId;
	readonly data: FindingData;
}

export class NoOutwardImportRule extends ImportRule<"layers/no-outward-import", MessageId> {
	public readonly meta: RuleMeta<"layers/no-outward-import", MessageId> = {
		description: "A dependency pointing away from the domain, a file outside the layers or in the wrong folder of its layer.",
		id: "layers/no-outward-import",
		messages: {
			compositionRoots: "{context} has {count} composition roots ({names}): keep one, and move the rest into the layers.",
			directlyInLayer: "The file sits directly in {layer}/: put it in the folder of its kind, such as {example}.",
			drivenTooDeep: "The file is nested too deep: driven/ holds driven/<technology>/<folder>/, such as driven/pg/adapters/.",
			drivenWithoutTechnology: "The file is not under a technology: driven/ holds driven/<technology>/<folder>/, such as driven/pg/adapters/.",
			drivingWithoutTechnology: "The file is not under a technology: driving/ holds driving/<technology>/, such as driving/http/.",
			nestedPublishedLanguage: "The file is nested in published-language/: the published language holds its files directly.",
			outsideContexts: "The file is outside the bounded contexts and the shared kernel declared in alveolus.config.ts: move it, or add it to ignore.",
			outsideLayers: "The file is outside the layers: move it to domain/, application/, published-language/, driven/ or driving/.",
			outwardLayer: "The {layer} layer imports {target}: it may only import {allowed}.",
			packageName: "The application imports {names} from {package}: applicationDependencies only allows {allowed}.",
			publishedLanguageCore: "The published language imports {names} from @alveolus/core: only published-language types are allowed.",
			rootImport: "Files at the root import composition roots only, not {target}.",
			tooDeep: "The file is nested too deep: {layer}/ holds one folder per kind, such as {example}.",
			undeclaredPackage: "The application imports {package}: add it to applicationDependencies if the application really needs it.",
			unknownFolder: "{layer}/{folder}/ is no folder of the {layer}: use {folders}.",
			wiring: "Imports {target}: only the composition root wires the layers.",
		},
	};

	public override check(architecture: Architecture): Finding<MessageId>[] {
		return [...this.misplacedFiles(architecture), ...this.extraCompositionRoots(architecture), ...super.check(architecture)];
	}

	protected appliesTo(file: SourceFile, architecture: Architecture): boolean {
		const location = architecture.locationOf(file);
		return location.isAtRoot || location.isCompositionRoot || (location.isInLayer && location.layer !== "domain");
	}

	protected findingFor(dependency: Dependency, file: SourceFile, architecture: Architecture): Finding<MessageId> | undefined {
		const from = architecture.locationOf(file);
		const target = dependency.target;
		if (target.kind === "file") {
			const problem = this.layerProblem(from, architecture.locationOfTarget(target), architecture);
			if (problem === undefined) {
				return undefined;
			}
			return this.finding(file, dependency.line, dependency.label, problem.messageId, { ...problem.data, target: this.wording.target(target, architecture) });
		}
		if (from.layer === "application") {
			return this.applicationPackageFinding(dependency, target.name, file, architecture);
		}
		if (from.layer === "published-language" && target.name === architecture.core.packageName) {
			const forbidden = dependency.names.filter((name) => !architecture.core.isPublishedLanguageSymbol(name));
			return forbidden.length === 0 ? undefined : this.finding(file, dependency.line, dependency.label, "publishedLanguageCore", { names: forbidden.join(", ") });
		}
		return undefined;
	}

	/** A file outside every context, outside the layers, or in a folder its layer does not expect. */
	private misplacedFiles(architecture: Architecture): Finding<MessageId>[] {
		const findings: Finding<MessageId>[] = [];
		for (const file of architecture.files) {
			const location = architecture.locationOf(file);
			if (location.isOutside) {
				findings.push(this.finding(file, 1, location.fileName, "outsideContexts"));
			} else if (!location.isAtRoot && !location.isInLayer && !location.isCompositionRoot) {
				findings.push(this.finding(file, 1, location.fileName, "outsideLayers"));
			} else if (location.isInLayer) {
				const issue = architecture.shapeIssueOf(location);
				if (issue !== undefined) {
					findings.push(this.finding(file, 1, location.fileName, issue.kind, this.shapeData(issue)));
				}
			}
		}
		return findings;
	}

	private shapeData(issue: ShapeIssue): FindingData {
		if (issue.kind === "unknownFolder") {
			return { folder: issue.folder, folders: issue.folders.map((name) => `${name}/`).join(", "), layer: issue.layer };
		}
		if (issue.kind === "directlyInLayer" || issue.kind === "tooDeep") {
			return { example: issue.example, layer: issue.layer };
		}
		return {};
	}

	/** A context, or a feature of the shared kernel, has one composition root: the files of its folder that match the glob. */
	private extraCompositionRoots(architecture: Architecture): Finding<MessageId>[] {
		const byFolder = new Map<string, SourceFile[]>();
		for (const file of architecture.files) {
			if (architecture.locationOf(file).isCompositionRoot) {
				const folder = dirname(file.path);
				byFolder.set(folder, [...(byFolder.get(folder) ?? []), file]);
			}
		}
		const findings: Finding<MessageId>[] = [];
		for (const roots of byFolder.values()) {
			if (roots.length < 2) {
				continue;
			}
			const names = roots.map((root) => basename(root.path)).sort();
			for (const root of roots) {
				const location = architecture.locationOf(root);
				const data = { context: location.context ?? "", count: roots.length, names: names.join(", ") };
				findings.push(this.finding(root, 1, location.fileName, "compositionRoots", data));
			}
		}
		return findings;
	}

	private layerProblem(from: Location, to: Location, architecture: Architecture): LayerProblem | undefined {
		if (from.isAtRoot) {
			return to.isInBoundedContext && !to.isCompositionRoot ? { data: {}, messageId: "rootImport" } : undefined;
		}
		if (from.isCompositionRoot || to.isOtherBoundedContextThan(from)) {
			return undefined;
		}
		if (to.isCompositionRoot) {
			return { data: {}, messageId: "wiring" };
		}
		const layer = from.layer;
		if (layer === undefined || layer === "domain") {
			return undefined;
		}
		const allowed = architecture.layers.importableFrom(layer);
		if (to.layer !== undefined && allowed.includes(to.layer)) {
			return undefined;
		}
		return { data: { allowed: allowed.join(", "), layer }, messageId: "outwardLayer" };
	}

	/** The application imports core, and the packages its configuration allows, with their allowed names. */
	private applicationPackageFinding(dependency: Dependency, packageName: string, file: SourceFile, architecture: Architecture): Finding<MessageId> | undefined {
		if (packageName === architecture.core.packageName) {
			return undefined;
		}
		const { line, label } = dependency;
		const allowed = architecture.applicationDependencies;
		if (!allowed.has(packageName)) {
			return this.finding(file, line, label, "undeclaredPackage", { package: packageName });
		}
		const forbidden = allowed.forbiddenNames(packageName, dependency.names);
		if (forbidden.length === 0) {
			return undefined;
		}
		return this.finding(file, line, label, "packageName", { allowed: allowed.allowedNames(packageName).join(", "), names: forbidden.join(", "), package: packageName });
	}
}
