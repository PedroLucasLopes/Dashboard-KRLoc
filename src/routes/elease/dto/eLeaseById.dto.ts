import { ELease, LeaseItem, LeaseStatus } from 'generated/prisma/client';

export class ELeaseById implements ELease {
  id: string;
  startDate: Date;
  endDate: Date;
  status: LeaseStatus;
  createdAt: Date;
  updatedAt: Date;
  lesseeId: string;
  finishDate: Date | null;

  lessee: {
    id: string;
    name: string;
    address: string;
    zipcode: string;
    city: string;
    neighborhood: string;
    state: string;

    client: {
      id: string;
      name: string;
      tax_id: string;
      phone: string;
      address: string;
      zipcode: string;
      city: string;
      neighborhood: string;
      state: string;
    };
  };

  leaseItems: LeaseItem[];
}
