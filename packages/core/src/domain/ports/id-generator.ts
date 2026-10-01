import { Port } from "./port.ts";

export abstract class IdGenerator extends Port {
	public abstract next(): string;
}
