import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { StudyProgressService } from './study-progress.service';
import { SaveProgressDto } from './dto/save-progress.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';

@Controller('study-sets/:id/progress')
@UseGuards(JwtAuthGuard)
export class StudyProgressController {
  constructor(private readonly studyProgressService: StudyProgressService) {}

  @Get()
  get(
    @Param('id', ParseUUIDPipe) studySetId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.studyProgressService.get(studySetId, user);
  }

  @Put()
  save(
    @Param('id', ParseUUIDPipe) studySetId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: SaveProgressDto,
  ) {
    return this.studyProgressService.save(studySetId, user, dto);
  }

  @Delete()
  reset(
    @Param('id', ParseUUIDPipe) studySetId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.studyProgressService.reset(studySetId, user);
  }
}
