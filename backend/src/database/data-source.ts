import 'dotenv/config'
import { DataSource } from 'typeorm'
import { buildDataSourceOptions } from './typeorm.config'

export const AppDataSource = new DataSource(buildDataSourceOptions())
