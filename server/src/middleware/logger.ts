import { Request, Response, NextFunction } from 'express';

// Request logging middleware
export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || Math.random().toString(36).substring(7);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';

    console.log(JSON.stringify({
      level,
      timestamp: new Date().toISOString(),
      requestId,
      method: req.method,
      path: req.path,
      status,
      duration: `${duration}ms`,
      userAgent: req.headers['user-agent']
    }));
  });

  next();
}

// Error handling and recovery middleware
export function errorHandlerMiddleware(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const timestamp = new Date().toISOString();
  const requestId = req.headers['x-request-id'] || Math.random().toString(36).substring(7);

  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: any = {};

  if (error instanceof Error) {
    message = error.message;
    details = {
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };

    // Handle specific error types
    if (error.message.includes('validation')) {
      statusCode = 400;
    } else if (error.message.includes('not found')) {
      statusCode = 404;
    } else if (error.message.includes('unauthorized')) {
      statusCode = 401;
    } else if (error.message.includes('forbidden')) {
      statusCode = 403;
    }
  }

  console.error(JSON.stringify({
    level: 'error',
    timestamp,
    requestId,
    method: req.method,
    path: req.path,
    statusCode,
    message,
    error: details
  }));

  res.status(statusCode).json({
    error: {
      message,
      timestamp,
      requestId
    }
  });
}

// Health check logging
export function logHealthStatus(status: any) {
  console.log(JSON.stringify({
    level: 'info',
    timestamp: new Date().toISOString(),
    event: 'health_check',
    status
  }));
}
