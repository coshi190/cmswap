import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Waypoints, Zap, Shield, TrendingUp } from 'lucide-react'

export function Hero() {
    return (
        <section className="relative overflow-hidden py-20 sm:py-32">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,rgba(0,255,65,0.1),rgba(0,0,0,0))]"></div>
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-3xl text-center">
                    <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary">
                        <Waypoints className="h-4 w-4" />
                        <span>CMswap - Multi-Chain Web3 Platform</span>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                        Swap, Bridge & Launch
                        <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                            {' '}
                            Everything
                        </span>
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
                        The ultimate Web3 aggregation platform. Access the best rates across DEXs,
                        bridge tokens seamlessly, and launch your own memecoin - all in one place.
                    </p>
                    <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
                        <Link href="/swap">
                            <Button size="xl" className="group w-full sm:w-auto">
                                Start Swapping
                                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </Link>
                        <Link href="/bridge">
                            <Button size="xl" variant="outline" className="w-full sm:w-auto">
                                Bridge Tokens
                            </Button>
                        </Link>
                    </div>
                    <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            <span>Audited & Secure</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            <span>Best Rates Guaranteed</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-primary" />
                            <span>Lightning Fast</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
