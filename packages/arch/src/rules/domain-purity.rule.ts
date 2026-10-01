import type { Codebase, CodeFile, Import, Location } from "../codebase/index.ts";
import { CoreApi } from "../codebase/index.ts";
import type { RuleId } from "../config/index.ts";
import { ImportRule } from "./import-rule.ts";

export class DomainPurityRule extends ImportRule {
	public readonly id: RuleId = "domain-purity";

	protected appliesTo(file: CodeFile): boolean {
		return file.location.layer === "domain";
	}

	protected problemWith(imported: Import, file: CodeFile, codebase: Codebase): string | undefined {
		const target = imported.target;

		if (target.kind === "file") {
			if (this.isDomainReachableFrom(target.location, file.location)) {
				return undefined;
			}
			return `The domain imports ${this.describeTarget(imported, codebase)}: it may only import the domain.`;
		}

		if (target.name === CoreApi.packageName) {
			const forbidden = imported.names.filter((name) => !CoreApi.isDomainSymbol(name));
			if (forbidden.length === 0) {
				return undefined;
			}
			return `The domain imports ${forbidden.join(", ")} from ${CoreApi.packageName}: only domain building blocks and Result are allowed.`;
		}

		if (codebase.config.domainDependencies.includes(target.name)) {
			return undefined;
		}
		return `The domain imports ${target.name}: add it to domainDependencies if the domain really needs it.`;
	}

	private isDomainReachableFrom(to: Location, from: Location): boolean {
		return to.layer === "domain" && (to.isSameContextAs(from) || to.isInSharedKernel);
	}
}
