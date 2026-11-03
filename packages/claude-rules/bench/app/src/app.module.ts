import { Module } from '@nestjs/common';

import { NotificationsModule } from './notifications/composition/notifications.module';
import { SharedModule } from './shared/composition/shared.module';
import { WalletsModule } from './wallets/composition/wallets.module';

@Module({ imports: [SharedModule, WalletsModule, NotificationsModule] })
export class AppModule {}
