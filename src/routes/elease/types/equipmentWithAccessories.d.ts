import { Prisma } from 'generated/prisma/client';

export type EquipmentWithAccessories = Prisma.EquipmentGetPayload<{
  include: {
    equipmentAccessories: {
      include: { accessory: true };
    };
  };
}>;
