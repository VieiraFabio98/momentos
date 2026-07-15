export interface IUser {
  id: string
  name: string
  email: string
  passwordHash: string | null
  createdAt: Date
  updatedAt: Date
}
