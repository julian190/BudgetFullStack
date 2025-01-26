import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { CreateMonthAndPeriods } from '@/lib/CreatePeriods';

export async function POST() {
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

    return await CreatePeriods(user.id)
  } catch (error) {
    console.error('Period creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get('endpoint')

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    switch (endpoint) {
      case 'current':
        return await getCurrentPeriod(user.id)
      case 'list':
        return await getPeriods(user.id)
      default:
        return NextResponse.json(
          { error: 'Invalid endpoint' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Period API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function getCurrentPeriod(userId: string) {
  const currentDate = new Date()

  const period = await prisma.period.findFirst({
    where: {
      userId,
      startDate: { lte: currentDate },
      endDate: { gte: currentDate }
    }
  })

  if (!period) {
    const settings = await prisma.budgetSetting.findFirst({
      where: { userId }
    })

    if (!settings) {
      return NextResponse.json(
        { error: 'Budget settings not found' },
        { status: 404 }
      )
    }

    // TODO: Implement period creation logic if needed
  }

  return NextResponse.json(period)
}

async function getPeriods(userId: string) {
  const months = await prisma.month.findMany({
    where: { userId },
    select: {
      id: true,
      year: true,
      monthNumber: true,
      periods: {
        select: {
          id: true,
          startDate: true,
          endDate: true,
          weekName: true
        }
      }
    }
  })

  const formattedMonths = months.map((month) => ({
    monthId: month.id,
    year: month.year,
    monthNumber: month.monthNumber,
    monthName: new Date(month.year, month.monthNumber - 1).toLocaleString('default', { month: 'long' }),
    periods: month.periods.map((period: { id: string; weekName: string; startDate: Date; endDate: Date }) => ({
      id: period.id,
      weekName: period.weekName,
      startDate: period.startDate,
      endDate: period.endDate
    }))
  }))

  return NextResponse.json(formattedMonths)
}

async function CreatePeriods(userId: string) {
  try {
    await CreateMonthAndPeriods(userId);
    return NextResponse.json({ message: 'Periods created successfully' })
  } catch (error) {
    console.error('Period creation failed:', error)
    return NextResponse.json(
      { error: 'Failed to create periods' },
      { status: 500 }
    )
  }
}
