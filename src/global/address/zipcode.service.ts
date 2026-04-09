import { firstValueFrom } from 'rxjs';
import { ZipcodeInfo } from '../types/zipcodevalidator';
import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ZipcodeService {
  private zipcodeApi: string;
  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {
    this.zipcodeApi = this.config.getOrThrow('ZIPCODE_API_URL');
  }

  async getZipcode(zipcode: string): Promise<ZipcodeInfo> {
    const { data } = await firstValueFrom(
      this.httpService.get<ZipcodeInfo>(`${this.zipcodeApi}/${zipcode}/json/`),
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
