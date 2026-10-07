import { BadRequestException } from '@nestjs/common';
import { EvolutionQueryDto } from './dto';

export function evolutionRange(query: EvolutionQueryDto) {
  if (query.from && query.to && query.from > query.to) throw new BadRequestException('O início do período deve ser anterior ao fim.');
  return { gte: query.from ? new Date(`${query.from}T00:00:00Z`) : undefined, lte: query.to ? new Date(`${query.to}T00:00:00Z`) : undefined };
}
