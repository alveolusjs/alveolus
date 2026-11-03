Working notes for the agents after me.

<!-- slot: map -->

```mermaid
flowchart LR
  customer["<b>customer app</b><br/>sends the deposit"]
  wallets["<b>wallets</b><br/>wallets and their balance"]
  customer -->|"HTTP<br/>deposit request"| wallets
```

<!-- slot: 6 -->

### 6.1 New bounded context

None.

### 6.2 Relationships

None.

### 6.3 Glossary

| Context | Term | Code | Definition | Rejected terms |
| --- | --- | --- | --- | --- |
| wallets | Deposit | `Deposit` | Money added to a wallet by its owner | Top-up, credit |
