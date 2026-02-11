import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import { AbsoluteFill } from "remotion";
import type React from "react";

export type CircularWipeProps = {
  color?: string;
};

const CircularWipePresentationComponent: React.FC<
  TransitionPresentationComponentProps<CircularWipeProps>
> = ({ children, passedProps, presentationDirection, presentationProgress }) => {
  const normalizedProgress = Math.min(
    1,
    Math.max(
      0,
      presentationDirection === "entering"
        ? presentationProgress
        : 1 - presentationProgress
    )
  );
  const radius = normalizedProgress * 150;
  const clipPath = `circle(${radius}% at 50% 50%)`;

  return (
    <AbsoluteFill style={{ backgroundColor: passedProps.color ?? "#000000" }}>
      <AbsoluteFill style={{ clipPath, WebkitClipPath: clipPath }}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const circularWipe = (
  props?: CircularWipeProps
): TransitionPresentation<CircularWipeProps> => {
  return {
    component: CircularWipePresentationComponent,
    props: {
      color: props?.color ?? "#000000",
    },
  };
};
