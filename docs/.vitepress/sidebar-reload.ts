import { readdirSync, readFileSync, utimesSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import matter from 'gray-matter';
import type { Plugin } from 'vitepress';

import { srcDir } from './rules';

const rulesDir = join(srcDir, 'rules');
const configFile = fileURLToPath(new URL('./config.ts', import.meta.url));

function frontmatterOf(file: string): string {
	return matter(readFileSync(file, 'utf8')).matter;
}

export function reloadSidebarOnFrontmatterChange(): Plugin {
	const frontmatters = new Map<string, string>();

	return {
		name: 'alveolus:reload-sidebar-on-frontmatter-change',
		apply: 'serve',
		configureServer(server) {
			for (const file of readdirSync(rulesDir, { recursive: true, encoding: 'utf8' })) {
				if (file.endsWith('.md')) {
					frontmatters.set(join(rulesDir, file), frontmatterOf(join(rulesDir, file)));
				}
			}

			server.watcher.on('change', (file) => {
				if (!file.startsWith(rulesDir) || !file.endsWith('.md')) {
					return;
				}

				const frontmatter = frontmatterOf(file);
				const previous = frontmatters.get(file);
				frontmatters.set(file, frontmatter);

				if (previous !== frontmatter) {
					const now = new Date();
					utimesSync(configFile, now, now);
				}
			});
		},
	};
}
