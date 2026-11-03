import { spawn } from 'node:child_process';

export type SessionRequest = {
	readonly cwd: string;
	readonly prompt: string;
	readonly model: string;
	readonly budget: number;
	readonly allowedTools: readonly string[];
	readonly permissionMode: 'acceptEdits' | 'dontAsk';
	readonly jsonSchema?: string;
};

export type SessionResult = {
	readonly isError: boolean;
	readonly result: string;
	readonly structuredOutput: unknown;
	readonly costUsd: number;
	readonly durationMs: number;
	readonly turns: number;
	readonly subagents: number;
	readonly permissionDenials: number;
};

type ResultMessage = {
	readonly is_error?: boolean;
	readonly result?: string;
	readonly structured_output?: unknown;
	readonly total_cost_usd?: number;
	readonly duration_ms?: number;
	readonly num_turns?: number;
	readonly subagent_stats?: { readonly spawned?: number };
	readonly permission_denials?: readonly unknown[];
};

const timeoutMs = 60 * 60 * 1000;

export class ClaudeSession {
	readonly #request: SessionRequest;

	public constructor(request: SessionRequest) {
		this.#request = request;
	}

	public async run(): Promise<SessionResult> {
		const output = await this.#spawn();
		const message: ResultMessage = JSON.parse(output);

		return {
			isError: message.is_error ?? true,
			result: message.result ?? '',
			structuredOutput: message.structured_output,
			costUsd: message.total_cost_usd ?? 0,
			durationMs: message.duration_ms ?? 0,
			turns: message.num_turns ?? 0,
			subagents: message.subagent_stats?.spawned ?? 0,
			permissionDenials: message.permission_denials?.length ?? 0,
		};
	}

	#arguments(): string[] {
		const { prompt, model, budget, allowedTools, permissionMode, jsonSchema } = this.#request;
		const schema = jsonSchema === undefined ? [] : ['--json-schema', jsonSchema];

		return [
			'-p',
			prompt,
			'--model',
			model,
			'--output-format',
			'json',
			'--max-budget-usd',
			String(budget),
			'--permission-mode',
			permissionMode,
			'--no-session-persistence',
			'--allowedTools',
			...allowedTools,
			...schema,
		];
	}

	#spawn(): Promise<string> {
		return new Promise((resolve, reject) => {
			const child = spawn('claude', this.#arguments(), {
				cwd: this.#request.cwd,
				stdio: ['ignore', 'pipe', 'pipe'],
				timeout: timeoutMs,
			});
			const stdout: Buffer[] = [];
			const stderr: Buffer[] = [];

			child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
			child.stderr.on('data', (chunk: Buffer) => stderr.push(chunk));
			child.on('error', reject);
			child.on('close', (code) => {
				const text = Buffer.concat(stdout).toString('utf8').trim();

				if (text.startsWith('{')) {
					resolve(text);

					return;
				}

				reject(new Error(`claude exited with ${code}: ${Buffer.concat(stderr).toString('utf8')}`));
			});
		});
	}
}
