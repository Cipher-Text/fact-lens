import { Controller, Get, HttpException, HttpStatus, Inject } from '@nestjs/common';
import type { LivenessResponse, ReadinessResponse } from '@fact-lens/contracts';
import { Public } from './auth/decorators';
import { HealthService } from './health.service';

@Public()
@Controller('health')
export class HealthController {
  constructor(@Inject(HealthService) private readonly health: HealthService) {}

  @Get('live')
  live(): LivenessResponse {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready(): Promise<ReadinessResponse> {
    const result = await this.health.readiness();
    if (result.status !== 'ok') {
      throw new HttpException({ message: 'Service not ready', ...result }, HttpStatus.SERVICE_UNAVAILABLE);
    }
    return result;
  }
}
