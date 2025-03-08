import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

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