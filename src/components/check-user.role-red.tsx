'use client'

import {  useUser } from '@clerk/nextjs'
import { Link } from 'lucide-react'
import React from 'react'

export default function CheckUserRoleRed() {
    const {user}= useUser()
  return (
  <div>
    {
        user?.publicMetadata.role ==='SELLER' ? (
            <Link href="/seller">
               Dashboard
            </Link>
        ):(
            <Link href="/dashboard/buyer">  
                Buyer Dashboard
            </Link>
        )

    }
    
  </div>
  )
}
