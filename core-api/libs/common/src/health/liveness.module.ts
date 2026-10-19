import { Controller, Get, Module } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class LivenessController {
  @Get('live')
  @SkipThrottle()
  @ApiOperation({ summary: 'Process liveness; does not probe remote dependencies' })
  getLiveness() {
    return { status: 'OK' };
  }
}

@Module({ controllers: [LivenessController] })
export class LivenessModule {}
