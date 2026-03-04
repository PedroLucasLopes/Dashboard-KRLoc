import { BadRequestException } from '@nestjs/common';

export const validateCode = (equipmentCode: string): string => {
  const codeStartPattern = /^KR/gi;
  const ignoreEverythingAfterCodePrefix = equipmentCode.replace(
    /-[A-Z0-9]{3,}/gi,
    '',
  );
  const startsWithKR = codeStartPattern.test(equipmentCode);

  if (ignoreEverythingAfterCodePrefix.length < 3) {
    throw new BadRequestException('The code needs at least 3 characters');
  }

  if (!startsWithKR) {
    throw new BadRequestException('The code have to start with KR');
  }

  return ignoreEverythingAfterCodePrefix.toUpperCase();
};
