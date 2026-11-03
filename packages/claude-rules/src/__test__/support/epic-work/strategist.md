Working notes.

<!-- slot: map -->

```mermaid
flowchart LR
  customer["<b>customer app</b><br/>goals and their progress"]
  wallets["<b>wallets</b><br/>wallets, goals and money set aside"]
  customer -->|"HTTP<br/>goal requests"| wallets
```

<!-- slot: 6 -->

### 6.1 New bounded context

None.

### 6.2 Relationships

None.

### 6.3 Glossary

| Context | Term | Code | Definition | Rejected terms |
| --- | --- | --- | --- | --- |
| wallets | Savings goal | `SavingsGoal` | Money a customer sets aside for a project | Pot, vault |

<!-- slot: 8.process -->

```mermaid
sequenceDiagram
  autonumber
  actor C as Customer
  participant W as wallets
  C->>W: set money aside
  W-->>C: new progress
```

<!-- slot: decisions -->

| D-S1 | A goal is an aggregate of its own, that refers to its wallet by identity | A goal changes without loading the wallet | Goals inside the wallet, which grows with each goal | |
