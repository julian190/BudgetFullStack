import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/server/expense - Get expenses
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const monthId = searchParams.get('monthId')
  const periodId = searchParams.get('periodId')

  try {
    const expenses = await prisma.expense.findMany({
      where: {
        userId: session.user.id,
        ...(monthId && {
          category: {
            monthId: Number(monthId)
          }
        }),
        ...(periodId && {
          periodId: Number(periodId)
        })
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        period: true
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json(expenses)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    )
  }
}

// POST /api/server/expense - Create new expense
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { description, amount, categoryId, date } = await request.json()

  try {
    // Find current period for the expense date
    const period = await prisma.period.findFirst({
      where: {
        userId: session.user.id,
        startDate: { lte: new Date(date) },
        endDate: { gte: new Date(date) }
      }
    })

    if (!period) {
      return NextResponse.json(
        { error: 'No period found for this date' },
        { status: 400 }
      )
    }

    const newExpense = await prisma.expense.create({
      data: {
        description,
        amount,
        categoryId,
        userId: session.user.id,
        periodId: period.id,
        date: new Date(date)
      }
    })

    // Create expense history
    await prisma.expenseHistory.create({
      data: {
        expenseId: newExpense.id,
        userId: session.user.id,
        description,
        amount,
        categoryId,
        date: new Date(date),
        changedAt: new Date(),
        action: 'Created'
      }
    })

    return NextResponse.json(newExpense, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    )
  }
