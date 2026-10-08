import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { StudySetsModule } from './study-sets/study-sets.module';
import { FlashcardsModule } from './flashcards/flashcards.module';
import { AdminModule } from './admin/admin.module';
import { StudyProgressModule } from './study-progress/study-progress.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    StudySetsModule,
    FlashcardsModule,
    AdminModule,
    StudyProgressModule,
  ],
})
export class AppModule {}
