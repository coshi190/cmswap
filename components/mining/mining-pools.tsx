'use client'

import { useMemo } from 'react'
import { useChainId } from 'wagmi'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { IncentiveCard } from './incentive-card'
import { useIncentives } from '@/hooks/useIncentives'
import { useEarnStore, useMiningSettings } from '@/store/earn-store'
import { getV3StakerAddress } from '@/lib/dex-config'
import type { IncentiveKey, Incentive } from '@/types/earn'

// Known incentive keys per chain - in production, this would come from a backend or subgraph
const KNOWN_INCENTIVES: Record<number, IncentiveKey[]> = {
    25925: [],
    8899: [],
    96: [],
}

export function MiningPools() {
    const chainId = useChainId()
    const stakerAddress = getV3StakerAddress(chainId)
    const { openStakeDialog, setHideEndedIncentives } = useEarnStore()
    const miningSettings = useMiningSettings()
    const incentiveKeys = useMemo(() => KNOWN_INCENTIVES[chainId] ?? [], [chainId])
    const { incentives, isLoading } = useIncentives(incentiveKeys)
    const filteredIncentives = useMemo(() => {
        if (!miningSettings.hideEndedIncentives) return incentives
        return incentives.filter((i) => !i.isEnded)
    }, [incentives, miningSettings.hideEndedIncentives])
    const handleStake = (incentive: Incentive) => {
        openStakeDialog(incentive)
    }
    if (!stakerAddress) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                        LP Mining is not available on this chain.
                    </div>
                </CardContent>
            </Card>
        )
    }
    if (isLoading) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">Loading incentives...</div>
                </CardContent>
            </Card>
        )
    }
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Mining Pools</h2>
                    <p className="text-sm text-muted-foreground">
                        Stake your LP positions to earn rewards
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Switch
                        id="hide-ended"
                        checked={miningSettings.hideEndedIncentives}
                        onCheckedChange={setHideEndedIncentives}
                    />
                    <Label htmlFor="hide-ended" className="text-sm">
                        Hide ended
                    </Label>
                </div>
            </div>
            {filteredIncentives.length === 0 ? (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                            <div className="text-muted-foreground">
                                No active mining incentives available.
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Check back later for new rewards programs.
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredIncentives.map((incentive) => (
                        <IncentiveCard
                            key={incentive.incentiveId}
                            incentive={incentive}
                            onStake={handleStake}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
