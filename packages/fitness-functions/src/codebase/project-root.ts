import { existsSync, globSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { isAbsolute, join, relative, sep } from 'node:path';

export class ProjectRoot {
	private readonly directory: string;

	public constructor(directory: string) {
		this.directory = realpathSync(directory);
	}

	public files(folders: readonly string[], extension: string, exclude: string[]): string[] {
		const paths = new Set<string>();

		for (const folder of folders) {
			for (const path of globSync(`${folder}/**/*${extension}`, { cwd: this.directory, exclude })) {
				paths.add(this.relative(this.absolute(path)));
			}
		}

		return [...paths].sort();
	}

	public folders(path: string): string[] {
		if (!this.isFolder(path)) {
			return [];
		}

		const folders: string[] = [];

		for (const entry of readdirSync(this.absolute(path), { withFileTypes: true })) {
			if (entry.isDirectory()) {
				folders.push(entry.name);
			}
		}

		return folders.sort();
	}

	public isFolder(path: string): boolean {
		return existsSync(this.absolute(path)) && statSync(this.absolute(path)).isDirectory();
	}

	public contains(path: string): boolean {
		const outside = relative(this.directory, this.absolute(path));

		return !isAbsolute(path) && outside !== '..' && !outside.startsWith(`..${sep}`);
	}

	public read(path: string): string | undefined {
		if (!existsSync(this.absolute(path))) {
			return undefined;
		}

		return readFileSync(this.absolute(path), 'utf8');
	}

	public absolute(path: string): string {
		return join(this.directory, path);
	}

	public relative(path: string): string {
		return relative(this.directory, path).split(sep).join('/');
	}
}
