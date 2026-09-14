import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class ReorderFlashcardsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  readonly orderedIds!: string[];
}
