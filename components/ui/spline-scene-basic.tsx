'use client'

import React from 'react'
import { SplineScene } from "@/components/ui/splite"
import { Card } from "@/components/ui/card"
import { Spotlight } from "@/components/ui/spotlight"
 
export function SplineSceneBasic() {
  return (
    <Card className="w-full h-[500px] bg-black/[0.96] relative overflow-hidden rounded-xl border border-neutral-800">
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="white"
      />
      
      <div className="flex flex-col md:flex-row h-full">
        {/* Left content */}
        <div className="flex-1 p-6 md:p-12 relative z-10 flex flex-col justify-center">
          <span className="text-[#bfff00] font-mono text-[10px] tracking-widest font-black uppercase mb-3">
            IMMERSIVE EXPERIENCE
          </span>
          <h1 className="text-3xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 tracking-tighter uppercase font-display">
            Interactive 3D
          </h1>
          <p className="mt-4 text-neutral-400 text-xs sm:text-sm max-w-lg leading-relaxed font-sans">
            Bring your UI to life with beautiful 3D scenes. Create immersive experiences 
            that capture attention and enhance your design. Double-click or drag the scene to interact.
          </p>
        </div>

        {/* Right content */}
        <div className="flex-1 relative h-[250px] md:h-full">
          <SplineScene 
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </div>
      </div>
    </Card>
  )
}
