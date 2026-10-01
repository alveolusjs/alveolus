import type { Repository } from "@alveolus/core";

import type { Order } from "../aggregates/order.aggregate.ts";

export interface OrderRepository extends Repository<Order> {}
