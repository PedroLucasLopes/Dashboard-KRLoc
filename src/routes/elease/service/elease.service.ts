import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ELease, StatusEquipment } from 'generated/prisma/client';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { FilterELeaseDto } from '../dto/filterELease.dto';
import { PaginationConfig } from 'src/global/utils/pagination.utils';
import { CreateELeaseDto } from '../dto/createELease.dto';

@Injectable()
export class ELeaseService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter: FilterELeaseDto): Promise<ELease[]> {
    const { page, limit } = PaginationConfig(filter);
    const elease = await this.prisma.eLease.findMany({
      where: {
        ...(filter?.lesseeId && {
          lesseeId: { contains: filter.lesseeId, mode: 'insensitive' },
        }),
        ...(filter?.startDate && {
          startDate: { equals: new Date(filter.startDate) },
        }),
        ...(filter?.endDate && {
          endDate: { equals: new Date(filter.endDate) },
        }),
        ...(filter?.status && {
          status: { equals: filter.status },
        }),
        ...(filter?.equipmentName && {
          equipments: {
            some: {
              name: {
                contains: filter.equipmentName,
                mode: 'insensitive',
              },
            },
          },
        }),
      },
      include: {
        lessee: {
          include: { client: true },
        },
        equipments: true,
      },
      ...(filter?.order && {
        orderBy: { startDate: filter.order },
      }),
      skip: page,
      take: limit,
    });

    if (elease.length === 0) {
      throw new NotFoundException('No equipment leases Found');
    }

    return elease;
  }

  async findById(id: string): Promise<ELease> {
    const foundELease = await this.prisma.eLease.findUnique({
      where: { id },
    });

    if (!foundELease) {
      throw new NotFoundException('This equipment does not exist');
    }

    return foundELease;
  }

  async createELease(data: CreateELeaseDto): Promise<ELease> {
    const { equipments, ...leaseData } = data;
    const createLease = await this.prisma.$transaction(async (tx) => {
      const equipmentsFound = await tx.equipment.findMany({
        where: {
          id: { in: equipments },
          status: StatusEquipment.AVAILABLE,
        },
      });
      const checkLesseeId = await tx.lessee.findUnique({
        where: { id: leaseData.lesseeId },
      });

      if (!checkLesseeId) {
        throw new NotFoundException('This lessee do not exist');
      }

      if (equipmentsFound.length < equipments.length) {
        throw new BadRequestException('Some equipments are not available');
      }

      if (checkLesseeId && equipmentsFound.length === equipments.length) {
        const createLease = await tx.eLease.create({
          data: {
            ...leaseData,
            lesseeId: checkLesseeId.id,
          },
        });

        const updated = await tx.equipment.updateMany({
          where: {
            id: { in: equipments },
            status: StatusEquipment.AVAILABLE,
          },
          data: {
            status: StatusEquipment.PENDING as StatusEquipment,
            eleaseId: createLease.id,
          },
        });

        if (updated.count !== equipments.length) {
          throw new BadRequestException(
            'Some equipments were already reserved',
          );
        }

        return createLease;
      }
    });

    if (!createLease) {
      throw new InternalServerErrorException('Something went wrong!');
    }

    return createLease;
  }

  //   async updateELease(id: string, data: EditELeaseDto): Promise<ELease> {}

  //   async deleteELease(id: string): Promise<void> {}
}
