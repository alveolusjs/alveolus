import { describe, expect, it } from "vitest";

import { Page } from "./page.ts";

const source = `---
description: "What the page says."
---

# Title

<dl class="al-glance">
	<dt>Rule</dt><dd><code>layers/no-impure-domain</code></dd>
	<dt>Category</dt><dd><a href="/rules/#layers">Layers</a>: what each layer may depend on</dd>
	<dt>Extends</dt><dd><code>CommandHandler&lt;Input, Output&gt;</code> &amp; more</dd>
</dl>

::: tip The fix
Keep it pure.
:::

<div class="al-compare">

\`\`\`ts [❌ Avoid]
const a = 1;
\`\`\`

</div>
`;

describe("Page", () => {
	const page = new Page("rules/layers/no-impure-domain", source);

	it("reads the description of the frontmatter", () => {
		expect(page.description).toBe("What the page says.");
		expect(new Page("x", "# No frontmatter\n").description).toBe("");
	});

	it("prints the page without the frontmatter and the HTML, a glance list as a list", () => {
		expect(page.text()).toBe(`# Title

- Rule: layers/no-impure-domain
- Category: Layers: what each layer may depend on
- Extends: CommandHandler<Input, Output> & more

::: tip The fix
Keep it pure.
:::

\`\`\`ts [❌ Avoid]
const a = 1;
\`\`\`
`);
	});
});
