import type { Layer } from "../conventions/index.ts";
import { layerImports, layers } from "../conventions/index.ts";

export class Layers {
	public isLayer(name: string): name is Layer {
		return (layers as readonly string[]).includes(name);
	}

	public importableFrom(layer: Exclude<Layer, "domain">): readonly Layer[] {
		return layerImports[layer];
	}
}
