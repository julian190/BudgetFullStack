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
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get or create default settings
    let settings = await prisma.budgetSetting.findFirst({
      where: { userId: user.id }
    })

    if (!settings) {
      // Create default settings
      settings = await prisma.budgetSetting.create({
        data: {
          userId: user.id,
          monthlyGoal: 0
        }
      })
    }

    return NextResponse.json(settings)
    
  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
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

    const body = await request.json()
    
    await prisma.budgetSetting.update({
      where: { userId: user.id },
      data: {
        monthlyGoal: body.monthlyGoal
      }
    })

    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GETSharedUsers() {
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

    const sharedUsers = await prisma.budgetShare.findMany({
      where: { ownerId: user.id },
      include: { sharedWith: true }
    })

    return NextResponse.json(sharedUsers.map(su => ({
      id: su.id,
      email: su.sharedWith.email
    })))
    
  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POSTShare(request: Request) {
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

    const body = await request.json()
    const sharedUser = await prisma.user.findUnique({
      where: { email: body.email }
    })

    if (!sharedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const existingShare = await prisma.budgetShare.findFirst({
      where: {
        ownerId: user.id,
        sharedWithUserId: sharedUser.id
      }
    })

    if (existingShare) {
      return NextResponse.json(
        { error: 'Budget already shared with this user' },
        { status: 400 }
      )
    }

    await prisma.budgetShare.create({
      data: {
        ownerId: user.id,
        sharedWithUserId: sharedUser.id
      }
    })

    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETEShare(request: Request) {
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
    const shareUserId = searchParams.get('shareUserId')
    if (!shareUserId) {
      return NextResponse.json(
        { error: 'Missing share user ID' },
        { status: 400 }
      )
    }

    await prisma.budgetShare.deleteMany({
      where: {
        ownerId: user.id,
        sharedWithUserId: shareUserId
      }
    })

    return new Response(null, { status: 204 })
    
  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
