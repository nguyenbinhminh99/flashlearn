import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        _count: { select: { studySets: true } },
      },
    });
  }

  async create(dto: CreateCategoryDto) {
    const slug = toSlug(dto.name);
    try {
      return await this.prisma.category.create({
        data: { name: dto.name, slug },
        select: { id: true, name: true, slug: true, createdAt: true },
      });
    } catch {
      throw new ConflictException('Category name already exists');
    }
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.ensureExists(id);
    const slug = toSlug(dto.name);
    try {
      return await this.prisma.category.update({
        where: { id },
        data: { name: dto.name, slug },
        select: { id: true, name: true, slug: true, updatedAt: true },
      });
    } catch {
      throw new ConflictException('Category name already exists');
    }
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.category.delete({ where: { id } });
    return { success: true };
  }

  private async ensureExists(id: string): Promise<void> {
    const found = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!found) {
      throw new NotFoundException('Category not found');
    }
  }
}
