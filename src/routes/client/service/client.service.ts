import { Injectable, NotFoundException } from '@nestjs/common';
import { Client } from 'generated/prisma/client';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { PaginationConfig } from 'src/global/utils/pagination.utils';
import { FilterClientDTO } from '../dto/filterclient.dto';
import { CreateClientDto } from '../dto/createClient.dto';
import { EditClientDto } from '../dto/editClient.dto';

@Injectable()
export class ClientService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter: FilterClientDTO): Promise<Client[]> {
    const { page, limit } = PaginationConfig(filter);

    const clients = await this.prisma.client.findMany({
      where: {
        ...(filter?.name && {
          name: { contains: filter.name, mode: 'insensitive' },
        }),
        ...(filter?.email && {
          email: { contains: filter.email, mode: 'insensitive' },
        }),
        ...(filter?.taxId && {
          taxId: { contains: filter.taxId },
        }),
      },
      ...(filter?.order && {
        orderBy: { name: filter.order },
      }),
      skip: page,
      take: limit,
    });

    if (clients.length === 0) {
      throw new NotFoundException('No clients found');
    }

    return clients;
  }

  async findById(id: string): Promise<Client> {
    const client = await this.prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      throw new NotFoundException(`Client not found`);
    }

    return client;
  }

  async createClient(data: CreateClientDto): Promise<Client> {
    const client = await this.prisma.client.create({
      data,
    });

    return client;
  }

  async updateClient(id: string, data: EditClientDto): Promise<Client> {
    const updateData: EditClientDto = { ...data };
    const client = await this.prisma.client.update({
      where: { id },
      data: updateData,
    });

    return client;
  }

  async deleteClient(id: string): Promise<void> {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: { lessees: true },
    });

    if (client && client.lessees.length > 0) {
      throw new NotFoundException(
        'This client has associated lessees and cannot be deleted',
      );
    }

    await this.prisma.client.delete({
      where: { id },
    });
  }
}
