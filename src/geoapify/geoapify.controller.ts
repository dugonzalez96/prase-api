import { Controller, Get, Query } from '@nestjs/common';
import { GeoapifyService } from './geoapify.service';

@Controller('geoapify')
export class GeoapifyController {
  constructor(private readonly geoapifyService: GeoapifyService) {}

  @Get('autocomplete')
  getAutocomplete(@Query('query') query: string) {
    return this.geoapifyService.getAutocomplete(query);
  }
}
