import { Port } from "../../src/domain/ports/index.ts";
import type { AntiCorruptionLayer } from "../../src/strategic/anti-corruption-layers/index.ts";
import type { OpenHostService } from "../../src/strategic/open-host-services/index.ts";
import type { PublishedLanguage } from "../../src/strategic/published-language/index.ts";

export type ProductRepresentation = PublishedLanguage<{ id: string; name: string }>;

export type CatalogProductRepresentation = PublishedLanguage<{ id: string; price: number }>;

export class CatalogApi implements OpenHostService {
	public product(id: string): ProductRepresentation {
		return { id, name: "Espresso cup" };
	}
}

export abstract class PriceList extends Port {
	public abstract priceOf(productId: string): Promise<number | undefined>;
}

export class CatalogPriceList extends PriceList implements AntiCorruptionLayer {
	public constructor(private readonly products: readonly CatalogProductRepresentation[]) {
		super();
	}

	public priceOf(productId: string): Promise<number | undefined> {
		return Promise.resolve(this.products.find((product) => product.id === productId)?.price);
	}
}
