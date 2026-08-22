import type { MDXComponents } from "mdx/types";
import { Figure, MarginNote } from "@/components/figure";
import { BrakingDemo } from "@/components/braking-demo";
import { DefinitionMap } from "@/components/definition-map";
import { VideoFigure, VideoPair } from "@/components/video-figure";
import { SearchSpill } from "@/components/search-spill";
import { DefinitionGlyph } from "@/components/definition-glyph";
import { OutputGallery } from "@/components/output-gallery";
import { FramesToState } from "@/components/frames-to-state";
import { PredictionCompression } from "@/components/prediction-compression";
import { GuessCheckAdjust } from "@/components/guess-check-adjust";
import { LatentRoom } from "@/components/latent-room";
import { LatentInterpolate } from "@/components/latent-interpolate";
import { Bottleneck } from "@/components/bottleneck";
import { FreeRunning } from "@/components/free-running";
import { MemoryTrade } from "@/components/memory-trade";
import { DreamBudget } from "@/components/dream-budget";
import { DreamTemperature } from "@/components/dream-temperature";
import { PixelBlur } from "@/components/pixel-blur";
import { Collapse } from "@/components/collapse";
import { EmergentPhysics } from "@/components/emergent-physics";
import { ActionConditioned } from "@/components/action-conditioned";
import { WhatBreaks } from "@/components/what-breaks";
import { NoRanking } from "@/components/no-ranking";
import { AgentLoop } from "@/components/agent-loop";
import { SourceList } from "@/components/sources";
import { Quote, Gloss } from "@/components/quote";
import { TransitionEquation } from "@/components/transition-equation";
import { GeneratedLandscape } from "@/components/generated-landscape";
import { ArchitectureTimeline } from "@/components/architecture-timeline";
import { HorizonSlider } from "@/components/horizon-slider";
import { RolloutEquation } from "@/components/rollout-equation";
import { Quiz } from "@/components/quiz";
import { Planner } from "@/components/planner";
import { Exploitation } from "@/components/exploitation";
import { ServeBudget } from "@/components/serve-budget";
import { LearnedDynamics } from "@/components/learned-dynamics";
import { CompoundingRollout } from "@/components/compounding-rollout";
import { ArgmaxMismatch } from "@/components/argmax-mismatch";
import { RecoveryBasin } from "@/components/recovery-basin";
import { ImaginedData } from "@/components/imagined-data";
import { FutureSampler } from "@/components/future-sampler";
import { ActionFidelity } from "@/components/action-fidelity";
import { FailureMatrix } from "@/components/failure-matrix";
import { KalmanTracker } from "@/components/kalman-tracker";
import { TwoNetworks } from "@/components/two-networks";
import { ExperienceBill } from "@/components/experience-bill";
import { ThreePieces } from "@/components/three-pieces";
import { WordTravels } from "@/components/word-travels";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Figure,
    MarginNote,
    BrakingDemo,
    DefinitionMap,
    VideoFigure,
    VideoPair,
    SearchSpill,
    DefinitionGlyph,
    OutputGallery,
    FramesToState,
    PredictionCompression,
    GuessCheckAdjust,
    LatentRoom,
    LatentInterpolate,
    Bottleneck,
    FreeRunning,
    MemoryTrade,
    DreamBudget,
    DreamTemperature,
    PixelBlur,
    Collapse,
    EmergentPhysics,
    ActionConditioned,
    WhatBreaks,
    NoRanking,
    AgentLoop,
    SourceList,
    Quote,
    Gloss,
    TransitionEquation,
    GeneratedLandscape,
    ArchitectureTimeline,
    KalmanTracker,
    TwoNetworks,
    ExperienceBill,
    ThreePieces,
    WordTravels,
    HorizonSlider,
    RolloutEquation,
    Quiz,
    Planner,
    Exploitation,
    ServeBudget,
    LearnedDynamics,
    CompoundingRollout,
    ArgmaxMismatch,
    RecoveryBasin,
    ImaginedData,
    FutureSampler,
    ActionFidelity,
    FailureMatrix,
    ...components,
  };
}
