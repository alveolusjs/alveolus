import type { CodeClass, CodeFile, Location } from "../codebase/index.ts";
import type { RuleId } from "../config/index.ts";
import { ClassRule } from "./class-rule.ts";
import type { Problem } from "./problem.ts";

export class DrivenAdaptersExtendPortRule extends ClassRule {
	public readonly id: RuleId = "driven-adapters-extend-port";

	protected problemsWith(codeClass: CodeClass, file: CodeFile): Problem[] {
		const location = file.location;

		if (this.isAdaptersFolder(location) && !codeClass.is("Port")) {
			return [{ line: codeClass.line, message: `${codeClass.name} is a driven adapter but extends no Port: extend the port it implements.`, symbol: codeClass.name }];
		}
		if (codeClass.is("Port") && codeClass.isAbstract && !this.isPortsFolder(location) && !this.isAdaptersFolder(location)) {
			return [{ line: codeClass.line, message: `The port ${codeClass.name} is declared outside the domain: move it to domain/ports/ or domain/repositories/.`, symbol: codeClass.name }];
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
