import { validateEnvironment, LivenessModule } from '@common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '@common';
import { GatewayController } from './controllers/gateway.controller';
import { DocsController } from './controllers/docs.controller';

@Module({
  providers: [JwtStrategy],
  imports: [
    LivenessModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
      validate: validateEnvironment('api-gateway'),
    }),
  ],
  controllers: [GatewayController, DocsController],
})
export class AppModule {}
