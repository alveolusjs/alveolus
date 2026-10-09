export default {
	boundedContexts: { catalog: "catalog", ordering: "ordering" },
	contextMap: { catalog: { consumes: [] }, ordering: { consumes: ["catalog"] } },
	root: "src",
	subdomains: { core: ["catalog", "ordering"] },
};
