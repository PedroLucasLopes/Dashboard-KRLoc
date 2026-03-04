import { PaginationDTO } from 'src/dto/PaginationDTO.dto';

type PaginationType = {
  page: number;
  limit: number;
};

export const PaginationConfig = (
  paginationDto?: PaginationDTO,
): PaginationType => {
  const paginationRegister = Math.max(Number(paginationDto?.page) || 1, 1);
  const paginationInterval = Math.max(Number(paginationDto?.limit) || 10, 1);

  const page = Number(paginationInterval) || 10;
  const limit =
    ((Number(paginationRegister) || 1) - 1) *
    (Number(paginationInterval) || 10);

  return { page, limit };
};
