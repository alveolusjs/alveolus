import type { SourceFile } from "../../model/index.ts";

export type FindingData = Readonly<Record<string, string | number>>;

export interface Finding<MessageId extends string = string> {
	readonly file: SourceFile;
	readonly line: number;
	readonly symbol: string;
	readonly messageId: MessageId;
	readonly data: FindingData;
}
