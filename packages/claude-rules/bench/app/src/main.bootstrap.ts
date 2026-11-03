import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

void NestFactory.create(AppModule).then(async (app) => {
	app.enableShutdownHooks();
	await app.listen(process.env.PORT ?? 3000);
});
