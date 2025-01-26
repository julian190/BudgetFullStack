import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (id) {
      return await getIncome(user.id, id)
    }
    return await getIncomes(user.id)
    
  } catch (error) {
    console.error('Income API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!request.body) {
      return NextResponse.json({ error: 'Request body is required' }, { status: 400 })
    }
    const body = await request.json()
    
    const newIncome = await prisma.income.create({
      data: {
        userId: user.id,
        source: body.source,
        amount: body.amount,
        frequency: body.frequency,
        date: new Date()
      }
    })

    return NextResponse.json({
      id: newIncome.id,
      source: newIncome.source,
      amount: newIncome.amount,
      frequency: newIncome.frequency,
      date: newIncome.date.toISOString().split('T')[0]
    }, { status: 201 })
    
  } catch (error) {
    console.error('Income API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Missing income ID' }, { status: 400 })
    }

    const body = await request.json()
    const updatedIncome = await prisma.income.update({
      where: { id: id, userId: user.id },
      data: {
        source: body.source,
        amount: body.amount,
        frequency: body.frequency
      }
    })

    return NextResponse.json({
      id: updatedIncome.id,
      source: updatedIncome.source,
      amount: updatedIncome.amount,
      frequency: updatedIncome.frequency,
      date: updatedIncome.date.toISOString().split('T')[0]
    })
    
  } catch (error) {
    console.error('Income API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Missing income ID' }, { status: 400 })
    }

    await prisma.income.delete({
      where: { id: id, userId: user.id }
    })

    return new Response(null, { status: 204 })
    
  } catch (error) {
    console.error('Income API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

async function getIncomes(userId: string) {
  const incomes = await prisma.income.findMany({
    where: { userId },
    select: {
      id: true,
      source: true,
      amount: true,
      frequency: true,
      date: true
    }
  })

  return NextResponse.json(incomes.map(i => ({
    ...i,
    date: i.date.toISOString().split('T')[0]
  })))
}

async function getIncome(userId: string, id: string) {
  const income = await prisma.income.findFirst({
    where: { id: id, userId: userId },
    select: {
      id: true,
      source: true,
      amount: true,
      frequency: true,
      date: true
    }
  })

  if (!income) {
    return NextResponse.json({ error: 'Income not found' }, { status: 404 })
  }

  return NextResponse.json({
    ...income,
    date: income.date.toISOString().split('T')[0]
  })
}
