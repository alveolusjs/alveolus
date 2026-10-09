import type { SourceFile, Wiring, WiringLink } from "../model/index.ts";
import type { Architecture } from "./architecture.ts";
import type { Location } from "./paths/location.ts";

export interface Crossing {
	readonly line: number;
	readonly from: string;
	readonly to: string;
	readonly expression: string;
	readonly isOpenHostService: boolean;
}

export class Crossings {
	public constructor(private readonly architecture: Architecture) {}

	public in(file: SourceFile): Crossing[] {
		const crossings = new Map<string, Crossing>();
		for (const wiring of file.wirings) {
			const crossing = this.of(wiring);
			if (crossing !== undefined) {
				crossings.set(`${crossing.line}:${crossing.expression}:${crossing.from}:${crossing.to}`, crossing);
			}
		}
		return [...crossings.values()];
	}

	private of(wiring: Wiring): Crossing | undefined {
		const receiver = this.architecture.locationOfPath(wiring.receiver);
		if (!receiver.isInBoundedContext || receiver.context === undefined) {
			return undefined;
		}
		for (const link of wiring.links) {
			const source = this.sourceOf(link, receiver);
			if (source !== undefined) {
				return { expression: link.text, from: receiver.context, isOpenHostService: this.isOpenHostService(link, receiver), line: wiring.line, to: source };
			}
		}
		return undefined;
	}

	private sourceOf(link: WiringLink, receiver: Location): string | undefined {
		if (link.declaredIn !== undefined) {
			const declared = this.architecture.locationOfPath(link.declaredIn);
			if (declared.isOtherBoundedContextThan(receiver)) {
				return declared.context;
			}
		}
		return this.foreignTypesOf(link, receiver)[0]?.context;
	}

	private isOpenHostService(link: WiringLink, receiver: Location): boolean {
		const foreign = link.types.filter((type) => this.isForeignModel(type.declaredIn, receiver));
		return (
			foreign.length > 0 &&
			foreign.every((type) => {
				const declaration = this.architecture.classOf(type);
				return declaration !== undefined && this.architecture.implementsMarker(declaration, "OpenHostService");
			})
		);
	}

	private foreignTypesOf(link: WiringLink, receiver: Location): Location[] {
		const locations: Location[] = [];
		for (const type of link.types) {
			if (this.isForeignModel(type.declaredIn, receiver)) {
				locations.push(this.architecture.locationOfPath(type.declaredIn ?? ""));
			}
		}
		return locations;
	}

	private isForeignModel(path: string | undefined, receiver: Location): boolean {
		if (path === undefined) {
			return false;
		}
		const location = this.architecture.locationOfPath(path);
		return location.isOtherBoundedContextThan(receiver) && !location.isCompositionRoot;
	}
}
