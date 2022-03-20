import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

const app: express.Application = express();

app.use(express.json());
app.use(cookieParser());
app.use(helmet());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Headers', 'content-type,authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.headers.origin)
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);

  next();
});

import auth from './routes/auth';
app.use('/auth', auth);

app.all('*', (_, res) => {
  res.status(404).send({
    success: false,
    error: 'not_found'
  });
});

app.listen(process.env.PORT, () => {
  console.log('Server started', process.env.PORT);
});

export default app;