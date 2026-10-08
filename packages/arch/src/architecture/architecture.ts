import { basename } from "node:path";

import type { CoreKind, CoreMarker } from "../conventions/index.ts";
import type { ClassType, DependencyTarget, Member, Project, SourceFile } from "../model/index.ts";
import { ClassDeclaration } from "../model/index.ts";
import type { AllowedPackages } from "./allowed-packages.ts";
import { BuildingBlocks } from "./building-blocks.ts";
import { CoreApi } from "./core-api.ts";
import { Layers } from "./layers.ts";
import type { ShapeIssue } from "./paths/layer-shape.ts";
import { LayerShape } from "./paths/layer-shape.ts";
import { Layout } from "./paths/layout.ts";
import { Location } from "./paths/location.ts";
import type { Settings } from "./settings.ts";

type FileTarget = Extract<DependencyTarget, { kind: "file" }>;

/**
 * The project read through the conventions of Alveolus: where each file sits, which building block each class is.
 * Rules ask it their questions; it knows nothing of how the sources were read.
 */
export class Architecture {
	public readonly core: CoreApi = new CoreApi();
	public readonly layers: Layers = new Layers();
	public readonly blocks: BuildingBlocks = new BuildingBlocks(this.core);
	private readonly shape = new LayerShape(this.blocks);
	private readonly layout: Layout;
	private readonly locations = new Map<string, Location>();

	public constructor(
		public readonly project: Project,
		private readonly settings: Settings,
	) {
		this.layout = new Layout(settings);
	}

	public get files(): readonly SourceFile[] {
		return this.project.files;
	}

	public get domainDependencies(): AllowedPackages {
		return this.settings.domainDependencies;
	}

	public get applicationDependencies(): AllowedPackages {
		return this.settings.applicationDependencies;
	}

	public locationOf(file: SourceFile): Location {
		return this.locate(file.path);
	}

	/** Where a dependency points; a file the analysis does not see lies outside the layers, whatever its folder. */
	public locationOfTarget(target: FileTarget): Location {
		if (target.visibility !== "analysed") {
			return new Location({ area: "outside", fileName: basename(target.path), unseen: target.visibility });
		}
		return this.locate(target.path);
	}

	/** How a file breaks the folders its layer expects, if it does. */
	public shapeIssueOf(location: Location): ShapeIssue | undefined {
		return this.shape.issueWith(location);
	}

	public relativePath(path: string): string {
		return this.project.relativePath(path);
	}

	/** The building blocks a class extends, the most specific first. */
	public kindsOf(subject: ClassType | ClassDeclaration): CoreKind[] {
		return this.core.kindsOf(this.typeOf(subject));
	}

	public kindOf(subject: ClassType | ClassDeclaration): CoreKind | undefined {
		return this.kindsOf(subject)[0];
	}

	public is(subject: ClassType | ClassDeclaration, kind: CoreKind): boolean {
		return this.kindsOf(subject).includes(kind);
	}

	public isBuildingBlock(subject: ClassType | ClassDeclaration): boolean {
		return this.kindsOf(subject).length > 0;
	}

	public implementsMarker(declaration: ClassDeclaration, marker: CoreMarker): boolean {
		return this.core.markersOf(declaration.implemented).includes(marker);
	}

	public returnsResult(member: Member): boolean {
		return member.returns !== undefined && this.core.isResult(member.returns);
	}

	/** The declaration of a class, when an analysed file of the project declares it. */
	public classOf(type: ClassType): ClassDeclaration | undefined {
		return this.project.classOf(type);
	}

	private locate(path: string): Location {
		let location = this.locations.get(path);
		if (location === undefined) {
			location = this.layout.locate(path);
			this.locations.set(path, location);
		}
		return location;
	}

	private typeOf(subject: ClassType | ClassDeclaration): ClassType {
		return subject instanceof ClassDeclaration ? subject.type : subject;
	}
}
