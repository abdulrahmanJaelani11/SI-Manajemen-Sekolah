import jwt, { SignOptions } from 'jsonwebtoken'

export const JWT_SECRET = process.env.JWT_SECRET || 'sekolah_jwt_secret_terpadu_w98f23f8h923hr89fhwef78923h'
export const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '1d') as SignOptions['expiresIn']

export interface JwtPayloadUser {
  userId: number
  username: string
  namaLengkap: string
  roleId: number
  roleName: string
}

export interface JwtPayloadSiswa {
  role: 'siswa'
  siswaId: number
  nis: string
  nama: string
  kelasId: number | null
}

export function signToken(payload: JwtPayloadUser | any, expiresIn?: SignOptions['expiresIn']): string {
  const options: SignOptions = {
    expiresIn: expiresIn || JWT_EXPIRES_IN,
  }
  return jwt.sign(payload, JWT_SECRET, options)
}

export function verifyToken<T = JwtPayloadUser>(token: string): T | null {
  try {
    return jwt.verify(token, JWT_SECRET) as T
  } catch (error) {
    return null
  }
}
