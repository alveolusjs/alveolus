import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectsDir = fileURLToPath(new URL("../projects", import.meta.url));

export class Sandbox {
	public readonly dir: string;

	public constructor(fixture: string) {
		this.dir = mkdtempSync(join(projectsDir, ".sandbox-"));
		cpSync(join(projectsDir, fixture), this.dir, { recursive: true });
	}

	public write(path: string, content: string): this {
		const file = join(this.dir, path);
		mkdirSync(dirname(file), { recursive: true });
		writeFileSync(file, content);
		return this;
	}

	public remove(): void {
		rmSync(this.dir, { force: true, recursive: true });
	}
}
