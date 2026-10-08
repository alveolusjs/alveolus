import type { Architecture, Location } from "../../architecture/index.ts";
import type { Dependency, GlobalUse, SourceFile } from "../../model/index.ts";
import type { Finding, RuleMeta } from "../framework/index.ts";
import { ImportRule } from "../framework/index.ts";

type MessageId = "otherLayer" | "coreSymbol" | "undeclaredPackage" | "packageName" | "hostGlobal" | "clock" | "randomness";

export class NoImpureDomainRule extends ImportRule<"layers/no-impure-domain", MessageId> {
	public readonly meta: RuleMeta<"layers/no-impure-domain", MessageId> = {
		description: "The domain importing a framework, a database, another layer or a package not allowed, or using the host, the clock or randomness.",
		id: "layers/no-impure-domain",
		messages: {
			clock: "The domain reads the system clock with {name}: receive the time from the Clock port.",
			coreSymbol: "The domain imports {names} from @alveolus/core: only domain building blocks and Result are allowed.",
			hostGlobal: "The domain uses {name}, a global of the host: reach it through a port.",
			otherLayer: "The domain imports {target}: it may only import the domain.",
			packageName: "The domain imports {names} from {package}: domainDependencies only allows {allowed}.",
			randomness: "The domain draws a random value with {name}: receive it from a port, such as IdGenerator.",
			undeclaredPackage: "The domain imports {package}: add it to domainDependencies if the domain really needs it.",
		},
	};

	public override check(architecture: Architecture): Finding<MessageId>[] {
		const findings = super.check(architecture);
		for (const file of architecture.files) {
			if (this.appliesTo(file, architecture)) {
				findings.push(...this.impureGlobals(file));
			}
		}
		return findings;
	}

	protected appliesTo(file: SourceFile, architecture: Architecture): boolean {
		return architecture.locationOf(file).layer === "domain";
	}

	protected findingFor(dependency: Dependency, file: SourceFile, architecture: Architecture): Finding<MessageId> | undefined {
		const { line, label } = dependency;
		const target = dependency.target;
		if (target.kind === "file") {
			if (this.isDomainReachable(architecture.locationOfTarget(target), architecture.locationOf(file))) {
				return undefined;
			}
			return this.finding(file, line, label, "otherLayer", { target: this.wording.target(target, architecture) });
		}
		if (target.name === architecture.core.packageName) {
			const forbidden = dependency.names.filter((name) => !architecture.core.isDomainSymbol(name));
			return forbidden.length === 0 ? undefined : this.finding(file, line, label, "coreSymbol", { names: forbidden.join(", ") });
		}
		const allowed = architecture.domainDependencies;
		if (!allowed.has(target.name)) {
			return this.finding(file, line, label, "undeclaredPackage", { package: target.name });
		}
		const forbidden = allowed.forbiddenNames(target.name, dependency.names);
		if (forbidden.length === 0) {
			return undefined;
		}
		return this.finding(file, line, label, "packageName", { allowed: allowed.allowedNames(target.name).join(", "), names: forbidden.join(", "), package: target.name });
	}

	/** A global of the host, or a built-in that reads the clock or draws a random value. */
	private impureGlobals(file: SourceFile): Finding<MessageId>[] {
		const findings: Finding<MessageId>[] = [];
		for (const use of file.globals) {
			const messageId = this.messageFor(use);
			if (messageId !== undefined) {
				findings.push(this.finding(file, use.line, use.name, messageId, { name: use.name }));
			}
		}
		return findings;
	}

	private messageFor(use: GlobalUse): MessageId | undefined {
		if (use.origin === "host") {
			return "hostGlobal";
		}
		return use.effect;
	}

	private isDomainReachable(to: Location, from: Location): boolean {
		return to.layer === "domain" && (to.isSameContextAs(from) || to.isInSharedKernel);
	}
}
