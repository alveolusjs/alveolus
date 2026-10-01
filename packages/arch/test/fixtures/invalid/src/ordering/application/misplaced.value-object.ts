import { ValueObject } from "@alveolus/core";

export class Label extends ValueObject<{ text: string }> {
	private constructor(props: { text: string }) {
		super(props);
	}
}
