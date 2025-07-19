'use client'
import { useSearchParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from "sonner"

export default function Payment() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const isSuccess = searchParams.get('success') === 'true';

    useEffect(() => {
        if (isSuccess) {
            toast('Your payment was successful!')
        } else {
            toast.error('Your payment failed!', {
                description: 'Please try again or contact support.',
            });
        }
    }, [isSuccess]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4">
                        {isSuccess ? (
                            <CheckCircle2 className="h-12 w-12 text-green-500" />
                        ) : (
                            <XCircle className="h-12 w-12 text-red-500" />
                        )}
                    </div>
                    <CardTitle className="text-2xl">
                        {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
                    </CardTitle>
                    <CardDescription>
                        {isSuccess
                            ? 'Your payment has been processed successfully.'
                            : 'There was an issue processing your payment.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    {isSuccess ? (
                        <>
                            <p className="text-muted-foreground text-center">
                                Your order has been confirmed and will be processed shortly.
                            </p>
                            <Button
                                className="w-full max-w-xs"
                                onClick={() => router.push('/seller')}
                            >
                                Go to Dashboard
                            </Button>
                        </>
                    ) : (
                        <>
                            <p className="text-muted-foreground text-center">
                                Please try again or contact support if the issue persists.
                            </p>
                            <Button
                                variant="secondary"
                                className="w-full max-w-xs"
                                onClick={() => router.push('/seller')}
                            >
                                Try Again
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}