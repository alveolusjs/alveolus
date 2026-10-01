export type SnapshotValue = string | number | boolean | null | bigint | Date | readonly SnapshotValue[] | { readonly [key: string]: SnapshotValue };

export type AnySnapshot = { readonly [key: string]: SnapshotValue };
