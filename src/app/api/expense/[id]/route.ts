import { NextRequest,NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const month = searchParams.get('MonthID')
    const periodId = searchParams.get('PeriodID')
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
      user: {
        email: session.user.email
      }
    }

    if (month) {
      whereClause.period = { monthId: month }
    } else if (periodId) {
      whereClause.period = { id: periodId }
    } else {
      whereClause.period = {
        month: {
          active: true
        }
      }
    }
    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        category: true,
        period: true,
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

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { amount, description, categoryId, date } = await req.json()
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const ExpenseDate:Date = new Date(date)
    ExpenseDate.setUTCHours(11, 0, 0, 0); 

    const Period = await prisma.period.findFirst({
      where: {
        userId: user.id,
        startDate: { lte: ExpenseDate }, 
        endDate: { gte: ExpenseDate },   
      },
    });
    
  if (!Period) {
    return NextResponse.json({ error: 'Period not found' }, { status: 404 })
  }
  const amountfloat : number =  parseFloat(amount)
  if (isNaN(amountfloat)) {
    return NextResponse.json({ error: 'Amount must be a number' }, { status: 400 })
  }
    const newExpense = await prisma.expense.create({
      data: {
        amount:amountfloat,
        description,
        categoryId,
        periodId:Period.id,
        userId: user.id,
        date: date ? new Date(date) : new Date()
      }
    })

    return NextResponse.json(newExpense, { status: 201 })
  } catch (error) {
    console.error('Failed to create expense:', error)
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    )
  }
}


export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { pathname } = new URL(req.url) // Get the pathname
    const id = pathname.split('/').pop()  // Extract the ID from the URL

    if (!id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const expense = await prisma.expense.findUnique({
      where: { id }
    })
    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    await prisma.expense.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Expense deleted' })
  } catch (error) {
    console.error('Failed to delete expense:', error)
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    )
  }
}
