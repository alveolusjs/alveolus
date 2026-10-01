import { Port } from "./port.ts";

export abstract class Clock extends Port {
	public abstract now(): Date;
}
