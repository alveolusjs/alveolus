import type { Repository } from "@alveolus/core";

import type { Customer } from "../domain/aggregates/customer.aggregate.ts";

export interface CustomerRepository extends Repository<Customer> {}
