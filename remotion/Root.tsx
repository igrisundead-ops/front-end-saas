import { Composition } from "remotion";
import type { FC } from "react";
import {
  TransitionPreviewComposition,
  transitionPreviewDurationInFrames,
} from "../components/video/TransitionPreviewComposition";

export const RemotionRoot: FC = () => {
  return (
    <>
      <Composition
        id="TransitionPreview"
        component={TransitionPreviewComposition}
        durationInFrames={transitionPreviewDurationInFrames}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
