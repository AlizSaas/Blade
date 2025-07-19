import {  currentUser } from "@clerk/nextjs/server";
import { cache } from "react";

export const validateAuthRequest = cache(async () => {


      const user = await currentUser();
      if (!user) {
        throw new Error("Unauthorized")
      }
      return user


})