import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditAction,
  ELease,
  LeaseStatus,
  Prisma,
  StatusEquipment,
} from 'generated/prisma/client';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { FilterELeaseDto } from '../dto/filterELease.dto';
import { PaginationConfig } from 'src/global/utils/pagination.utils';
import { CreateELeaseDto } from '../dto/createELease.dto';
import { AddEquipmentsDto } from '../dto/addEquipments.dto';

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
        leaseItems: true,
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
      include: {
        lessee: {
          include: { client: true },
        },
        leaseItems: true,
      },
    });

    if (!foundELease) {
      throw new NotFoundException('This equipment does not exist');
    }

    return foundELease;
  }

  async createELease(data: CreateELeaseDto): Promise<ELease> {
    const { equipments, ...leaseData } = data;
    const createLease = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
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

          await tx.auditLog.create({
            data: {
              contractId: createLease.id,
              action: AuditAction.CONTRACT_CREATED,
              description: `Contract for ${checkLesseeId.name} created`,
              metadata: {
                equipments,
                lesseeId: checkLesseeId.id,
                lesseeName: checkLesseeId.name,
                clientId: checkLesseeId.clientId,
                startDate: createLease.startDate,
                endDate: createLease.endDate,
              },
            },
          });

          await tx.leaseItem.createMany({
            data: equipmentsFound.map((equipment) => ({
              contractId: createLease.id,
              equipmentId: equipment.id,
              equipmentName: equipment.name,
              equipmentCode: equipment.code,
              equipmentSuffix: equipment.suffix,
              p_diary: equipment.p_diary,
              p_weekly: equipment.p_weekly,
              p_biweekly: equipment.p_biweekly,
              p_monthly: equipment.p_monthly,
              p_indemnity: equipment.p_indemnity,
              startDate: leaseData.startDate,
              startStatus: StatusEquipment.PENDING,
            })),
          });

          return createLease;
        }
      },
    );

    if (!createLease) {
      throw new InternalServerErrorException('Something went wrong!');
    }

    return createLease;
  }

  async startContract(id: string): Promise<ELease> {
    const startContract = await this.prisma.$transaction(async (tx) => {
      const lease = await tx.eLease.findUnique({
        where: {
          id,
          status: LeaseStatus.PENDING,
        },
        include: {
          equipments: {
            where: {
              status: {
                not: StatusEquipment.PENDING,
              },
            },
            select: { id: true, status: true },
          },
          lessee: { select: { name: true, clientId: true } },
        },
      });

      if (!lease) {
        throw new NotFoundException('Contract not found');
      }

      if (lease.status !== LeaseStatus.PENDING) {
        throw new BadRequestException(`This contract is ${lease.status}`);
      }

      if (lease.equipments.length > 0) {
        throw new BadRequestException(
          'There are equipments associated with this contract that are not PENDING',
        );
      }

      const start = await tx.eLease.update({
        where: { id },
        data: { status: LeaseStatus.ACTIVE },
      });

      await tx.equipment.updateMany({
        where: {
          eleaseId: id,
          status: StatusEquipment.PENDING,
        },
        data: { status: StatusEquipment.LEASED },
      });

      await tx.auditLog.create({
        data: {
          contractId: id,
          action: AuditAction.CONTRACT_STARTED,
          description: `Contract for ${lease.lessee.name} started`,
          metadata: {
            contractId: id,
            reason: LeaseStatus.ACTIVE,
          },
        },
      });

      await tx.leaseItem.updateMany({
        where: { contractId: id, startStatus: StatusEquipment.PENDING },
        data: {
          startStatus: StatusEquipment.LEASED,
        },
      });

      return start;
    });

    if (!startContract) {
      throw new InternalServerErrorException('Something went wrong');
    }

    return startContract;
  }

  async cancelContract(id: string): Promise<ELease> {
    const cancelContract = await this.prisma.$transaction(async (tx) => {
      const checkContract = await tx.eLease.findFirst({
        where: {
          id,
          status: LeaseStatus.PENDING,
          equipments: {
            none: {
              status: {
                not: StatusEquipment.PENDING,
              },
            },
          },
        },
        include: {
          equipments: {
            select: { id: true },
          },
          lessee: {
            select: { id: true, name: true, clientId: true },
          },
        },
      });

      if (!checkContract) {
        throw new NotFoundException('This contract is already Active');
      }

      if (checkContract.equipments.length > 0) {
        throw new BadRequestException(
          'The contract cannot be canceled, some equipments need to be paid',
        );
      }

      const [, updatedLease] = await Promise.all([
        tx.equipment.updateMany({
          where: {
            eleaseId: id,
            status: StatusEquipment.PENDING,
          },
          data: {
            status: StatusEquipment.AVAILABLE,
            eleaseId: null,
          },
        }),

        tx.eLease.update({
          where: { id },
          data: {
            status: LeaseStatus.CANCELLED,
            finishDate: new Date(),
          },
        }),

        tx.auditLog.create({
          data: {
            contractId: id,
            action: AuditAction.CONTRACT_CANCELLED,
            description: `Contract for ${checkContract.lessee.name} is canceled`,
            metadata: {
              contractId: id,
              reason: LeaseStatus.CANCELLED,
            },
          },
        }),

        tx.leaseItem.updateMany({
          where: {
            contractId: id,
            startStatus: StatusEquipment.PENDING,
          },
          data: {
            finalStatus: StatusEquipment.AVAILABLE,
            finishDate: new Date(),
          },
        }),
      ]);

      return updatedLease;
    });

    return cancelContract;
  }

  async addEquipmentsToELease(
    id: string,
    equipmentsId: AddEquipmentsDto,
  ): Promise<ELease> {
    const addEquipments = await this.prisma.$transaction(async (tx) => {
      const checkContract = await tx.eLease.findFirst({
        where: {
          id,
          status: { in: [LeaseStatus.ACTIVE, LeaseStatus.PENDING] },
        },
        include: {
          lessee: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!checkContract) {
        throw new NotFoundException('Equipment Lease not Found');
      }

      const equipmentsFound = await tx.equipment.findMany({
        where: {
          id: { in: equipmentsId.equipments },
          status: StatusEquipment.AVAILABLE,
        },
      });

      if (equipmentsId.equipments.length > equipmentsFound.length) {
        throw new BadRequestException('Some equipments are not found');
      }

      if (equipmentsFound && checkContract) {
        const currentStatusToAdd =
          checkContract.status === LeaseStatus.PENDING
            ? StatusEquipment.PENDING
            : StatusEquipment.LEASED;
        const [addEquipments, ,] = await Promise.all([
          tx.eLease.update({
            where: { id },
            data: {
              equipments: {
                connect: equipmentsId.equipments.map((id) => ({ id })),
              },
            },
          }),

          tx.equipment.updateMany({
            where: {
              id: { in: equipmentsId.equipments },
              status: StatusEquipment.AVAILABLE,
            },
            data: { status: currentStatusToAdd },
          }),

          tx.auditLog.create({
            data: {
              contractId: id,
              action: AuditAction.EQUIPMENT_ADDED,
              description: `Contract for ${checkContract.lessee.name} added some equipments`,
              metadata: {
                contractId: id,
                equipments: equipmentsFound,
              },
            },
          }),

          tx.leaseItem.createMany({
            data: equipmentsFound.map((equipment) => ({
              contractId: checkContract.id,
              equipmentId: equipment.id,
              equipmentName: equipment.name,
              equipmentCode: equipment.code,
              equipmentSuffix: equipment.suffix,
              p_diary: equipment.p_diary,
              p_weekly: equipment.p_weekly,
              p_biweekly: equipment.p_biweekly,
              p_monthly: equipment.p_monthly,
              p_indemnity: equipment.p_indemnity,
              startDate: checkContract.startDate,
              startStatus: currentStatusToAdd,
            })),
          }),
        ]);

        return addEquipments;
      }
    });

    if (!addEquipments) {
      throw new InternalServerErrorException('Something went wrong');
    }

    return addEquipments;
  }

  //   async deleteELease(id: string): Promise<void> {}
}
