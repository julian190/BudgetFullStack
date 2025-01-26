import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    const logs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { userId: userId },
          {
            user: {
              budgetShares: {
                some: {
                  sharedWithUserId: userId
                }
              }
            }
          }
        ]
      },
      include: {
        user: {
          select: {
            email: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 100
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error('Failed to fetch audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}
