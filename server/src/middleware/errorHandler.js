export function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err)
  const status = err.status || err.statusCode || 500
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  })
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` })
}
