import { Request, Response } from 'express';
export declare class ImageController {
    getImage(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getImageMetadata(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
export declare const imageController: ImageController;
//# sourceMappingURL=image.controller.d.ts.map