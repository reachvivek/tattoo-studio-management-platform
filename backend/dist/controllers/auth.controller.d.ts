import { Request, Response } from 'express';
export declare class AuthController {
    login(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    createAdmin(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    verify(req: Request, res: Response): Promise<void>;
}
export declare const authController: AuthController;
//# sourceMappingURL=auth.controller.d.ts.map