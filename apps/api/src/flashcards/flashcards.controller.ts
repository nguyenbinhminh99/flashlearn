import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FlashcardsService } from './flashcards.service';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UpdateFlashcardDto } from './dto/update-flashcard.dto';
import { ReorderFlashcardsDto } from './dto/reorder-flashcards.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtOptionalAuthGuard } from '../common/guards/jwt-optional-auth.guard';

interface OptionalAuthRequest {
  user?: AuthUser;
}

@Controller()
export class FlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  @Public()
  @UseGuards(JwtOptionalAuthGuard)
  @Get('study-sets/:id/cards')
  list(
    @Param('id', ParseUUIDPipe) studySetId: string,
    @Req() req: OptionalAuthRequest,
  ) {
    return this.flashcardsService.listByStudySet(studySetId, req.user ?? null);
  }

  @UseGuards(JwtAuthGuard)
  @Post('study-sets/:id/cards')
  create(
    @Param('id', ParseUUIDPipe) studySetId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateFlashcardDto,
  ) {
    return this.flashcardsService.create(studySetId, user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('study-sets/:id/cards/reorder')
  reorder(
    @Param('id', ParseUUIDPipe) studySetId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: ReorderFlashcardsDto,
  ) {
    return this.flashcardsService.reorder(studySetId, user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('flashcards/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateFlashcardDto,
  ) {
    return this.flashcardsService.update(id, user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('flashcards/:id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.flashcardsService.remove(id, user);
  }
}
