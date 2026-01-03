import { ArrowRight, Repeat, GitBranch, Rocket } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
    {
        name: 'Aggregate Swap',
        description:
            'Get the best rates across 150+ DEXs including Uniswap, PancakeSwap, Curve, and more. Save on every trade.',
        icon: Repeat,
        href: '/swap',
    },
    {
        name: 'Cross-Chain Bridge',
        description:
            'Move tokens seamlessly across 6+ chains including Ethereum, BSC, Polygon, Arbitrum, and more.',
        icon: GitBranch,
        href: '/bridge',
    },
    {
        name: 'Memecoin Launchpad',
        description:
            'Launch your own token in minutes. Create, deploy, and add liquidity - all from one simple interface.',
        icon: Rocket,
        href: '/launchpad',
    },
]

export function Features() {
    return (
        <section className="py-20 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-base font-semibold leading-7 text-primary">Features</h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                        Everything you need to trade and launch
                    </p>
                    <p className="mt-6 text-lg leading-8 text-gray-400">
                        cmswap combines the best DeFi tools into one seamless experience. No more
                        juggling multiple dApps.
                    </p>
                </div>
                <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:max-w-none lg:grid-cols-3">
                    {features.map((feature) => {
                        const Icon = feature.icon
                        return (
                            <Card
                                key={feature.name}
                                className="group transition-all hover:bg-primary/5"
                            >
                                <CardHeader>
                                    <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 w-fit">
                                        <Icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <CardTitle>{feature.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">{feature.description}</p>
                                    <Link href={feature.href}>
                                        <Button variant="ghost" className="mt-6 gap-2">
                                            Learn more
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
