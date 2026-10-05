import { Module } from '@nestjs/common';
import { ToolsService } from './tools.service';
import { ToolsController } from './tools.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AdminGuard } from 'src/common/guards/admin.guard';

@Module({
  controllers: [ToolsController],
  providers: [ToolsService, AdminGuard],
  imports: [PrismaModule],
})
export class ToolsModule {}
