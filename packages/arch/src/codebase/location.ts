export type Layer = "domain" | "application" | "published-language" | "driven" | "driving";

export type Area = "context" | "shared-kernel" | "root" | "outside";

export interface LocationProps {
	readonly area: Area;
	readonly context?: string;
	readonly layer?: Layer;
	readonly folder?: string;
	readonly fileName: string;
	readonly isCompositionRoot?: boolean;
}

export class Location {
	public readonly area: Area;
	public readonly context: string | undefined;
	public readonly layer: Layer | undefined;
	public readonly folder: string | undefined;
	public readonly fileName: string;
	public readonly isCompositionRoot: boolean;

	public constructor(props: LocationProps) {
		this.area = props.area;
		this.context = props.context;
		this.layer = props.layer;
		this.folder = props.folder;
		this.fileName = props.fileName;
		this.isCompositionRoot = props.isCompositionRoot ?? false;
	}

	public get isInBoundedContext(): boolean {
		return this.area === "context";
	}

	public get isInSharedKernel(): boolean {
		return this.area === "shared-kernel";
	}

	public get isAtRoot(): boolean {
		return this.area === "root";
	}

	public get isOutside(): boolean {
		return this.area === "outside";
	}

	public get isInLayer(): boolean {
		return this.layer !== undefined;
	}

	public isSameContextAs(other: Location): boolean {
		return this.context !== undefined && this.context === other.context;
	}

	public isOtherBoundedContextThan(other: Location): boolean {
		return this.isInBoundedContext && !this.isSameContextAs(other);
	}

	public describe(): string {
		if (this.isOutside) {
			return "outside the declared bounded contexts and shared kernel";
		}
		if (this.isAtRoot) {
			return "at the root";
		}
		const role = this.isCompositionRoot ? "composition root" : (this.layer ?? "outside the layers");
		return `${this.context} ${role}`;
	}
}
