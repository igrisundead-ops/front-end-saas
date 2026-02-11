import { TransitionSeries } from "@remotion/transitions";
import { Fragment, type FC } from "react";
import { resolveTransition } from "./transitions/registry";
import {
  isActiveTransition,
  normalizeTransitions,
  type SceneSpec,
  type TransitionSpec,
} from "./types";

export type StitchedTimelineProps = {
  scenes: SceneSpec[];
  transitions?: Array<TransitionSpec | undefined>;
};

const formatScene = (scene: SceneSpec): string => {
  return `${scene.id} (${scene.durationInFrames}f)`;
};

const isPositiveInteger = (value: unknown): value is number => {
  return Number.isInteger(value) && Number(value) > 0;
};

const validateScenes = (scenes: SceneSpec[]): void => {
  if (scenes.length === 0) {
    throw new Error("[StitchedTimeline] At least one scene is required.");
  }

  const seenIds = new Set<string>();

  scenes.forEach((scene, index) => {
    if (!scene.id || typeof scene.id !== "string") {
      throw new Error(
        `[StitchedTimeline] Scene at index ${index} is missing a valid string id.`
      );
    }

    if (seenIds.has(scene.id)) {
      throw new Error(`[StitchedTimeline] Duplicate scene id "${scene.id}".`);
    }

    seenIds.add(scene.id);

    if (!isPositiveInteger(scene.durationInFrames)) {
      throw new Error(
        `[StitchedTimeline] Scene "${scene.id}" has invalid duration ${scene.durationInFrames}. Duration must be a positive integer frame count.`
      );
    }

    if (typeof scene.Component !== "function") {
      throw new Error(
        `[StitchedTimeline] Scene "${scene.id}" is missing a valid React component.`
      );
    }
  });
};

const validateTransitions = (
  scenes: SceneSpec[],
  transitions: TransitionSpec[]
): void => {
  transitions.forEach((transition, boundaryIndex) => {
    const previousScene = scenes[boundaryIndex];
    const nextScene = scenes[boundaryIndex + 1];
    const boundaryLabel = `${formatScene(previousScene)} -> ${formatScene(nextScene)}`;

    if (transition.type === "none") {
      if (transition.durationInFrames !== 0) {
        throw new Error(
          `[StitchedTimeline] Transition at boundary "${boundaryLabel}" has type "none" but durationInFrames=${transition.durationInFrames}. Use duration 0 or omit this transition entry.`
        );
      }

      return;
    }

    if (!isPositiveInteger(transition.durationInFrames)) {
      throw new Error(
        `[StitchedTimeline] Transition at boundary "${boundaryLabel}" has invalid duration ${transition.durationInFrames}. Duration must be a positive integer frame count.`
      );
    }

    if (transition.durationInFrames > previousScene.durationInFrames) {
      throw new Error(
        `[StitchedTimeline] Transition at boundary "${boundaryLabel}" is too long (${transition.durationInFrames}f). It exceeds previous scene "${previousScene.id}" (${previousScene.durationInFrames}f).`
      );
    }

    if (transition.durationInFrames > nextScene.durationInFrames) {
      throw new Error(
        `[StitchedTimeline] Transition at boundary "${boundaryLabel}" is too long (${transition.durationInFrames}f). It exceeds next scene "${nextScene.id}" (${nextScene.durationInFrames}f).`
      );
    }

    if (transition.type === "custom" && !transition.presentation?.kind) {
      throw new Error(
        `[StitchedTimeline] Transition at boundary "${boundaryLabel}" uses type "custom" but no presentation.kind was provided.`
      );
    }
  });

  // TransitionSeries disallows adjacent Transition nodes; positive scene durations
  // guarantee every transition is separated by a Sequence.
  for (let sceneIndex = 1; sceneIndex < scenes.length - 1; sceneIndex += 1) {
    const leftTransition = transitions[sceneIndex - 1];
    const rightTransition = transitions[sceneIndex];

    if (
      leftTransition &&
      rightTransition &&
      isActiveTransition(leftTransition) &&
      isActiveTransition(rightTransition) &&
      scenes[sceneIndex].durationInFrames <= 0
    ) {
      throw new Error(
        `[StitchedTimeline] Scene "${scenes[sceneIndex].id}" would create adjacent transitions. Scene durations must stay positive between transitions.`
      );
    }
  }
};

const getOverlapInFrames = (transitions: TransitionSpec[]): number => {
  return transitions.reduce((total, transition) => {
    if (!isActiveTransition(transition)) {
      return total;
    }

    return total + transition.durationInFrames;
  }, 0);
};

const validateAndNormalize = ({
  scenes,
  transitions,
}: StitchedTimelineProps): TransitionSpec[] => {
  validateScenes(scenes);
  const normalizedTransitions = normalizeTransitions({ scenes, transitions });
  validateTransitions(scenes, normalizedTransitions);
  return normalizedTransitions;
};

export const getStitchedTimelineDurationInFrames = ({
  scenes,
  transitions,
}: StitchedTimelineProps): number => {
  const normalizedTransitions = validateAndNormalize({ scenes, transitions });
  const sceneDuration = scenes.reduce((total, scene) => {
    return total + scene.durationInFrames;
  }, 0);
  const overlapDuration = getOverlapInFrames(normalizedTransitions);
  const stitchedDuration = sceneDuration - overlapDuration;

  if (stitchedDuration <= 0) {
    throw new Error(
      `[StitchedTimeline] Computed non-positive total duration (${stitchedDuration}f). Scene durations: ${scenes.map(formatScene).join(", ")}.`
    );
  }

  return stitchedDuration;
};

export const StitchedTimeline: FC<StitchedTimelineProps> = ({
  scenes,
  transitions,
}) => {
  const normalizedTransitions = validateAndNormalize({ scenes, transitions });

  return (
    <TransitionSeries>
      {scenes.map((scene, sceneIndex) => {
        const SceneComponent = scene.Component;
        const boundaryTransition = normalizedTransitions[sceneIndex];
        const resolvedTransition =
          boundaryTransition && boundaryTransition.type !== "none"
          ? resolveTransition(boundaryTransition)
          : null;

        return (
          <Fragment key={scene.id}>
            <TransitionSeries.Sequence
              durationInFrames={scene.durationInFrames}
              name={scene.id}
            >
              <SceneComponent {...scene.props} />
            </TransitionSeries.Sequence>
            {resolvedTransition && !resolvedTransition.isNone ? (
              <TransitionSeries.Transition
                timing={resolvedTransition.timing}
                presentation={resolvedTransition.presentation}
              />
            ) : null}
          </Fragment>
        );
      })}
    </TransitionSeries>
  );
};
