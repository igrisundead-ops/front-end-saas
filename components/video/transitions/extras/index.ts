import type { TransitionPresentation } from "@remotion/transitions";
import type { TransitionSpec } from "../../types";
import { circularWipe } from "./circularWipe";

type ExtraTransitionFactory = (
  transition: TransitionSpec
) => TransitionPresentation<any>;

const extraTransitionFactories: Record<string, ExtraTransitionFactory> = {
  "circular-wipe": (transition) =>
    circularWipe({
      color: transition.presentation?.color,
    }),
};

export const getExtraTransitionKinds = (): string[] => {
  return Object.keys(extraTransitionFactories);
};

export const resolveExtraTransition = (
  kind: string,
  transition: TransitionSpec
): TransitionPresentation<any> | null => {
  const factory = extraTransitionFactories[kind];

  if (!factory) {
    return null;
  }

  return factory(transition);
};
