import { Module } from '@nestjs/common';
import { ItController } from './controllers/it.controller';
import { ItPrismaService } from './database/it-prisma.service';

@Module({
  controllers: [ItController],
  providers: [ItPrismaService],
  exports: [ItPrismaService],
})
export class ItModule {}
