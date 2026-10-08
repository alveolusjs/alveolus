# Security

`@alveolus/core` has no runtime dependency. `@alveolus/arch` runs at development time only, reads
your sources with the TypeScript compiler, and loads `alveolus.config.ts` as code, the way Vitest
or Vite load theirs: run it on code you trust.

To report a vulnerability, write to security@alveolus.dev with the package, the version and a way
to reproduce it. Do not open a public issue. You will get an answer within five working days, and
a fix or a mitigation before any public disclosure.
