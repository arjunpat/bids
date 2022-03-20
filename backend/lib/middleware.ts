import { Response, NextFunction } from "express";
import { Request } from "../types";
import * as responses from "../lib/responses";
import jwt from "jsonwebtoken";

import { JWT_SECRET } from "./config";

export function auth(req: Request, res: Response, next: NextFunction) {
  try {
    let contents: any = jwt.verify(req.cookies.bids_, JWT_SECRET);
    req.uid = contents.uid;
    next();
  } catch (e) {
    res.status(403).send(responses.error("cookie"));
  }
}