'use client'

import { Suspense } from 'react'

export default function BridgePage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-screen">Loading...</div>
            }
        >
            <div className="flex flex-col items-center justify-center min-h-screen px-4">
                <div className="text-center space-y-4 max-w-md">
                    <h1 className="text-4xl font-bold">Bridge</h1>
                    <p className="text-muted-foreground">
                        Transfer tokens across chains securely. Coming soon in Phase 4.
                    </p>
                </div>
            </div>
        </Suspense>
    )
}
