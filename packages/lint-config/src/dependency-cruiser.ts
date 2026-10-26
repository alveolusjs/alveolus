import type { IConfiguration } from 'dependency-cruiser';

import { lay01, lay02, lay04, pub01 } from './rules.ts';

const config: IConfiguration = {
	forbidden: [
		{
			name: lay04.code,
			comment: lay04.describe(),
			severity: 'error',
			from: { path: '^src/([^/]+)/', pathNot: '^src/shared/' },
			to: { path: '^src/[^/]+/', pathNot: ['^src/$1/', '^src/[^/]+/public/', '^src/shared/'] },
		},
		{
			name: lay02.code,
			comment: lay02.describe(),
			severity: 'error',
			scope: 'folder',
			from: { path: '^src/([^/]+)/(domain|application|driving|driven|public)/' },
			to: { path: '^src/$1/$2/', circular: true },
		},
		{
			name: lay01.code,
			comment: lay01.describe(),
			severity: 'error',
			from: { path: '^src/([^/]+)/(domain|application)/' },
			to: { path: '^src/$1/(driving|driven)/' },
		},
		{
			name: pub01.code,
			comment: pub01.describe(),
			severity: 'error',
			from: { path: '^src/([^/]+)/public/' },
			to: { path: '^src/$1/(domain|application|driving|driven)/' },
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
