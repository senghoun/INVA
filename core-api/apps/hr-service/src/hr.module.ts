import { HrCompanyGuard } from './guards/hr-company.guard';
import { EmployeeAccessService } from './services/employee-access.service';
import { HrPermissionsGuard } from './guards/hr-permissions.guard';
import { Module } from '@nestjs/common';
import { HrController } from './controllers/hr.controller';
import { OrganizationController } from './controllers/organization.controller';
import { AttendanceController } from './controllers/attendance.controller';
import { LeaveController } from './controllers/leave.controller';

import { HrService } from './services/hr.service';
import { HrConfigService } from './services/hr-config.service';
import { OrganizationService } from './services/organization.service';
import { AttendanceService } from './services/attendance.service';
import { LeaveService } from './services/leave.service';

import { HrRepository } from './repositories/hr.repository';
import { OrganizationRepository } from './repositories/organization.repository';
import { AttendanceRepository } from './repositories/attendance.repository';
import { LeaveRepository } from './repositories/leave.repository';

import { HrPrismaService } from './database/hr-prisma.service';

@Module({
  controllers: [
    HrController,
    OrganizationController,
    AttendanceController,
    LeaveController,
  ],
  providers: [
    HrPermissionsGuard,
    HrCompanyGuard,
    EmployeeAccessService,
    HrService,
    HrConfigService,
    OrganizationService,
    AttendanceService,
    LeaveService,
    HrRepository,
    OrganizationRepository,
    AttendanceRepository,
    LeaveRepository,
    HrPrismaService,
  ],
  exports: [
    HrService,
    HrConfigService,
    OrganizationService,
    AttendanceService,
    LeaveService,
    HrPrismaService,
  ],
})
export class HrModule {}
