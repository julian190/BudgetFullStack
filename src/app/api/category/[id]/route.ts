import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
//   const session = await getServerSession(authOptions)
//   if (!session?.user?.email) {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//   }

//   try {
//     const category = await prisma.expenseCategory.findUnique({
//       where: { id: params.id },
//       include: {
//         expenses: true,
//         month: true
//       }
//     })

//     if (!category) {
//       return NextResponse.json({ error: 'Category not found' }, { status: 404 })
//     }

//     return NextResponse.json(category)
//   } catch (error) {
//     console.error('Failed to fetch category:', error)
//     return NextResponse.json(
//       { error: 'Failed to fetch category' },
//       { status: 500 }
//     )
//   }
// }

// export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
//   const session = await getServerSession(authOptions)
//   if (!session?.user?.email) {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//   }

//   try {
//     const { name, budget } = await req.json()
//     const budgetFloat = parseFloat(budget)

//     if (isNaN(budgetFloat)) {
//       return NextResponse.json({ error: 'Budget must be a number' }, { status: 400 })
//     }

//     const category = await prisma.expenseCategory.findUnique({
//       where: { id: params.id }
//     })

//     if (!category) {
//       return NextResponse.json({ error: 'Category not found' }, { status: 404 })
//     }

//     const updatedCategory = await prisma.expenseCategory.update({
//       where: { id: params.id },
//       data: {
//         name,
//         budget: budgetFloat
//       }
//     })

//     return NextResponse.json(updatedCategory)
//   } catch (error) {
//     console.error('Failed to update category:', error)
//     return NextResponse.json(
//       { error: 'Failed to update category' },
//       { status: 500 }
//     )
//   }
// }
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = params.id; // Extract ID safely

  try {
    const category = await prisma.expenseCategory.findUnique({
      where: { id }
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    await prisma.expenseCategory.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Category deleted' })
  } catch (error) {
    console.error('Failed to delete category:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}
