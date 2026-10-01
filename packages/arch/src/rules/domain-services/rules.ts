import type { ClassDeclaration } from "ts-morph";

import type { Violation } from "../../building-blocks/index.ts";
import { noHiddenClock, noIo, stateless } from "../shared/index.ts";

export function checkDomainServices(services: readonly ClassDeclaration[]): Violation[] {
	return services.flatMap((service) => [
		...stateless(service, "domain-service"),
		...noHiddenClock(service, "domain-service"),
		...noIo(service, "domain-service"),
	]);
}
