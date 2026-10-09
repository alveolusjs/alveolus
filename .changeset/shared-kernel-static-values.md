---
"@alveolus/arch": minor
---

`strategic/no-shared-state` reports a static readonly field of the shared kernel that holds anything but a value. A value is a primitive, a value object, an identifier, a class of a package listed in `domainDependencies`, or a readonly collection of them. A singleton such as `static readonly shared = new ServiceDirectory()`, a `static readonly bus = new EventEmitter()` or a function kept its state out of the rule's sight, since it read the type of the field and not what its class holds. Build such services in the composition root.
