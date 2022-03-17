import { VercelRequest, VercelResponse } from '@vercel/node';
import { validate } from './http';

export const run = (
    ...predicates: ((req: VercelRequest, res: VercelResponse) => void)[]
) => (
    task: (
        req: VercelRequest,
        res: VercelResponse,
        body: unknown,
    ) => Promise<VercelResponse>,
) => (req: VercelRequest, res: VercelResponse): void => {
    if (!validate(req, res, predicates)) return;
    else void task(req, res, req.body ? req.body : undefined);
};
