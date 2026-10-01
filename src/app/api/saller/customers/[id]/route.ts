import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { clerkClient } from '@clerk/nextjs/server'

import { validateAuthRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { customerIdSchema } from '@/lib/validation'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id?: string }> }
) {
  try {
    const { id } = customerIdSchema.parse(await params)

    const loggedInUser = await validateAuthRequest()

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: loggedInUser.id },
      select: { role: true, companyId: true },
    })

    if (!dbUser?.companyId || dbUser.role !== 'SELLER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const customer = await prisma.user.findFirst({
      where: {
        id,
        companyId: dbUser.companyId,
        role: 'BUYER',
      },
      select: { id: true, clerkId: true },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Deleting the Prisma row cascades to the customer's bike requests,
    // conversations and subscription (onDelete: Cascade in schema.prisma).
    await prisma.user.delete({ where: { id: customer.id } })

    try {
      await (await clerkClient()).users.deleteUser(customer.clerkId)
    } catch (clerkError) {
      // The company's data is already cleaned up at this point, so we log
      // rather than fail the request - worst case is an orphaned Clerk
      // account with no matching company/role data left in our database.
      console.error('Failed to delete Clerk user after DB removal:', clerkError)
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid request' }, { status: 400 })
    }

    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
