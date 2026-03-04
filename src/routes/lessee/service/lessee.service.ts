import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { FilterLesseeDTO } from '../dto/filterLessee.dto';
import { Client, Lessee } from 'generated/prisma/client';
import { PaginationConfig } from 'src/global/utils/pagination.utils';

@Injectable()
export class LesseeService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter?: FilterLesseeDTO): Promise<Lessee[]> {
    const { page, limit } = PaginationConfig(filter);

    const lessees = await this.prisma.lessee.findMany({
      where: {
        ...(filter?.name && {
          name: { contains: filter.name, mode: 'insensitive' },
        }),
        ...(filter?.address && {
          address: { contains: filter.address, mode: 'insensitive' },
        }),
        ...(filter?.zipcode && {
          zipcode: { contains: filter.zipcode, mode: 'insensitive' },
        }),
        ...(filter?.city && {
          city: { contains: filter.city, mode: 'insensitive' },
        }),
      },
      skip: page,
      take: limit,
      orderBy: { name: filter?.order },
    });

    if (lessees.length === 0) {
      throw new NotFoundException('No lessees found');
    }

    return lessees;
  }

  async findById(id: string): Promise<Lessee> {
    const lessee = await this.prisma.lessee.findUnique({
      where: { id },
    });

    if (!lessee) {
      throw new NotFoundException('This lessee does not exist');
    }

    return lessee;
  }

  async findByClient(clientId: string): Promise<Client> {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: { lessees: true },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }
}
