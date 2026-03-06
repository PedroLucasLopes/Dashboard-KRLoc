import { BadRequestException, Injectable } from '@nestjs/common';
import { Addressable } from '../types/addressable';
import { compareAddress } from '../utils/compareAddress.utils';
import { NormalizedAddress } from '../types/normalizedAddress';

@Injectable()
export class AddressValidator {
  validate(value: NormalizedAddress, address: Addressable) {
    this.validateField(value.address, address.address);
    this.validateField(value.neighborhood, address?.neighborhood);
    this.validateField(value.city, address?.city);
    this.validateField(value.state, address.state);
  }

  private validateField(value?: string | null, bodyValue?: string | null) {
    if (
      bodyValue &&
      value &&
      compareAddress(bodyValue) !== compareAddress(value)
    ) {
      throw new BadRequestException(
        `${bodyValue} dont match with this zipcode`,
      );
    }
  }
}
