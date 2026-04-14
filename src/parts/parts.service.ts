import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Part } from './entities/parts.entity';

@Injectable()
export class PartsService {
  constructor(
    @InjectRepository(Part)
    private readonly partRepository: Repository<Part>,
  ) {}

  async findByUserId(userId: string): Promise<Part> {
    const part = await this.partRepository.findOne({ where: { userId } });
    if (!part) throw new NotFoundException('Stock de partie introuvable');
    return part;
  }

  async addParts(userId: string, amount: number): Promise<Part>{
    const parts = await this.findByUserId(userId)
    parts.stock = Math.min(parts.stock + amount, 12);
    return await this.partRepository.save(parts);

  }
}
