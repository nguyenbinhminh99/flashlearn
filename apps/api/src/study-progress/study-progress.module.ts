import { Module } from '@nestjs/common';
import { StudyProgressService } from './study-progress.service';
import { StudyProgressController } from './study-progress.controller';

@Module({
  controllers: [StudyProgressController],
  providers: [StudyProgressService],
})
export class StudyProgressModule {}
