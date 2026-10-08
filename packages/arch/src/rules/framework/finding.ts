import type { SourceFile } from "../../model/index.ts";

/** The values a message's `{placeholders}` are filled with. */
export type FindingData = Readonly<Record<string, string | number>>;

/** Something a rule found: where, about which symbol, and which of its messages explains it. */
export interface Finding<MessageId extends string = string> {
	readonly file: SourceFile;
	readonly line: number;
	readonly symbol: string;
	readonly messageId: MessageId;
	readonly data: FindingData;
}
