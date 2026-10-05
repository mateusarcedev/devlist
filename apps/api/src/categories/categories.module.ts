import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AdminGuard } from 'src/common/guards/admin.guard';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, AdminGuard],
  imports: [PrismaModule],
})
export class CategoriesModule {}
