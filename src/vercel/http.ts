import { VercelRequest, VercelResponse } from '@vercel/node';

export function validate(
    req: VercelRequest,
    res: VercelResponse,
    predicates: ((req: VercelRequest, res: VercelResponse) => void)[],
): boolean {
    return predicates.every((f) => {
        return f(req, res) === void 0;
    });
}

export const cache = (seconds: number) => (
    req: VercelRequest,
    res: VercelResponse
): VercelResponse | void => {
    res.setHeader("Cache-Control", `s-maxage=${seconds}`);
    return void 0
}

export function get(req: VercelRequest, res: VercelResponse): VercelResponse | void {
    if (req.method.toLowerCase() !== 'get') {
        return res.status(404).json({ error: 'page not found' });
    }
}