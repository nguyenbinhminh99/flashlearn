import { Module } from '@nestjs/common';
import { StudySetsService } from './study-sets.service';
import { StudySetsController } from './study-sets.controller';

@Module({
  controllers: [StudySetsController],
  providers: [StudySetsService],
  exports: [StudySetsService],
})
export class StudySetsModule {}
