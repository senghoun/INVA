import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AcController } from './controllers/ac.controller';
import { AcService } from './services/ac.service';
import { AcRepository } from './repositories/ac.repository';
import { AcPrismaService } from './database/ac-prisma.service';
import { DealBillingConsumer } from './consumers/deal-billing.consumer';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'billing' },
      { name: 'notifications' },
    ),
  ],
  controllers: [AcController],
  providers: [AcService, AcRepository, AcPrismaService, DealBillingConsumer],
  exports: [AcService, AcRepository, AcPrismaService],
})
export class AcModule {}
