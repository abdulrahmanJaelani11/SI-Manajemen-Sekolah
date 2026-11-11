import jwt, { SignOptions } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_jwt_sekolah_super_aman_2026_change_in_production'
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn']

export interface JwtPayloadUser {
  userId: number
  username: string
  namaLengkap: string
  roleId: number
  roleName: string
}

export function signToken(payload: JwtPayloadUser): string {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN,
  }
  return jwt.sign(payload, JWT_SECRET, options)
}

export function verifyToken(token: string): JwtPayloadUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayloadUser
  } catch (error) {
    return null
  }
}
