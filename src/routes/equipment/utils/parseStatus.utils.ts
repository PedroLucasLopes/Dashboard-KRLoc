import { StatusEquipment } from 'generated/prisma/enums';

export const parseStatus = (status?: StatusEquipment) => {
  const normalized = status?.trim().toUpperCase();

  if (!Object.values(StatusEquipment).includes(normalized as StatusEquipment)) {
    return StatusEquipment.AVAILABLE;
  }

  return normalized as StatusEquipment;
};
