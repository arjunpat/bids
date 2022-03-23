export const JWT_SECRET: string = process.env.JWT_SECRET || "";
export const MONGO_URI: string = process.env.MONGO_URI || "";
export const NODE_ENV: string = process.env.NODE_ENV || "";

if (NODE_ENV !== 'production' && NODE_ENV !== 'development') {
  throw new Error('NODE_ENV must be set to either "production" or "development"');
}
console.log('Running in', NODE_ENV, 'mode');