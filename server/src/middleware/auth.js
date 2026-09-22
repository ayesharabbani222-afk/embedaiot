import jwt from 'jsonwebtoken'

export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. No Bearer token provided.' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'embed_aiot_super_secret_jwt_key_2026_production')
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' })
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated.' })
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Requires one of: [${allowedRoles.join(', ')}]` })
    }
    next()
  }
}

export function tenantScope(req, res, next) {
  if (!req.user) return next()
  if (req.user.role === 'admin') {
    // Super Admin can view all or filter by query param ?orgId=...
    req.orgId = req.query.orgId ? parseInt(req.query.orgId, 10) : null
  } else {
    // Non-admin is strictly scoped to their assigned org_id
    req.orgId = req.user.org_id
  }
  next()
}
