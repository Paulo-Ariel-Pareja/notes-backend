import { Global, Module } from '@nestjs/common';
import { PolicyEngineService } from './policy-engine.service';
import { AbacGuard } from './guards/abac.guard';

@Global()
@Module({
  providers: [PolicyEngineService, AbacGuard],
  exports: [PolicyEngineService, AbacGuard],
})
export class AbacModule {}
