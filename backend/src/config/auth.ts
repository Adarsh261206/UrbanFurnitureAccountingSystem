export const authConfig = {
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-me',
  jwtExpiry: process.env.JWT_EXPIRY || '15m',
  cookieName: 'auth_token',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/api',
    maxAge: 86400,
  },
  bcryptRounds: 12,
};
