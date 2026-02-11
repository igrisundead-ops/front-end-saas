import type React from "react";

export type SceneSpec = {
  id: string;
  Component: React.FC<any>;
  props?: any;
  durationInFrames: number;
};

export type TransitionType = "fade" | "slide" | "wipe" | "none" | "custom";

export type TransitionSpec = {
  type: TransitionType;
  durationInFrames: number;
  timing: {
    kind: "linear" | "spring";
    config?: any;
  };
  presentation?: {
    kind?: string;
    direction?: "left" | "right" | "up" | "down";
    color?: string;
  };
};

export type StitchedTimelineInput = {
  scenes: SceneSpec[];
  transitions?: Array<TransitionSpec | undefined>;
};

export const NONE_TRANSITION_SPEC: TransitionSpec = {
  type: "none",
  durationInFrames: 0,
  timing: { kind: "linear" },
};

export const normalizeTransitions = ({
  scenes,
  transitions,
}: StitchedTimelineInput): TransitionSpec[] => {
  const expectedBoundaries = Math.max(0, scenes.length - 1);
  const providedTransitions = transitions ?? [];

  if (providedTransitions.length > expectedBoundaries) {
    throw new Error(
      `[StitchedTimeline] Received ${providedTransitions.length} transition entries for ${scenes.length} scenes. Expected at most ${expectedBoundaries}.`
    );
  }

  return Array.from({ length: expectedBoundaries }, (_, boundaryIndex) => {
    return providedTransitions[boundaryIndex] ?? NONE_TRANSITION_SPEC;
  });
};

export const isActiveTransition = (transition: TransitionSpec): boolean => {
  return transition.type !== "none";
};
