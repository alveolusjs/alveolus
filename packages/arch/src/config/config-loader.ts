import { createJiti } from "jiti";
import { z } from "zod";

import { existsSync } from "node:fs";
import { resolve } from "node:path";

import type { AlveolusConfig } from "./alveolus-config.ts";
import { Config } from "./config.ts";

const packageDependencies = z.record(z.string(), z.union([z.literal(true), z.array(z.string())]));

const ruleSetting = z.enum(["error", "off"]);

const schema = z.strictObject({
	applicationDependencies: packageDependencies.exactOptional(),
	boundedContexts: z.record(z.string(), z.string()),
	compositionRoot: z.string().exactOptional(),
	domainDependencies: packageDependencies.exactOptional(),
	ignore: z.array(z.string()).exactOptional(),
	root: z.string(),
	rules: z
		.strictObject({
			"bc-isolation": ruleSetting.exactOptional(),
			"building-blocks-only": ruleSetting.exactOptional(),
			"command-query-separation": ruleSetting.exactOptional(),
			"domain-purity": ruleSetting.exactOptional(),
			"driven-adapters-extend-port": ruleSetting.exactOptional(),
			"errors-as-values": ruleSetting.exactOptional(),
			"layer-direction": ruleSetting.exactOptional(),
			placement: ruleSetting.exactOptional(),
			"reference-by-identity": ruleSetting.exactOptional(),
		})
		.exactOptional(),
	sharedKernel: z.string().exactOptional(),
});

export class ConfigLoader {
	public static readonly fileName = "alveolus.config.ts";

	public async load(projectDir: string, configFile: string = ConfigLoader.fileName): Promise<Config> {
		const path = resolve(projectDir, configFile);
		if (!existsSync(path)) {
			throw new Error(`No configuration found at ${path}.`);
		}
		const exported = await createJiti(import.meta.url).import(path, { default: true });
		return new Config(this.validate(exported, path), projectDir);
	}

	private validate(exported: unknown, path: string): AlveolusConfig {
		const parsed = schema.safeParse(exported);
		if (!parsed.success) {
			throw new Error(`Invalid configuration in ${path}:\n${z.prettifyError(parsed.error)}`);
		}
		return parsed.data;
	}
}
