import { DataSourceOptions } from 'typeorm'
import { SnakeNamingStrategy } from 'typeorm-naming-strategies'

export function buildDataSourceOptions(): DataSourceOptions {
  return {
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    namingStrategy: new SnakeNamingStrategy(),
    synchronize: false,
    logging: process.env.NODE_ENV !== 'production',
  }
}
