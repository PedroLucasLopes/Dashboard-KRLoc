import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { FilterLesseeDTO } from '../dto/filterLessee.dto';
import { Client, Lessee } from 'generated/prisma/client';
import { PaginationConfig } from 'src/global/utils/pagination.utils';
import { CreateLesseeDTO } from '../dto/createLessee.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ZipcodeInfo } from '../types/zipcodevalidator';
import { normalizeAddress } from '../utils/normalizeAdress.utils';

@Injectable()
export class LesseeService {
  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {}

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

    if (client?.lessees.length === 0) {
      throw new NotFoundException(`${client.name} does not have any lessees`);
    }

    if (!client) {
      throw new NotFoundException('This client does not exist');
    }

    return client;
  }

  async createLessee(data: CreateLesseeDTO): Promise<Lessee> {
    const zipCode = await this.checkZipCode(data.zipcode);
    const clientIdExists = await this.prisma.client.findUnique({
      where: { id: data.clientId },
    });

    if (!clientIdExists) {
      throw new BadRequestException('This client does not exist!');
    }

    if (
      normalizeAddress(data.address) !== normalizeAddress(zipCode.logradouro)
    ) {
      throw new BadRequestException('The address dont match with this zipcode');
    }

    const createLessee = await this.prisma.lessee.create({
      data: {
        ...data,
        zipcode: zipCode.cep,
        address: zipCode.logradouro ?? data.address,
        city: zipCode.localidade ?? data.city,
        neighborhood: zipCode.bairro ?? data.neighborhood,
        state: zipCode.uf ?? data.state,
        clientId: clientIdExists.id,
      },
    });

    return createLessee;
  }

  async checkZipCode(zipcode: string): Promise<ZipcodeInfo> {
    const { data } = await firstValueFrom(
      this.httpService.get<ZipcodeInfo>(
        `${process.env.ZIPCODE_API_URL}${zipcode}/json/`,
      ),
    );

    if (!data || data.erro) {
      throw new BadRequestException('Invalid Zipcode');
    }

    return {
      ...data,
      cep: data.cep.replace(/-/g, ''),
    };
  }
}
