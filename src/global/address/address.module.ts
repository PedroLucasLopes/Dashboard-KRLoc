import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ZipcodeService } from './zipcode.service';
import { AddressValidator } from './address.validator';

@Module({
  imports: [HttpModule],
  providers: [ZipcodeService, AddressValidator],
  exports: [ZipcodeService, AddressValidator],
})
export class AddressModule {}
