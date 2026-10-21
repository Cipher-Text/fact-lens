import { Controller, Get } from '@nestjs/common';
import type { Principal } from '@fact-lens/contracts';
import { CurrentPrincipal } from './decorators';

@Controller('me')
export class MeController {
  @Get()
  me(@CurrentPrincipal() principal: Principal): Principal {
    return principal;
  }
}
