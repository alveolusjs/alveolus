import type { Repository } from "@alveolus/core";

import type { Crate } from "../aggregates/crate.ts";

export interface CrateStore extends Repository<Crate> {}
