import { Injectable, NotFoundException } from '@nestjs/common';
import { Accessory } from 'generated/prisma/client';
import { PrismaService } from 'src/global/prisma/prisma.service';

@Injectable()
export class AccessoryService {
  constructor(private prisma: PrismaService) {}

  public async findAll(): Promise<Accessory[]> {
    const accessories = await this.prisma.accessory.findMany();

    if (!accessories.length) {
      throw new NotFoundException('No accessories registered');
    }

    return accessories;
  }
}
