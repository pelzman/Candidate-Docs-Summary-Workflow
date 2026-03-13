import 'dotenv/config';
import { DataSource } from 'typeorm';

import { getTypeOrmOptions } from './typeorm.options';

const dataSource = new DataSource(
  getTypeOrmOptions(process.env.DATABASE_URL as string)
);

export default dataSource;
