import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'


// Define schema for expense creation
const ExpenseCreateSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1).max(255),
  date: z.string().datetime(),
  categoryId: z.string().uuid(),
  periodId: z.string().uuid(),
  userId: z.string().uuid()
})

// GET /api/expenses - Get all expenses
export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      include: {
        category: true,
        period: true
      }
    })
    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Failed to fetch expenses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    )
  }
}

// POST /api/expenses - Create new expense
export async function POST(request: Request) {
  try {

    const session = await getServerSession(authOptions)
    const body = await request.json()

      if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
      const ExpenseDate:Date = new Date(body.date)

    
      const Period = await prisma.period.findFirst({
        where: {
          userId: user.id,
          startDate: { gte: ExpenseDate }, // 'gte' means 'greater than or equal'
          endDate: { lt: ExpenseDate },   // 'lt' means 'less than'
        },
      });
      
    if (!Period) {
      return NextResponse.json({ error: 'Period not found' }, { status: 404 })
    }
    const validation = ExpenseCreateSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid expense data', details: validation.error },
        { status: 400 }
      )
    }

    const { amount, description, date, categoryId, periodId, userId } = validation.data

    const newExpense = await prisma.expense.create({
      data: {
        amount,
        description,
        date: new Date(date),
        categoryId,
        periodId:Period.id,
        userId
      }
    })
    console.debug(periodId)
    return NextResponse.json(newExpense, { status: 201 })
  } catch (error) {
    console.error('Failed to create expense:', error)
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    )
  }
}
