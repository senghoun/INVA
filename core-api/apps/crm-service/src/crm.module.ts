import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CrmController } from './controllers/crm.controller';
import { CrmService } from './services/crm.service';
import { CrmRepository } from './repositories/crm.repository';
import { CrmPrismaService } from './database/crm-prisma.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'billing',
    }),
  ],
  controllers: [CrmController],
  providers: [CrmService, CrmRepository, CrmPrismaService],
  exports: [CrmService, CrmRepository, CrmPrismaService],
})
export class CrmModule {}
