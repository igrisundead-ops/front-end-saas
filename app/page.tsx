'use client'

import { useState } from "react"
import { Home } from "lucide-react"
import IsoLevelWarp from "@/components/ui/isometric-wave-grid-background";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { VideoUploadInterface } from "@/components/video-upload-interface";
import { NavBar } from "@/components/ui/tubelight-navbar";

export default function HeroPage() {
  const navItems = [
    { name: 'Home', url: '#', icon: Home },
    { name: 'About', url: '#', icon: Home },
    { name: 'Projects', url: '#', icon: Home },
    { name: 'Resume', url: '#', icon: Home }
  ]

  const currentDensity = 20
  const [activeNav, setActiveNav] = useState("Upload")

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans flex">
      {/* BACKGROUND: Isometric Wave Grid Animation */}
      <IsoLevelWarp color="100, 50, 250" density={currentDensity} speed={1.5} />

      {/* NAVIGATION BAR */}
      <NavBar items={navItems} />

      {/* SIDEBAR */}
      <DashboardSidebar />

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* SPACER FOR NAVBAR */}
        <div className="h-24" />
        
        {/* HEADER */}
        <header className="border-b border-purple-500/10 backdrop-blur-sm px-8 py-6 flex justify-between items-center">
          <div className="flex-1" />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
            PROMETHEUS
          </h1>
          <div className="flex-1" />
        </header>

        {/* MAIN AREA */}
        <main className="flex-1 overflow-auto">
          <VideoUploadInterface />
        </main>
      </div>
    </div>
  );
}
