import { AbsoluteFill } from "remotion";
import type { FC } from "react";
import { StitchedTimeline, getStitchedTimelineDurationInFrames } from "./StitchedTimeline";
import type { SceneSpec, TransitionSpec } from "./types";

type BasicSceneProps = {
  backgroundColor: string;
  label: string;
  subtitle: string;
  textColor?: string;
};

const BasicScene: FC<BasicSceneProps> = ({
  backgroundColor,
  label,
  subtitle,
  textColor = "#f8fafc",
}) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        color: textColor,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        letterSpacing: "0.02em",
      }}
    >
      <div style={{ fontSize: 82, fontWeight: 800 }}>{label}</div>
      <div style={{ fontSize: 38, opacity: 0.85 }}>{subtitle}</div>
    </AbsoluteFill>
  );
};

export const transitionPreviewScenes: SceneSpec[] = [
  {
    id: "intro",
    Component: BasicScene,
    durationInFrames: 90,
    props: {
      backgroundColor: "#0f172a",
      label: "Scene A",
      subtitle: "Midnight Blue",
    },
  },
  {
    id: "feature",
    Component: BasicScene,
    durationInFrames: 90,
    props: {
      backgroundColor: "#14532d",
      label: "Scene B",
      subtitle: "Forest Green",
    },
  },
  {
    id: "outro",
    Component: BasicScene,
    durationInFrames: 90,
    props: {
      backgroundColor: "#7f1d1d",
      label: "Scene C",
      subtitle: "Deep Red",
    },
  },
];

export const transitionPreviewTransitions: TransitionSpec[] = [
  {
    type: "fade",
    durationInFrames: 20,
    timing: { kind: "linear" },
  },
  {
    type: "wipe",
    durationInFrames: 24,
    timing: {
      kind: "spring",
      config: {
        damping: 200,
        stiffness: 100,
      },
    },
    presentation: {
      direction: "left",
    },
  },
];

export const transitionPreviewDurationInFrames = getStitchedTimelineDurationInFrames({
  scenes: transitionPreviewScenes,
  transitions: transitionPreviewTransitions,
});

export const TransitionPreviewComposition: FC = () => {
  return (
    <StitchedTimeline
      scenes={transitionPreviewScenes}
      transitions={transitionPreviewTransitions}
    />
  );
};
