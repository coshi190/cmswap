'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useEarnStore, useSelectedPosition } from '@/store/earn-store'
import { useRemoveLiquidity } from '@/hooks/useLiquidity'
import { formatTokenAmount } from '@/services/tokens'
import { toastSuccess, toastError } from '@/lib/toast'

const PERCENTAGE_OPTIONS = [25, 50, 75, 100]

export function RemoveLiquidityDialog() {
    const { address } = useAccount()
    const { isRemoveLiquidityOpen, closeRemoveLiquidity } = useEarnStore()
    const selectedPosition = useSelectedPosition()
    const [percentage, setPercentage] = useState(100)
    const {
        remove,
        liquidityToRemove,
        amount0Min,
        amount1Min,
        isPreparing,
        isExecuting,
        isConfirming,
        isSuccess,
        error,
        hash,
    } = useRemoveLiquidity(
        selectedPosition,
        percentage,
        address,
        50, // 0.5% slippage
        20 // 20 min deadline
    )
    useEffect(() => {
        if (isSuccess && hash) {
            toastSuccess('Liquidity removed successfully!')
            closeRemoveLiquidity()
            setPercentage(100)
        }
    }, [isSuccess, hash, closeRemoveLiquidity])
    useEffect(() => {
        if (error) {
            toastError(error)
        }
    }, [error])
    if (!selectedPosition) return null
    const isLoading = isPreparing || isExecuting || isConfirming
    const getButtonText = () => {
        if (isPreparing) return 'Preparing...'
        if (isExecuting) return 'Confirm in wallet...'
        if (isConfirming) return 'Removing liquidity...'
        return 'Remove Liquidity'
    }
    return (
        <Dialog open={isRemoveLiquidityOpen} onOpenChange={closeRemoveLiquidity}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Remove Liquidity</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="text-lg font-medium">
                            {selectedPosition.token0Info.symbol} /{' '}
                            {selectedPosition.token1Info.symbol}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Position #{selectedPosition.tokenId.toString()}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Amount to remove</div>
                        <div className="grid grid-cols-4 gap-2">
                            {PERCENTAGE_OPTIONS.map((p) => (
                                <Button
                                    key={p}
                                    type="button"
                                    variant={percentage === p ? 'default' : 'outline'}
                                    onClick={() => setPercentage(p)}
                                >
                                    {p}%
                                </Button>
                            ))}
                        </div>
                    </div>
                    <div className="bg-muted rounded-lg p-4 space-y-2">
                        <div className="text-sm text-muted-foreground">
                            You will receive at least:
                        </div>
                        <div className="flex justify-between">
                            <span>{selectedPosition.token0Info.symbol}</span>
                            <span className="font-medium">
                                {formatTokenAmount(
                                    amount0Min,
                                    selectedPosition.token0Info.decimals
                                )}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>{selectedPosition.token1Info.symbol}</span>
                            <span className="font-medium">
                                {formatTokenAmount(
                                    amount1Min,
                                    selectedPosition.token1Info.decimals
                                )}
                            </span>
                        </div>
                        {(selectedPosition.tokensOwed0 > 0n ||
                            selectedPosition.tokensOwed1 > 0n) && (
                            <>
                                <div className="border-t pt-2 mt-2">
                                    <div className="text-sm text-muted-foreground">
                                        Plus uncollected fees:
                                    </div>
                                </div>
                                {selectedPosition.tokensOwed0 > 0n && (
                                    <div className="flex justify-between text-green-600">
                                        <span>{selectedPosition.token0Info.symbol}</span>
                                        <span>
                                            +
                                            {formatTokenAmount(
                                                selectedPosition.tokensOwed0,
                                                selectedPosition.token0Info.decimals
                                            )}
                                        </span>
                                    </div>
                                )}
                                {selectedPosition.tokensOwed1 > 0n && (
                                    <div className="flex justify-between text-green-600">
                                        <span>{selectedPosition.token1Info.symbol}</span>
                                        <span>
                                            +
                                            {formatTokenAmount(
                                                selectedPosition.tokensOwed1,
                                                selectedPosition.token1Info.decimals
                                            )}
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={remove} disabled={isLoading || liquidityToRemove === 0n}>
                        {getButtonText()}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
