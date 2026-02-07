'use client';

import * as React from 'react';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from 'lucide-react';

type SendPopupProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenEditor: () => void;
};

export function SendPopup({ open, onOpenChange, onOpenEditor }: SendPopupProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-visible rounded-[28px] bg-black/60 p-0 shadow-[0_30px_90px_rgba(0,0,0,0.7)] sm:max-w-4xl [&>button[aria-label='Close']]:hidden">
        <div className="relative">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(1100px_circle_at_15%_-10%,rgba(255,255,255,0.14),transparent_42%),radial-gradient(800px_circle_at_85%_0%,rgba(255,255,255,0.08),transparent_36%)] opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-white/[0.03]" />
            <div className="absolute inset-0 bg-[radial-gradient(closest-side,transparent_72%,rgba(0,0,0,0.92))]" />
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
            <div className="absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" />
          </div>

          <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-black/30 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
            <div className="relative -my-2 flex items-center gap-3">
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-x-3 -inset-y-2 rounded-[22px] border border-white/10 bg-black/45 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
              />
              <div className="relative flex items-center gap-3">
                <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2 py-1">
                  <button
                    type="button"
                    className="grid size-6 place-items-center rounded-md text-white/50"
                    disabled
                    aria-label="Previous"
                  >
                    <ChevronLeftIcon className="size-4" />
                  </button>
                  <span className="px-1 text-xs tabular-nums text-white/60">1/1</span>
                  <button
                    type="button"
                    className="grid size-6 place-items-center rounded-md text-white/50"
                    disabled
                    aria-label="Next"
                  >
                    <ChevronRightIcon className="size-4" />
                  </button>
                </div>
                <span className="rounded-md border border-white/10 bg-white/[0.06] px-2 py-1 text-xs font-medium text-white/70">
                  Queued
                </span>
              </div>
            </div>

            <div className="relative -my-2 flex items-center gap-2">
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-x-3 -inset-y-2 rounded-[22px] border border-white/10 bg-black/45 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
              />
              <div className="relative flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-white/60">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400/40" />
                    <span className="relative inline-flex size-2 rounded-full bg-amber-400/90" />
                  </span>
                  Standing by
                </div>
                <DialogClose
                  className="grid size-8 place-items-center rounded-md text-white/50 transition hover:bg-white/[0.06] hover:text-white/80"
                  aria-label="Close"
                >
                  <XIcon className="size-4" />
                </DialogClose>
              </div>
            </div>
          </div>

          <div className="px-6 py-12 sm:px-10">
            <div className="mx-auto w-full max-w-lg text-center">
              <div className="mx-auto mb-4 size-1.5 rounded-full bg-white/30" />

              <DialogTitle className="font-serif text-[28px] font-semibold leading-none tracking-tight text-white">
                Queued
              </DialogTitle>
              <p className="mt-3 text-sm text-white/70">
                Your request has been received. You can open the editor when ready.
              </p>

              <div className="mt-7 flex items-center justify-center gap-3">
                <Button
                  onClick={onOpenEditor}
                  className="min-w-36 bg-white text-black hover:bg-white/90"
                >
                  Open Editor
                </Button>
                <Button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="min-w-36 border border-white/10 bg-white/[0.08] text-white hover:bg-white/[0.12]"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
