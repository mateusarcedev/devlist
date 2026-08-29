import { Module } from '@nestjs/common';
import { SuggestionsService } from './suggestions.service';
import { SuggestionsController } from './suggestions.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [SuggestionsController],
  providers: [SuggestionsService],
  imports: [PrismaModule]
})
export class SuggestionsModule { }
