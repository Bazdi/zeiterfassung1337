import { Role } from "@prisma/client"
import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      username: string
      role: Role
    }
  }

  interface User {
    id: string
    username: string
    role: Role
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role
    username: string
  }
}
