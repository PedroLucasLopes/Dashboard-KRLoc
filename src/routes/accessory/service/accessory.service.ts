import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Accessory } from 'generated/prisma/client';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { PaginationConfig } from 'src/global/utils/pagination.utils';
import { FilterAccessory } from '../dto/filterAccessory.dto';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { CsvImport } from 'src/global/types/csvImport';

@Injectable()
export class AccessoryService {
  constructor(private prisma: PrismaService) {}

  public async findAll(filter: FilterAccessory): Promise<Accessory[]> {
    const { page, limit } = PaginationConfig(filter);
    const accessories = await this.prisma.accessory.findMany({
      where: {
        ...(filter?.name && {
          name: { contains: filter.name, mode: 'insensitive' },
        }),
      },
      ...(filter?.order && {
        orderBy: { id: filter.order },
      }),
      skip: page,
      take: limit,
    });

    if (!accessories.length) {
      throw new NotFoundException('No accessories registered');
    }

    return accessories;
  }

  public async findById(id: string): Promise<Accessory> {
    const accessory = await this.prisma.accessory.findUnique({ where: { id } });

    if (!accessory) {
      throw new NotFoundException('Accessory not found');
    }

    return accessory;
  }

  public async createAccessory(data: Accessory): Promise<Accessory> {
    const createAccessory = await this.prisma.accessory.create({ data });
    return createAccessory;
  }

  async importCsv(file: Express.Multer.File): Promise<CsvImport> {
    if (!file) {
      throw new NotFoundException('No file uploaded');
    }

    const CHUNK_SIZE = 1000;
    let batch: Accessory[] = [];
    let totalInserted = 0;

    const stream = Readable.from(file.buffer).pipe(csv());

    await new Promise<void>((resolve, reject) => {
      const processBatch = async () => {
        const formattedBatch = batch.map((item) => ({
          ...item,
          name: item?.name,
          quantity: Number(item?.quantity),
          p_indemnity: Number(String(item?.p_indemnity).replace(/[=,]/g, '')),
        }));

        const result = await this.prisma.accessory.createMany({
          data: formattedBatch,
          skipDuplicates: true,
        });

        totalInserted += result.count;
        batch = [];
      };

      stream.on('data', (data: Accessory) => {
        stream.pause();

        batch.push(data);

        if (batch.length >= CHUNK_SIZE) {
          processBatch()
            .then(() => stream.resume())
            .catch(reject);
        } else {
          stream.resume();
        }
      });

      stream.on('end', () => {
        if (batch.length > 0) {
          processBatch()
            .then(() => resolve())
            .catch(reject);
        } else {
          resolve();
        }
      });

      stream.on('error', reject);
    });

    return {
      message: 'CSV imported successfully',
      registers: totalInserted,
      statusCode: HttpStatus.CREATED,
    };
  }

  public async updateAccessory(
    id: string,
    data: Accessory,
  ): Promise<Accessory> {
    const findAccessory = await this.prisma.accessory.findUnique({
      where: { id },
    });

    if (!findAccessory) {
      throw new NotFoundException('Accessory not found');
    }

    if (data.quantity < findAccessory.quantity) {
      throw new BadRequestException(
        'You cant change quantity to less than you already have',
      );
    }

    const updateAccessory = await this.prisma.accessory.update({
      where: { id },
      data,
    });

    return updateAccessory;
  }

  public async deleteAccessory(id: string): Promise<void> {
    const findAccessory = await this.prisma.accessory.findUnique({
      where: { id },
      include: { equipments: true },
    });

    if (!findAccessory) {
      throw new NotFoundException('Accessory not found');
    }

    if (findAccessory.equipments.length > 0) {
      throw new BadRequestException(
        'You have equipments associated with this accessory',
      );
    }

    if (findAccessory.quantity > 0) {
      await this.prisma.accessory.update({
        where: { id },
        data: {
          quantity: findAccessory.quantity - 1,
        },
      });

      return;
    }

    await this.prisma.accessory.delete({ where: { id } });

    return;
  }
}
