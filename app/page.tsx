import { Hero } from '@/components/landing/hero'
import { Features } from '@/components/landing/features'
import { Chains } from '@/components/landing/chains'
import { CTA } from '@/components/landing/cta'
import { Footer } from '@/components/landing/footer'

export default function HomePage() {
    return (
        <main>
            <Hero />
            <Chains />
            <Features />
            <CTA />
            <Footer />
        </main>
    )
}
