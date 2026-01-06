'use client'

import { useMemo } from 'react'
import { useChainId } from 'wagmi'
import type { Token } from '@/types/tokens'
import type { DEXType } from '@/types/dex'
import type { DexQuote } from '@/types/swap'
import { getSupportedDexs, ProtocolType } from '@/lib/dex-config'
import { useUniV3Quote } from './useUniV3Quote'
import { useUniV2Quote } from './useUniV2Quote'

export interface UseMultiDexQuotesParams {
    tokenIn: Token | null
    tokenOut: Token | null
    amountIn: bigint
    enabled?: boolean
}

export interface UseMultiDexQuotesResult {
    dexQuotes: Record<DEXType, DexQuote>
    bestQuoteDex: DEXType | null
    isAnyLoading: boolean
    hasAnyQuote: boolean
}

export function useMultiDexQuotes({
    tokenIn,
    tokenOut,
    amountIn,
    enabled = true,
}: UseMultiDexQuotesParams): UseMultiDexQuotesResult {
    const chainId = useChainId()
    const supportedDexs = getSupportedDexs(chainId)
    const cmswapQuote = useUniV3Quote({
        tokenIn,
        tokenOut,
        amountIn,
        enabled: enabled && supportedDexs.includes('cmswap'),
        dexId: 'cmswap',
    })
    const jibswapQuote = useUniV2Quote({
        tokenIn,
        tokenOut,
        amountIn,
        enabled: enabled && supportedDexs.includes('jibswap'),
        dexId: 'jibswap',
    })

    // commudao will be added when implemented
    // const commudaoQuote = useCommudaoQuote({...})

    const quotes: Record<DEXType, DexQuote> = useMemo(() => {
        const results: Record<DEXType, DexQuote> = {}
        if (supportedDexs.includes('cmswap')) {
            results['cmswap'] = {
                dexId: 'cmswap',
                quote: cmswapQuote.quote,
                isLoading: cmswapQuote.isLoading,
                isError: cmswapQuote.isError,
                error: cmswapQuote.error,
                protocolType: ProtocolType.V3,
                fee: cmswapQuote.fee,
            }
        }
        if (supportedDexs.includes('jibswap')) {
            results['jibswap'] = {
                dexId: 'jibswap',
                quote: jibswapQuote.quote,
                isLoading: jibswapQuote.isLoading,
                isError: jibswapQuote.isError,
                error: jibswapQuote.error,
                protocolType: ProtocolType.V2,
            }
        }

        // Add commudao result (when implemented)
        // if (supportedDexs.includes('commudao')) {
        //     results['commudao'] = {...}
        // }

        return results
    }, [chainId, supportedDexs, cmswapQuote, jibswapQuote])
    const bestQuoteDex = useMemo(() => {
        const validQuotes = Object.values(quotes).filter(
            (q) => q.quote && !q.isLoading && !q.isError
        )
        if (validQuotes.length === 0) return null
        const best = validQuotes.sort((a, b) => {
            if (!a.quote || !b.quote) return 0
            return Number(b.quote.amountOut - a.quote.amountOut)
        })[0]
        return best?.dexId ?? null
    }, [quotes])
    const isAnyLoading = Object.values(quotes).some((q) => q.isLoading)
    const hasAnyQuote = Object.values(quotes).some((q) => q.quote !== null)
    return {
        dexQuotes: quotes,
        bestQuoteDex,
        isAnyLoading,
        hasAnyQuote,
    }
}
