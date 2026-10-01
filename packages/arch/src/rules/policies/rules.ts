import type { ClassDeclaration } from "ts-morph";

import type { Violation } from "../../building-blocks/index.ts";
import { noHiddenClock, noIo, stateless } from "../shared/index.ts";

export function checkPolicies(policies: readonly ClassDeclaration[]): Violation[] {
	return policies.flatMap((policy) => [
		...stateless(policy, "policy"),
		...noHiddenClock(policy, "policy"),
		...noIo(policy, "policy"),
	]);
}
