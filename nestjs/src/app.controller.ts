import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** Health check for platform probes. */
  @Get('health')
  getHealth(): { status: string } {
    return this.appService.getHealth();
  }
}
