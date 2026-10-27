import type { Linter } from 'eslint';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

import { plugin } from './eslint/plugin.ts';
import { ctx06, lay01, plc07, wir05 } from './rules.ts';

const containerDecorators = {
	name: '@nestjs/common',
	importNames: ['Injectable', 'Inject', 'Optional'],
	message: wir05.describe(),
};

const prisma = {
	name: '@prisma/client',
	message: plc07.describe(),
};

const swagger = {
	name: '@nestjs/swagger',
	message: plc07.describe(),
};

const packagesInDomain = {
	regex: String.raw`^(?!@alveolus/core(?:/|$)|node:|\.{1,2}/)`,
	message: `${lay01.describe()} / ${ctx06.describe()}`,
};

const config: Linter.Config[] = defineConfig(
	{
		files: ['src/**/*.ts'],
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: { projectService: true, tsconfigRootDir: process.cwd() },
		},
		plugins: { alveolus: plugin },
		rules: {
			'alveolus/lay-01': 'error',
			'alveolus/lay-04': 'error',
			'alveolus/pub-01': 'error',
			'no-restricted-imports': ['error', { paths: [containerDecorators, prisma, swagger] }],
		},
	},
	{
		files: ['src/**/application/**/*.ts', 'src/**/driven/prisma/**/*.ts'],
		rules: { 'no-restricted-imports': ['error', { paths: [containerDecorators, swagger] }] },
	},
	{
		files: ['src/**/driving/http/**/*.ts'],
		rules: { 'no-restricted-imports': ['error', { paths: [prisma] }] },
	},
	{
		files: ['src/*/domain/**/*.ts'],
		rules: { 'no-restricted-imports': ['error', { patterns: [packagesInDomain] }] },
	},
	{
		files: ['src/**/*.module.ts', 'src/**/*.wiring.ts', 'src/**/*.bootstrap.ts', 'src/**/*.config.ts'],
		rules: { 'no-restricted-imports': 'off' },
	},
	{
		files: ['src/**/__test__/**', 'src/**/*.spec.ts'],
		rules: {
			'alveolus/lay-01': 'off',
			'alveolus/lay-04': 'off',
			'alveolus/pub-01': 'off',
			'no-restricted-imports': 'off',
		},
	},
);

export default config;
