import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CategoriesModule } from 'src/categories/categories.module';
import { ToolsModule } from 'src/tools/tools.module';
import { UsersModule } from 'src/users/users.module';
import { FavoritesModule } from 'src/favorites/favorites.module';
import { SuggestionsModule } from 'src/suggestions/suggestions.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [PrismaModule, CategoriesModule, ToolsModule, UsersModule, FavoritesModule, SuggestionsModule,
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
