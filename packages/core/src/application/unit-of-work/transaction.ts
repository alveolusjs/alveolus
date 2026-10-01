export abstract class Transaction {
	public abstract commit(): Promise<void>;
	public abstract rollback(): Promise<void>;
}
