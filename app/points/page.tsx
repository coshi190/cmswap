'use client'

import { Suspense } from 'react'

export default function PointsPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-screen">Loading...</div>
            }
        >
            <div className="flex flex-col items-center justify-center min-h-screen px-4">
                <div className="text-center space-y-4 max-w-md">
                    <h1 className="text-4xl font-bold">Points</h1>
                    <p className="text-muted-foreground">
                        Earn points, complete quests, and climb the leaderboard. Coming soon in
                        Phase 6.
                    </p>
                </div>
            </div>
        </Suspense>
    )
}
