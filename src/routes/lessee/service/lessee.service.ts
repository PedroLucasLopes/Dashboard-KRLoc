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
import { EditLesseeDto } from '../dto/editLessee.dto';
import { ZipcodeService } from 'src/global/address/zipcode.service';
import { AddressValidator } from 'src/global/address/address.validator';
import { normalizeApiAddress } from 'src/global/utils/normalizeApiAddress.utils';

@Injectable()
export class LesseeService {
  constructor(
    private prisma: PrismaService,
    private zipcodeService: ZipcodeService,
    private addressValidator: AddressValidator,
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
      include: { eleases: true },
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
      throw new NotFoundException('This client does not exist');
    }

    if (client?.lessees.length === 0) {
      throw new NotFoundException(`${client.name} does not have any lessees`);
    }

    return client;
  }

  async createLessee(data: CreateLesseeDTO): Promise<Lessee> {
    const clientIdExists = await this.prisma.client.findUnique({
      where: { id: data.clientId },
    });

    if (!clientIdExists) {
      throw new BadRequestException('This client does not exist!');
    }

    const zipCode = await this.zipcodeService.getZipcode(data.zipcode);

    this.addressValidator.validate(normalizeApiAddress(zipCode), data);

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

  async updateLessee(id: string, data: EditLesseeDto): Promise<Lessee> {
    const lesseeExists = await this.prisma.lessee.findUnique({
      where: { id },
    });

    if (!lesseeExists) {
      throw new BadRequestException('This lessee does not exist!');
    }

    this.addressValidator.validate(
      {
        address: lesseeExists.address,
        city: lesseeExists.city,
        state: lesseeExists?.state,
        neighborhood: lesseeExists?.neighborhood,
      },
      data,
    );

    const validatedData: EditLesseeDto = { ...data };

    const bodyZipCode = data.zipcode && data.zipcode.replace(/-/g, '');

    if (data.zipcode && bodyZipCode !== lesseeExists.zipcode) {
      const zipCode = await this.zipcodeService.getZipcode(data.zipcode);
      this.addressValidator.validate(normalizeApiAddress(zipCode), data);
      Object.assign(validatedData, {
        zipcode: zipCode.cep,
        address: zipCode.logradouro ?? data.address,
        city: zipCode.localidade ?? data.city,
        neighborhood: zipCode.bairro ?? data.neighborhood,
        state: zipCode.uf ?? data.state,
      });
    }

    if (data.clientId) {
      const clientExists = await this.prisma.client.findUnique({
        where: { id: data.clientId },
      });

      if (!clientExists) {
        throw new NotFoundException('Client Not Found!');
      }

      if (clientExists && id !== clientExists.id) {
        throw new BadRequestException('Lessee cant change of owner');
      }

      Object.assign(validatedData, {
        ...validatedData,
        clientId: clientExists.id,
      });
    }

    const editLessee = this.prisma.lessee.update({
      where: { id },
      data: validatedData,
    });

    return editLessee;
  }

  async deleteLessee(id: string): Promise<void> {
    const haveAELease = await this.prisma.lessee.findUnique({
      where: { id },
      include: { eleases: true },
    });

    if (haveAELease?.eleases !== null) {
      throw new BadRequestException('This lessee have an ongoing contract');
    }

    return;
  }
}
