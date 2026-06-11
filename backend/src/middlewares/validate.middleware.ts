import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { asyncHandler } from "./async.middleware";

export const validateRequest = (
  schema: ZodSchema,
  target: "body" | "query" | "params" = "body",
) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const result = await schema.safeParseAsync(req[target]);

    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: (result as any)?.error?.errors?.map((err: any) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    if (target === "body") {
      req.body = result.data;
    } else if (req[target]) {
      Object.keys(req[target]).forEach((key) => delete req[target][key]);
      Object.assign(req[target], result.data);
    }

    next();
  });
};
