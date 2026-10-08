import { CatalogModule } from "../catalog/catalog.module.ts";
import { PlaceOrderHandler } from "./application/commands/place-order.command.ts";
import { InMemoryOrders } from "./driven/in-memory/adapters/in-memory-orders.adapter.ts";

export class OrderingModule {
	public readonly imports = [CatalogModule];
	public readonly providers = [PlaceOrderHandler, InMemoryOrders];
}
