'use client'

import { useMemo } from 'react'
import { useReadContract } from 'wagmi'
import type { Address } from 'viem'
import type { Token } from '@/types/tokens'
import type { QuoteResult } from '@/types/swap'
import type { DEXType } from '@/types/dex'
import { getV2Config, getDexsByProtocol, isV2Config, getDexConfig } from '@/lib/dex-config'
import { UNISWAP_V2_ROUTER_ABI } from '@/lib/abis/uniswap-v2-router'
import { UNISWAP_V2_FACTORY_ABI } from '@/lib/abis/uniswap-v2-factory'
import { buildV2QuoteParams } from '@/services/dex/uniswap-v2'
import { isSameToken, getSwapAddress, getWrapOperation } from '@/services/tokens'
import { ProtocolType } from '@/lib/dex-config'

export interface UseUniV2QuoteParams {
    tokenIn: Token | null
    tokenOut: Token | null
    amountIn: bigint
    enabled?: boolean
    dexId?: DEXType | DEXType[]
}

export interface UseUniV2QuoteResult {
    quote: QuoteResult | null
    isLoading: boolean
    isError: boolean
    error: Error | null
    primaryDexId: DEXType | null
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address

export function useUniV2Quote({
    tokenIn,
    tokenOut,
    amountIn,
    enabled = true,
    dexId,
}: UseUniV2QuoteParams): UseUniV2QuoteResult {
    const chainId = tokenIn?.chainId ?? 1
    const requestedDexIds = useMemo(() => {
        if (!tokenIn) return []
        if (!dexId) {
            return getDexsByProtocol(chainId, ProtocolType.V2)
        }
        const ids = Array.isArray(dexId) ? dexId : [dexId]
        return ids.filter((id) => {
            const config = getDexConfig(chainId, id)
            return config && isV2Config(config)
        })
    }, [dexId, tokenIn, chainId])
    const wrapOperation = useMemo(() => {
        return getWrapOperation(tokenIn, tokenOut)
    }, [tokenIn, tokenOut])
    const primaryDexId = requestedDexIds[0]
    const dexConfig = primaryDexId ? getV2Config(chainId, primaryDexId) : null
    const tokenInAddress = useMemo(() => {
        if (!tokenIn) return ZERO_ADDRESS
        return getSwapAddress(tokenIn.address as Address, chainId, dexConfig?.wnative)
    }, [tokenIn, chainId, dexConfig?.wnative])
    const tokenOutAddress = useMemo(() => {
        if (!tokenOut) return ZERO_ADDRESS
        return getSwapAddress(tokenOut.address as Address, chainId, dexConfig?.wnative)
    }, [tokenOut, chainId, dexConfig?.wnative])
    const isReadyForQuote =
        enabled &&
        !!tokenIn &&
        !!tokenOut &&
        amountIn > 0n &&
        !!dexConfig &&
        tokenIn.chainId === tokenOut.chainId &&
        !isSameToken(tokenIn, tokenOut) &&
        !wrapOperation
    const {
        data: pairAddress,
        isLoading: isPairLoading,
        isError: isPairError,
    } = useReadContract({
        address: dexConfig?.factory,
        abi: UNISWAP_V2_FACTORY_ABI,
        functionName: 'getPair',
        args: [tokenInAddress, tokenOutAddress],
        chainId,
        query: {
            enabled: isReadyForQuote,
            staleTime: 60_000,
        },
    })
    const pairExists = pairAddress && pairAddress !== ZERO_ADDRESS
    const quoteParams = useMemo(() => {
        if (!tokenIn || !tokenOut || amountIn <= 0n) return null
        return buildV2QuoteParams(
            tokenIn.address as Address,
            tokenOut.address as Address,
            amountIn,
            chainId,
            dexConfig?.wnative
        )
    }, [tokenIn, tokenOut, amountIn, chainId, dexConfig])
    const {
        data: amountsOut,
        isLoading: isQuoteLoading,
        isError: isQuoteError,
        error: quoteError,
    } = useReadContract({
        address: dexConfig?.router,
        abi: UNISWAP_V2_ROUTER_ABI,
        functionName: 'getAmountsOut',
        args: quoteParams ? [quoteParams.amountIn, quoteParams.path] : undefined,
        chainId,
        query: {
            enabled: isReadyForQuote && pairExists,
            staleTime: 10_000,
        },
    })
    const quote: QuoteResult | null = useMemo(() => {
        if (wrapOperation && amountIn > 0n) {
            return {
                amountOut: amountIn,
                sqrtPriceX96After: 0n,
                initializedTicksCrossed: 0,
                gasEstimate: wrapOperation === 'wrap' ? 50000n : 40000n,
            }
        }
        if (amountsOut && amountsOut.length >= 2) {
            const amountOut = amountsOut[amountsOut.length - 1]
            if (amountOut !== undefined) {
                return {
                    amountOut,
                    sqrtPriceX96After: 0n,
                    initializedTicksCrossed: 0,
                    gasEstimate: 150000n,
                }
            }
        }
        return null
    }, [wrapOperation, amountIn, amountsOut])
    const isLoading = wrapOperation ? false : isQuoteLoading || isPairLoading
    const isError =
        isQuoteError ||
        isPairError ||
        (!wrapOperation && !isPairLoading && !pairExists && tokenIn && tokenOut)
    const displayError: Error | null = useMemo(() => {
        if (quoteError) return quoteError as Error
        if (isPairError) return new Error('Failed to check pair')
        if (!wrapOperation && !isPairLoading && !pairExists && tokenIn && tokenOut) {
            return new Error(`No pair found for ${tokenIn.symbol}/${tokenOut.symbol}`)
        }
        return null
    }, [quoteError, isPairError, wrapOperation, isPairLoading, pairExists, tokenIn, tokenOut])
    return {
        quote,
        isLoading,
        isError: !!isError,
        error: displayError,
        primaryDexId: primaryDexId ?? null,
    }
}
