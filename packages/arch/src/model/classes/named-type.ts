/** A type known by its name and by the package that declares it: the name in the nearest `package.json`, the project's own included. */
export interface NamedType {
	readonly name: string;
	readonly packageName: string | undefined;
}
