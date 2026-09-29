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
    const pageSize = 4

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: loggedInUser.id },
      select: { id: true, role: true },
    })

    if (!dbUser || dbUser.role !== 'BUYER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const bikeRequests = await prisma.bikeRequest.findMany({
      where: {
        buyerId: dbUser.id,
      },
      include: {
        buyer: true,
        seller: {
          select: {
            firstname: true,
            lastname: true,
            email: true,
            company: {
              select: {
                name: true,
                logo: true,
                website: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
    })

    const nextCursor = bikeRequests.length > pageSize ? bikeRequests[pageSize].id : null

    return NextResponse.json(
      {
        bikeRequests: bikeRequests.slice(0, pageSize),
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
