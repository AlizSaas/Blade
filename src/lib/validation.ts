import { z } from 'zod'

export const paginationSchema = z.object({
  cursor: z.string().uuid('Invalid pagination cursor').optional(),
})

export const requestIdSchema = z.object({
  id: z.string().uuid('Invalid request id'),
})

export const buyerSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(55),
  email: z.string().trim().email('Invalid email address').max(100),
  invitationCode: z.string().trim().length(6, 'Invitation code must be 6 characters long'),
})

export const sellerSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(55),
  email: z.string().trim().email('Invalid email address').max(100),
  companyName: z.string().trim().min(1, 'Company name is required').max(100),
  companyWebsite: z.string().trim().url('Invalid website URL').optional().or(z.literal('')),
  companyLogo: z.string().trim().url('Invalid logo URL').optional().or(z.literal('')),
})

export const bikeRequestSchema = z.object({
  sellerId: z.string().uuid('Please select a valid seller'),
  bikeModel: z.string().trim().min(1, 'Bike model is required').max(100, 'Bike model must be less than 100 characters'),
  reason: z
    .string()
    .trim()
    .min(10, 'Please provide a detailed reason (at least 10 characters)')
    .max(500, 'Reason must be less than 500 characters'),
  url: z.string().trim().url('Invalid image URL').max(2048).optional().or(z.literal('')),
})

export const bikeRequestDecisionSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  notes: z
    .string()
    .trim()
    .min(3, 'Please provide a clear message for the buyer')
    .max(500, 'Message must be 500 characters or fewer'),
})

export type BuyerFormValues = z.infer<typeof buyerSchema>
export type SellerFormValues = z.infer<typeof sellerSchema>
export type BikeRequestFormValues = z.infer<typeof bikeRequestSchema>
export type BikeRequestDecisionValues = z.infer<typeof bikeRequestDecisionSchema>