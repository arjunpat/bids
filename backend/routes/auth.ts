import { Router } from 'express';
import * as responses from '../lib/responses';
const router = Router();

router.get('/test', (req, res) => {
  res.send(responses.success('testing'));
});

export default router;