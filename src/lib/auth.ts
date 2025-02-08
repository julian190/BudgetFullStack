import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "./prisma"
import bcrypt from "bcryptjs"
import { CreateMonthAndPeriods } from "./CreatePeriods"
import crypto from 'crypto'

// Extend the built-in Session type to include user data
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

// Configure NextAuth.js
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(credentials.email)) {
          throw new Error("Please enter a valid email address")
        }

        // Validate password strength
        if (credentials.password.length < 6) {
          throw new Error("Password must be at least 6 characters")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (user) {
          // Existing user - verify password
          const isValid = await bcrypt.compare(credentials.password, user.password!)
          if (!isValid) {
            throw new Error("Invalid password")
          }

          // Check and create default settings if they don't exist
          // const existingSettings = await prisma.budgetSetting.findUnique({
          //   where: { userId: user.id }
          // })
          
       
            await prisma.budgetSetting.upsert({
              where: { id: user.id },
              update: {
                ConfigName: "CycleStartDayNumber",
                ConfigValue: "25"
              },
              create: {
                userId: user.id,
                ConfigName: "CycleStartDayNumber",
                ConfigValue: "25"
              }
            })
            await prisma.budgetSetting.upsert({
              where: { id: user.id },
              update: {
                ConfigName: "CycleStartDayName",
                ConfigValue: "0"
              },
              create: {
                userId: user.id,
                ConfigName: "CycleStartDayName",
                ConfigValue: "0"
              }
            })
          
           await  CreateMonthAndPeriods(user.id)
          return user
        } else {
          // New user - create account
          const hashedPassword = await bcrypt.hash(credentials.password, 12)
          const newUser = await prisma.user.create({
            data: {
              email: credentials.email,
              password: hashedPassword,
              name: credentials.email.split('@')[0] // Default name
            }
          })

          // Create default settings for new user
          await prisma.budgetSetting.create({
            data: {
              userId: newUser.id,
              ConfigName: "CycleStartDayNumber",
              ConfigValue: "25"
            }
          })
          await prisma.budgetSetting.create({
            data: {
              userId: newUser.id,
              ConfigName: "CycleStartDayName",
              ConfigValue: "0"
            }
          })

          await  CreateMonthAndPeriods(newUser.id)


          return newUser
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === 'production'
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === 'production'
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  secret: process.env.NEXTAUTH_SECRET || crypto.randomUUID(), // Use a dynamic secret for development
  callbacks: {
    async session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
    signOut: "/login"
  },
  events: {
    signOut: async ({ token }) => {
      if (token?.sub) {
        await prisma.session.deleteMany({
          where: {
            userId: token.sub
          }
        })
      }
    }
  }
}
