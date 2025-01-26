import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const categories = await prisma.expenseCategory.findMany({
      where: {
        user: {
          email: session.user.email
        }
      },
      include: {
        expenses: true,
        month: true
      }
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
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
    const { name, budget } = await req.json()
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const month = await prisma.month.findFirst({
      where: { userId: user.id },
      orderBy: { id: 'desc' },
    });
        
    if (!month) {
      return NextResponse.json({ error: 'Month not found' }, { status: 404 })
    }
    const budgetfloat : number =  parseFloat(budget)
    if (isNaN(budgetfloat)) {
      return NextResponse.json({ error: 'Budget must be a number' }, { status: 400 })
    }

    const newCategory = await prisma.expenseCategory.create({
      data: {
        name,
        budget:budgetfloat,
        monthId:month.id,
        userId: user.id
      }
    })

    return NextResponse.json(newCategory, { status: 201 })
  } catch (error) {
    console.error('Failed to create category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
