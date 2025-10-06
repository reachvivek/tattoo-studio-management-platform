import { Request, Response } from 'express';
export declare class LeadController {
    create(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getAll(req: Request, res: Response): Promise<void>;
    getById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateStatus(req: Request, res: Response): Promise<void>;
}
export declare const leadController: LeadController;
//# sourceMappingURL=lead.controller.d.ts.map