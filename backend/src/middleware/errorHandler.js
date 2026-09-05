export function errorHandler(err, req, res, next) {
  console.error(`[API Error] ${req.method} ${req.url}:`, err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    status: 'error',
    error: err.name || 'ServerError',
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
}
