import type { Architecture, Location } from "../../architecture/index.ts";
import type { ClassDeclaration, SourceFile } from "../../model/index.ts";
import type { Finding, RuleMeta } from "../framework/index.ts";
import { ClassRule } from "../framework/index.ts";

type MessageId = "portless" | "portOutsideDomain";

export class NoPortlessAdapterRule extends ClassRule<"layers/no-portless-adapter", MessageId> {
	public readonly meta: RuleMeta<"layers/no-portless-adapter", MessageId> = {
		contexts: "core",
		description: "A driven adapter that extends no port, a port declared outside the domain.",
		id: "layers/no-portless-adapter",
		messages: {
			portless: "{class} is a driven adapter but extends no Port: extend the port it implements.",
			portOutsideDomain: "The port {class} is declared outside the domain: move it to domain/ports/ or domain/repositories/.",
		},
	};

	protected findingsFor(codeClass: ClassDeclaration, file: SourceFile, architecture: Architecture): Finding<MessageId>[] {
		const location = architecture.locationOf(file);
		const isPort = architecture.is(codeClass, "Port");
		if (this.isAdaptersFolder(location) && !isPort) {
			return [this.finding(file, codeClass.line, codeClass.name, "portless", { class: codeClass.name })];
		}
		if (isPort && codeClass.isAbstract && !this.isPortsFolder(location) && !this.isAdaptersFolder(location)) {
			return [this.finding(file, codeClass.line, codeClass.name, "portOutsideDomain", { class: codeClass.name })];
		}
		return [];
	}

	private isAdaptersFolder(location: Location): boolean {
		return location.layer === "driven" && location.folder === "adapters";
	}

	private isPortsFolder(location: Location): boolean {
		return location.layer === "domain" && (location.folder === "ports" || location.folder === "repositories");
	}
}
