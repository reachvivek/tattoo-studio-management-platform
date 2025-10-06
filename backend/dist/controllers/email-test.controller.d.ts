import { Request, Response } from 'express';
export declare class EmailTestController {
    verifyConnection(req: Request, res: Response): Promise<void>;
    sendTest(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getConfig(req: Request, res: Response): Promise<void>;
}
export declare const emailTestController: EmailTestController;
//# sourceMappingURL=email-test.controller.d.ts.map