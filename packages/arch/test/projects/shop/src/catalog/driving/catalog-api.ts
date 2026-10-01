import type { OpenHostService } from "@alveolus/core";

export class CatalogApi implements OpenHostService {
	public priceOf(productId: string): Promise<{ productId: string; amount: number }> {
		return Promise.resolve({ amount: 42, productId });
	}
}
