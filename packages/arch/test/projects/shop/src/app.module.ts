import { CatalogModule } from "./catalog/catalog.module.ts";
import { OrderingModule } from "./ordering/ordering.module.ts";

export class AppModule {
	public readonly imports = [CatalogModule, OrderingModule];
}
