import type { IConfiguration } from 'dependency-cruiser';

import { lay02 } from './rules.ts';

const config: IConfiguration = {
	forbidden: [
		{
			name: lay02.code,
			comment: lay02.describe(),
			severity: 'error',
			scope: 'folder',
			from: {
				path: '^src/(shared/(?:driving|driven)|[^/]+/(?:internal/(?:domain|application|driving|driven)|public))/',
			},
			to: { path: '^src/$1/', circular: true },
		},
	],
	options: {
		doNotFollow: { path: 'node_modules' },
		exclude: { path: '(^|/)__test__/|[.]spec[.]ts$' },
		tsConfig: { fileName: 'tsconfig.json' },
		tsPreCompilationDeps: true,
	},
};

export default config;
