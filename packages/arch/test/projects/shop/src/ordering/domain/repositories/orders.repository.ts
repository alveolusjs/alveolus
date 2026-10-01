import { CommandRepository } from "@alveolus/core";

import type { Order } from "../aggregates/order.aggregate.ts";

export abstract class Orders extends CommandRepository<Order> {}
