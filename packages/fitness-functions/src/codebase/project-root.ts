import { globSync, realpathSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export class ProjectRoot {
	private readonly directory: string;

	public constructor(directory: string) {
		this.directory = realpathSync(directory);
	}

	public files(pattern: string, exclude: string[]): string[] {
		const paths: string[] = [];

		for (const path of globSync(pattern, { cwd: this.directory, exclude })) {
			paths.push(this.relative(this.absolute(path)));
		}

		return paths.sort();
	}

	public absolute(path: string): string {
		return join(this.directory, path);
	}

	public relative(path: string): string {
		return relative(this.directory, path).split(sep).join('/');
	}
}
