import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import {
  AdminStudySetsQueryDto,
  AdminUsersQueryDto,
  BlockUserDto,
} from './dto/admin-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  listUsers(@Query() query: AdminUsersQueryDto) {
    return this.adminService.listUsers(query);
  }

  @Patch('users/:id/block')
  blockUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: BlockUserDto,
  ) {
    return this.adminService.setBlocked(id, user.id, dto);
  }

  @Get('study-sets')
  listStudySets(@Query() query: AdminStudySetsQueryDto) {
    return this.adminService.listStudySets(query);
  }

  @Delete('study-sets/:id')
  deleteStudySet(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteStudySet(id);
  }
}
