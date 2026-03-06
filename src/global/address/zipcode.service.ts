import { firstValueFrom } from 'rxjs';
import { ZipcodeInfo } from '../types/zipcodevalidator';
import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class ZipcodeService {
  constructor(private readonly httpService: HttpService) {}

  async getZipcode(zipcode: string): Promise<ZipcodeInfo> {
    const { data } = await firstValueFrom(
      this.httpService.get<ZipcodeInfo>(
        `${process.env.ZIPCODE_API_URL}${zipcode}/json/`,
      ),
    );

    if (!data || data.erro) {
      throw new NotFoundException('Zipcode Not Found');
    }

    return {
      ...data,
      cep: data.cep.replace(/-/g, ''),
    };
  }
}
