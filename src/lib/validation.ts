import { z } from 'zod';



 export const buyerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(55),
  lastName: z.string().min(1, "Last name is required").max(55).optional(),
  email: z.string().email("Invalid email address").max(100),
  invitationCode: z.string().length(6, "Invitation code must be 6 characters long"),
})

 export const sellerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(55),
  lastName: z.string().min(1, "Last name is required").max(55).optional(),
  email: z.string().email("Invalid email address").max(100),
  companyName: z.string().min(1, "Company name is required").max(100),
  companyWebsite: z.string().url("Invalid website URL").optional().or(z.literal("")),
  companyLogo: z.string().url("Invalid logo URL").optional().or(z.literal("")),
})






export type BuyerFormValues = z.infer<typeof buyerSchema>
export type SellerFormValues = z.infer<typeof sellerSchema>