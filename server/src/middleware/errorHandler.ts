import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  statusCode?: number;
}

export function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction) {
  const status = err.statusCode ?? 500;
  res.status(status).json({
    error: err.message ?? "Error interno del servidor",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}
