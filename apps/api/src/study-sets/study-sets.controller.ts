import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { StudySetsService } from './study-sets.service';
import { CreateStudySetDto } from './dto/create-study-set.dto';
import { UpdateStudySetDto } from './dto/update-study-set.dto';
import { QueryStudySetsDto } from './dto/query-study-sets.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtOptionalAuthGuard } from '../common/guards/jwt-optional-auth.guard';

interface OptionalAuthRequest {
  user?: AuthUser;
}

@Controller('study-sets')
export class StudySetsController {
  constructor(private readonly studySetsService: StudySetsService) {}

  @Public()
  @UseGuards(JwtOptionalAuthGuard)
  @Get()
  findMany(
    @Query() query: QueryStudySetsDto,
    @Req() req: OptionalAuthRequest,
  ) {
    return this.studySetsService.findMany(query, req.user ?? null);
  }

  @Public()
  @UseGuards(JwtOptionalAuthGuard)
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: OptionalAuthRequest,
  ) {
    return this.studySetsService.findOne(id, req.user ?? null);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateStudySetDto) {
    return this.studySetsService.create(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateStudySetDto,
  ) {
    return this.studySetsService.update(id, user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.studySetsService.remove(id, user);
  }
}
