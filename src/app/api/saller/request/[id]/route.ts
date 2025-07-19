import { prisma } from "@/lib/prisma";
import { validateAuthRequest } from "@/lib/auth";


export async function GET(
  req: Request,
  { params }: { params: Promise<{ id?: string }> }
) {
  try {
    const { id } = await params;
    const loggedInUser = await validateAuthRequest();

    if (!loggedInUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bikeRequestInfo = await prisma.bikeRequest.findFirst({
      where: {
        id: id,
      },
      include: {
        buyer: {
          include: {
            company: true,
          },
        },
        seller: true,
      },
    });


    if(!bikeRequestInfo) {
      return Response.json({ error: "Bike request not found" }, { status: 404 });
    }

   
    return Response.json(bikeRequestInfo, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
