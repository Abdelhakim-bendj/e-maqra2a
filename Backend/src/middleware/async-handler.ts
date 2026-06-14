import { NextFunction, Request, Response } from 'express';

export function asyncHandler<TReq extends Request = Request>(
  handler: (req: TReq, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    void handler(req as TReq, res, next).catch(next);
  };
}
