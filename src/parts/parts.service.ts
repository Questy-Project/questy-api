import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Part } from './entities/parts.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

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

  async getStock(userId: string): Promise<number> {
    const parts = await this.findByUserId(userId);
    return parts.stock;
  }

  async deductParts(userId: string, amount: number): Promise<Part> {
    const parts = await this.findByUserId(userId);
    parts.stock = Math.max(parts.stock - amount, 0);
    return this.partRepository.save(parts);
  }

  // Appelé chaque nuit à minuit — recharge d'1 partie les users éligibles
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async rechargeNightly(): Promise<void> {
    const allParts = await this.partRepository.find();
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    for (const part of allParts) {
      if (part.stock >= 12) continue;
      if (part.lastRechargeAt && part.lastRechargeAt > twentyFourHoursAgo) continue;
      part.stock = Math.min(part.stock +1, 12);
      part.lastRechargeAt=now;
      await this.partRepository.save(part);
    }
  }
}
