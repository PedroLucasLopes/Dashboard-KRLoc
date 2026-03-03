import { BadRequestException } from '@nestjs/common';

export const validateCode = (equipmentCode: string): string => {
  const codeStartPattern = /^KR/gi;
  const startsWithKR = codeStartPattern.test(equipmentCode);

  if (equipmentCode.length < 3) {
    throw new BadRequestException('The code needs at least 3 characters');
  }

  if (!startsWithKR) {
    throw new BadRequestException('The code have to start with KR');
  }

  return equipmentCode.toUpperCase();
};
