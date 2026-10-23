---
code: WIR-02
title: Le module de l’application assemble les bounded contexts, le bootstrap ne fait que démarrer
group: La composition root
scope: [structure]
style: [tactical, transaction-script]
severity: minor
review: approved
sources: []
---

# WIR-02 · Le module de l’application assemble les bounded contexts, le bootstrap ne fait que démarrer

<RuleMeta />

## Signal

- Un `app.module.ts` avec des `providers` : un repository, un handler ou un port d’un bounded context.
- Un `main.bootstrap.ts` qui construit un adapter, enregistre un subscriber ou insère des données avant `listen`.

## Pourquoi

Le wiring se lit de haut en bas, un niveau par fichier : le bootstrap démarre l’application, le module de l’application liste les bounded contexts, chaque module de bounded context construit ses classes. Quand les niveaux du haut construisent aussi des objets, le lecteur doit fouiller trois fichiers pour trouver qui lie un port, et deux bounded contexts peuvent finir par partager un objet qu’aucun des deux n’a déclaré.

## Exceptions

Aucune.

## Correction

```ts
// app.module.ts
@Module({ imports: [SharedModule, WalletsModule, NotificationsModule] })
export class AppModule {}

// main.bootstrap.ts
const app = await NestFactory.create(AppModule);

app.enableShutdownHooks();
documentApi(app);

await app.listen(appConfig.port);
```

Le bootstrap garde ce qui vaut pour tout le processus : la référence de l’API, les shutdown hooks (WIR-10), le port d’écoute.

## Voir aussi

WIR-01 lie les ports dans le module du bounded context. PLC-01 place le module et la configuration.
