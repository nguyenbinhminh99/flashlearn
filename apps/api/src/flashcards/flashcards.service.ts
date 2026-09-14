import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/types/auth-user';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UpdateFlashcardDto } from './dto/update-flashcard.dto';
import { ReorderFlashcardsDto } from './dto/reorder-flashcards.dto';

const cardSelect = {
  id: true,
  front: true,
  back: true,
  imageUrl: true,
  position: true,
  studySetId: true,
} as const;

@Injectable()
export class FlashcardsService {
  constructor(private readonly prisma: PrismaService) {}

  async listByStudySet(studySetId: string, user: AuthUser | null) {
    await this.assertCanReadStudySet(studySetId, user);
    return this.prisma.flashcard.findMany({
      where: { studySetId },
      orderBy: { position: 'asc' },
      select: cardSelect,
    });
  }

  async create(studySetId: string, user: AuthUser, dto: CreateFlashcardDto) {
    await this.assertCanMutateStudySet(studySetId, user);
    const max = await this.prisma.flashcard.aggregate({
      where: { studySetId },
      _max: { position: true },
    });
    const position = (max._max.position ?? -1) + 1;
    return this.prisma.flashcard.create({
      data: {
        studySetId,
        front: dto.front,
        back: dto.back,
        imageUrl: dto.imageUrl ?? null,
        position,
      },
      select: cardSelect,
    });
  }

  async update(id: string, user: AuthUser, dto: UpdateFlashcardDto) {
    const card = await this.getCardWithOwner(id);
    this.assertOwnerOrAdmin(card.studySet.ownerId, user);
    return this.prisma.flashcard.update({
      where: { id },
      data: {
        front: dto.front,
        back: dto.back,
        imageUrl: dto.imageUrl === undefined ? undefined : dto.imageUrl,
      },
      select: cardSelect,
    });
  }

  async remove(id: string, user: AuthUser) {
    const card = await this.getCardWithOwner(id);
    this.assertOwnerOrAdmin(card.studySet.ownerId, user);
    await this.prisma.flashcard.delete({ where: { id } });
    return { success: true };
  }

  async reorder(
    studySetId: string,
    user: AuthUser,
    dto: ReorderFlashcardsDto,
  ) {
    await this.assertCanMutateStudySet(studySetId, user);
    const existing = await this.prisma.flashcard.findMany({
      where: { studySetId },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((c) => c.id));
    if (
      dto.orderedIds.length !== existingIds.size ||
      dto.orderedIds.some((id) => !existingIds.has(id))
    ) {
      throw new BadRequestException(
        'orderedIds must include every card in the study set exactly once',
      );
    }

    await this.prisma.$transaction(
      dto.orderedIds.map((id, index) =>
        this.prisma.flashcard.update({
          where: { id },
          data: { position: index },
        }),
      ),
    );

    return this.prisma.flashcard.findMany({
      where: { studySetId },
      orderBy: { position: 'asc' },
      select: cardSelect,
    });
  }

  private async getCardWithOwner(id: string) {
    const card = await this.prisma.flashcard.findUnique({
      where: { id },
      select: {
        id: true,
        studySet: { select: { ownerId: true, id: true } },
      },
    });
    if (!card) {
      throw new NotFoundException('Flashcard not found');
    }
    return card;
  }

  private async assertCanReadStudySet(
    studySetId: string,
    user: AuthUser | null,
  ): Promise<void> {
    const studySet = await this.prisma.studySet.findUnique({
      where: { id: studySetId },
      select: { id: true, isPublic: true, ownerId: true },
    });
    if (!studySet) {
      throw new NotFoundException('Study set not found');
    }
    if (studySet.isPublic) {
      return;
    }
    if (!user) {
      throw new ForbiddenException('This study set is private');
    }
    if (studySet.ownerId !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('This study set is private');
    }
  }

  private async assertCanMutateStudySet(
    studySetId: string,
    user: AuthUser,
  ): Promise<void> {
    const studySet = await this.prisma.studySet.findUnique({
      where: { id: studySetId },
      select: { id: true, ownerId: true },
    });
    if (!studySet) {
      throw new NotFoundException('Study set not found');
    }
    this.assertOwnerOrAdmin(studySet.ownerId, user);
  }

  private assertOwnerOrAdmin(ownerId: string, user: AuthUser): void {
    if (ownerId !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You do not own this study set');
    }
  }
}
