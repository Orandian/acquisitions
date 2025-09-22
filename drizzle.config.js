import 'dotenv/config';

export default {
  schema: './src/models/*.js',
  out: './drizzle',
  dialect: 'postgresql',
  // Force drizzle-kit to use the Node 'pg' driver for migrations
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
};
