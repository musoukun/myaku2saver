'use client'

import dynamic from 'next/dynamic'

// Three.jsコンポーネントは動的にインポートしてSSRを回避
const FluidBlobs = dynamic(() => import('../components/FluidBlobs'), { ssr: false })

export default function Home() {
  return (
    <main className="w-full h-screen bg-black overflow-hidden">
      <FluidBlobs />
    </main>
  )
}
