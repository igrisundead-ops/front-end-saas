'use client'

import { VideoUploadInterface } from "@/components/video-upload-interface";
import { PrometheusShell } from "@/components/prometheus-shell";

export default function HeroPage() {
  return (
    <PrometheusShell
      header={
        <header className="border-b border-purple-500/10 backdrop-blur-sm px-8 py-6 flex justify-between items-center">
          <div className="flex-1" />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
            PROMETHEUS
          </h1>
          <div className="flex-1" />
        </header>
      }
    >
      <VideoUploadInterface />
    </PrometheusShell>
  );
}
