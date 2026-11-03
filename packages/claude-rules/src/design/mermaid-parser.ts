import type { Mermaid } from 'mermaid';

export type MermaidOutcome =
	| { readonly kind: 'valid' }
	| { readonly kind: 'invalid'; readonly line: number; readonly message: string }
	| { readonly kind: 'unchecked'; readonly reason: string };

const syntaxError = /Parse error|Lexical error|Syntax error|No diagram type detected|UnknownDiagramError/;

export class MermaidParser {
	readonly #mermaid: Mermaid;

	private constructor(mermaid: Mermaid) {
		this.#mermaid = mermaid;
	}

	public static async load(): Promise<MermaidParser | undefined> {
		try {
			const { Window } = await import('happy-dom');
			const window = new Window();

			Object.assign(globalThis, { window, document: window.document, DOMParser: window.DOMParser });

			const { default: mermaid } = await import('mermaid');
			mermaid.initialize({ startOnLoad: false });

			return new MermaidParser(mermaid);
		} catch {
			return undefined;
		}
	}

	public async parse(diagram: string): Promise<MermaidOutcome> {
		try {
			await this.#mermaid.parse(diagram);

			return { kind: 'valid' };
		} catch (error) {
			return this.#outcomeOf(error);
		}
	}

	#outcomeOf(error: unknown): MermaidOutcome {
		const message = error instanceof Error ? error.message : String(error);

		if (!syntaxError.test(message)) {
			return { kind: 'unchecked', reason: message.split('\n')[0] ?? message };
		}

		const lines = message.split('\n').filter((line) => line.trim() !== '');
		const line = Number(/on line (\d+)/.exec(message)?.[1] ?? 1);
		const summary = [lines[0], lines.at(-1)].filter((part) => part !== undefined && !part.includes('^'));

		return { kind: 'invalid', line, message: [...new Set(summary)].join(' ') };
	}
}
