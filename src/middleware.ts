import { clerkMiddleware,createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher(['/', "/api/webhooks/(.*)",  "/api/uploadthing","/api/stripe/webhook"
 ]);
const isSellerRoute = createRouteMatcher([ 'seller','/seller/(.*)']);
const isBuyerRoute = createRouteMatcher(['/buyer/(.*)']);

const isOnboardingRoute = createRouteMatcher(['/onboarding']);


export default clerkMiddleware(async (auth,req:NextRequest) =>{
  const { userId,sessionClaims,redirectToSignIn } = await auth();





  //redirect to onboarding ig not completed 
  if(userId && req.nextUrl.pathname === '/' && !sessionClaims.metadata.onboardingCompleted) {
    const onboardingUrl = new URL('/onboarding', req.url);
    return NextResponse.redirect(onboardingUrl);
  } // redirect to onboarding if not completed

  // if(userId && req.nextUrl.pathname === '/' && sessionClaims?.metadata.onboardingCompleted  && sessionClaims.metadata.role ==='SELLER') {
  //   const sellerUrl = new URL('/seller', req.url);
  //   return NextResponse.redirect(sellerUrl);
  // } // redirect to seller dashboard if onboarding completed and role is seller

  // if(userId && req.nextUrl.pathname === '/' && sessionClaims?.metadata.onboardingCompleted  && sessionClaims.metadata.role ==='BUYER') {
  //   const buyerUrl = new URL('/buyer', req.url);
  //   return NextResponse.redirect(buyerUrl);
  // } // redirect to buyer dashboard if onboarding completed and role is buyer




   if (!userId && !isPublicRoute(req)) {
    return redirectToSignIn({
      returnBackUrl: req.url
    });
  }  // Redirect to sign-in if user is not authenticated and not accessing public routes

if(userId && sessionClaims.metadata.role && isOnboardingRoute(req)) {
  if(sessionClaims.metadata.role ==='SELLER' ) {
    const sellerUrl = new URL('/seller', req.url);
    return NextResponse.redirect(sellerUrl);
  } else {
    const buyerUrl = new URL('/buyer', req.url);
    return NextResponse.redirect(buyerUrl);
  }
} // Redirect to appropriate dashboard if user is authenticated and accessing onboarding route
// Redirect to appropriate dashboard if user is authenticated and accessing onboarding route with onboardingCompleted search param

if(userId && !sessionClaims.metadata.onboardingCompleted && !isOnboardingRoute(req)) {
  const onboardingUrl = new URL('/onboarding', req.url);
  return NextResponse.redirect(onboardingUrl);
} // Redirect to onboarding if user is authenticated but onboarding is not completed and not accessing onboarding route


if(isSellerRoute(req)) {
  if(sessionClaims?.metadata.role === 'SELLER') {
    return NextResponse.next(); // Allow seller routes to pass through if user is a seller
  } else {
    const homePage = new URL('/', req.url);
    return NextResponse.redirect(homePage); // Redirect to home if user is not a seller
  }
} // Handle seller routes, allowing access only if user is a seller

if(isBuyerRoute(req)) {
  if(sessionClaims?.metadata.role === 'BUYER') {
    return NextResponse.next(); // Allow buyer routes to pass through if user is a buyer
  } else {
    const homePage = new URL('/', req.url);
    return NextResponse.redirect(homePage); // Redirect to home if user is not a buyer
  }
}





if(userId) {
  return NextResponse.next(); // Allow authenticated users to pass through
}
return NextResponse.next(); // Default case, allow request to pass through
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};