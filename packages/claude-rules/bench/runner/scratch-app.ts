import { execFileSync } from 'node:child_process';
import { chmodSync, cpSync, mkdirSync, mkdtempSync, readdirSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';

export class ScratchApp {
	readonly #root: string;
	readonly #packageDir: string;

	private constructor(root: string, packageDir: string) {
		this.#root = root;
		this.#packageDir = packageDir;
	}

	public static create(appDir: string, packageDir: string, ticket: string): ScratchApp {
		const root = mkdtempSync(join(tmpdir(), `alveolus-bench-${basename(ticket, '.md')}-`));
		const app = new ScratchApp(root, packageDir);

		cpSync(appDir, root, { recursive: true });
		mkdirSync(join(root, 'tickets'));
		cpSync(ticket, join(root, 'tickets', basename(ticket)));
		app.#linkPackage();
		app.#install();
		app.#commit();

		return app;
	}

	public get root(): string {
		return this.#root;
	}

	public designs(): string[] {
		const folder = join(this.#root, 'docs', 'designs');

		try {
			return readdirSync(folder)
				.filter((file) => file.endsWith('.md'))
				.map((file) => join(folder, file))
				.toSorted((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs);
		} catch {
			return [];
		}
	}

	#linkPackage(): void {
		const scope = join(this.#root, 'node_modules', '@alveolus');
		const bin = join(this.#root, 'node_modules', '.bin');
		const shim = join(bin, 'alveolus-claude');

		mkdirSync(scope, { recursive: true });
		mkdirSync(bin, { recursive: true });
		symlinkSync(this.#packageDir, join(scope, 'claude-rules'), 'dir');
		writeFileSync(shim, `#!/bin/sh\nexec node "${join(this.#packageDir, 'bin', 'alveolus-claude.js')}" "$@"\n`);
		chmodSync(shim, 0o755);
	}

	#install(): void {
		execFileSync('node', [join(this.#packageDir, 'bin', 'alveolus-claude.js'), 'install'], {
			cwd: this.#root,
			stdio: 'ignore',
		});
	}

	#commit(): void {
		const identity = ['-c', 'user.name=bench', '-c', 'user.email=bench@example.com'];

		execFileSync('git', ['init', '-q'], { cwd: this.#root });
		execFileSync('git', ['add', '-A'], { cwd: this.#root });
		execFileSync('git', [...identity, 'commit', '-qm', 'Start the app'], { cwd: this.#root });
	}
}
