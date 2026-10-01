import type { CheckContext, Repositories, Violation } from "../../building-blocks/index.ts";
import { checkAdapters } from "../../project-layout/index.ts";

export function checkRepositoryAdapters(repositories: Repositories, context: CheckContext): Violation[] {
	return checkAdapters(repositories, "repository", "a repository", context);
}
