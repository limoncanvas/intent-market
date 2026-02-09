import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { WalletProviderWrapper } from '@/components/WalletProvider'

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

export const metadata: Metadata = {
  title: 'INTENT MARKET — POST. MATCH. EXECUTE.',
  description: 'The first encrypted intent marketplace. Post what you need. Agents find the match.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={jetbrainsMono.className}>
        <WalletProviderWrapper>{children}</WalletProviderWrapper>
      </body>
    </html>
  )
}
