import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { validateAuthRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { bikeRequestDecisionSchema, requestIdSchema } from '@/lib/validation'

async function getCurrentDbUser() {
  const loggedInUser = await validateAuthRequest()

  return prisma.user.findUnique({
    where: { clerkId: loggedInUser.id },
    select: {
      id: true,
      role: true,
    },
  })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id?: string }> }
) {
  try {
    const { id } = requestIdSchema.parse(await params)
    const dbUser = await getCurrentDbUser()

    if (!dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const request = await prisma.bikeRequest.findFirst({
      where: {
        id,
        ...(dbUser.role === 'SELLER'
          ? { sellerId: dbUser.id }
          : { buyerId: dbUser.id }),
      },
      include: {
        buyer: {
          include: {
            company: true,
          },
        },
        seller: {
          include: {
            company: true,
          },
        },
      },
    })

    if (!request) {
      return NextResponse.json({ error: 'Bike request not found' }, { status: 404 })
    }

    return NextResponse.json(request, { status: 200 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid request' }, { status: 400 })
    }

    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id?: string }> }
) {
  try {
    const { id } = requestIdSchema.parse(await params)
    const { status, notes } = bikeRequestDecisionSchema.parse(await req.json())
    const dbUser = await getCurrentDbUser()

    if (!dbUser || dbUser.role !== 'SELLER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const request = await prisma.bikeRequest.findFirst({
      where: {
        id,
        sellerId: dbUser.id,
      },
      select: {
        id: true,
        status: true,
      },
    })

    if (!request) {
      return NextResponse.json({ error: 'Bike request not found' }, { status: 404 })
    }

    if (request.status !== 'PENDING') {
      return NextResponse.json({ error: 'Only pending requests can be updated' }, { status: 409 })
    }

    const updatedRequest = await prisma.bikeRequest.update({
      where: { id },
      data: {
        status,
        notes,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: `Request ${status.toLowerCase()} successfully`,
        request: updatedRequest,
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
