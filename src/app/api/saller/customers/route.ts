import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { validateAuthRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { paginationSchema } from '@/lib/validation'

export async function GET(req: NextRequest) {
  try {
    const { cursor } = paginationSchema.parse({
      cursor: req.nextUrl.searchParams.get('cursor') || undefined,
    })

    const loggedInUser = await validateAuthRequest()
    const pageSize = 3

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: loggedInUser.id },
      select: { companyId: true, role: true },
    })

    if (!dbUser?.companyId || dbUser.role !== 'SELLER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      where: {
        companyId: dbUser.companyId,
        role: 'BUYER',
      },
      orderBy: {
        firstname: 'asc',
      },
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
    })

    const nextCursor = users.length > pageSize ? users[pageSize].id : null

    return NextResponse.json(
      {
        users: users.slice(0, pageSize),
        nextCursor,
      },
      { status: 200 },
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid request' }, { status: 400 })
    }

    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
