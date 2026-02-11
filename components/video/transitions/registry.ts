import {
  linearTiming,
  springTiming,
  type TransitionPresentation,
  type TransitionTiming,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide, type SlideDirection } from "@remotion/transitions/slide";
import { wipe, type WipeDirection } from "@remotion/transitions/wipe";
import type { SpringConfig } from "remotion";
import type { TransitionSpec } from "../types";
import { getExtraTransitionKinds, resolveExtraTransition } from "./extras";

const DEFAULT_SPRING_DURATION_REST_THRESHOLD = 0.001;
const DEFAULT_SLIDE_DIRECTION: SlideDirection = "from-right";
const DEFAULT_WIPE_DIRECTION: WipeDirection = "from-right";

type PlainObject = Record<string, unknown>;

const toPlainObject = (value: unknown): PlainObject => {
  if (!value || typeof value !== "object") {
    return {};
  }

  return value as PlainObject;
};

const toSlideDirection = (
  direction?: "left" | "right" | "up" | "down"
): SlideDirection => {
  switch (direction) {
    case "left":
      return "from-left";
    case "right":
      return "from-right";
    case "up":
      return "from-top";
    case "down":
      return "from-bottom";
    default:
      return DEFAULT_SLIDE_DIRECTION;
  }
};

const toWipeDirection = (
  direction?: "left" | "right" | "up" | "down"
): WipeDirection => {
  switch (direction) {
    case "left":
      return "from-left";
    case "right":
      return "from-right";
    case "up":
      return "from-top";
    case "down":
      return "from-bottom";
    default:
      return DEFAULT_WIPE_DIRECTION;
  }
};

const sanitizeSpringConfig = (config: PlainObject): Partial<SpringConfig> => {
  const springConfig: PlainObject = {};

  for (const [key, value] of Object.entries(config)) {
    if (key === "config" || key === "durationRestThreshold" || key === "reverse") {
      continue;
    }

    springConfig[key] = value;
  }

  return springConfig as Partial<SpringConfig>;
};

const resolveTiming = (transition: TransitionSpec): TransitionTiming => {
  if (transition.timing.kind === "spring") {
    const rootConfig = toPlainObject(transition.timing.config);
    const nestedConfig = toPlainObject(rootConfig.config);
    const springConfigSource =
      Object.keys(nestedConfig).length > 0 ? nestedConfig : rootConfig;

    return springTiming({
      durationInFrames: transition.durationInFrames,
      config: sanitizeSpringConfig(springConfigSource),
      reverse:
        typeof rootConfig.reverse === "boolean" ? rootConfig.reverse : undefined,
      durationRestThreshold:
        typeof rootConfig.durationRestThreshold === "number"
          ? rootConfig.durationRestThreshold
          : DEFAULT_SPRING_DURATION_REST_THRESHOLD,
    });
  }

  const linearConfig = toPlainObject(transition.timing.config);

  return linearTiming({
    durationInFrames: transition.durationInFrames,
    easing:
      typeof linearConfig.easing === "function"
        ? (linearConfig.easing as (input: number) => number)
        : undefined,
  });
};

const resolvePresentation = (
  transition: TransitionSpec
): TransitionPresentation<any> | undefined => {
  switch (transition.type) {
    case "none":
      return undefined;
    case "fade": {
      const color = transition.presentation?.color;

      if (!color) {
        return fade();
      }

      return fade({
        enterStyle: { backgroundColor: color },
        exitStyle: { backgroundColor: color },
      });
    }
    case "slide":
      return slide({
        direction: toSlideDirection(transition.presentation?.direction),
      });
    case "wipe":
      return wipe({
        direction: toWipeDirection(transition.presentation?.direction),
      });
    case "custom": {
      const kind = transition.presentation?.kind;

      if (!kind) {
        throw new Error(
          `[TransitionRegistry] Transition type "custom" requires presentation.kind. Registered extras: ${getExtraTransitionKinds().join(", ") || "none"}.`
        );
      }

      const extraTransition = resolveExtraTransition(kind, transition);

      if (!extraTransition) {
        throw new Error(
          `[TransitionRegistry] Unknown custom transition kind "${kind}". Registered extras: ${getExtraTransitionKinds().join(", ") || "none"}.`
        );
      }

      return extraTransition;
    }
    default: {
      const unreachableType: never = transition.type;
      throw new Error(
        `[TransitionRegistry] Unsupported transition type "${String(unreachableType)}".`
      );
    }
  }
};

export type ResolvedTransition = {
  isNone: true;
} | {
  isNone: false;
  timing: TransitionTiming;
  presentation?: TransitionPresentation<any>;
};

export const resolveTransition = (transition: TransitionSpec): ResolvedTransition => {
  if (transition.type === "none") {
    return {
      isNone: true,
    };
  }

  return {
    isNone: false,
    timing: resolveTiming(transition),
    presentation: resolvePresentation(transition),
  };
};
