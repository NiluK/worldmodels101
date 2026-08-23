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
import { TwoStories } from "@/components/two-stories";
import { ThreePapers1990 } from "@/components/three-papers-1990";
import { PlanOrLearn } from "@/components/plan-or-learn";
import { ThreeNumbers } from "@/components/three-numbers";
import { PredictTheSummary } from "@/components/predict-the-summary";
import { ProbeBoard } from "@/components/probe-board";
import { StateObservation } from "@/components/state-observation";
import { BallBehindWall } from "@/components/ball-behind-wall";
import { BranchedRollouts } from "@/components/branched-rollouts";
import { CacheOrRecipe } from "@/components/cache-or-recipe";
import { CollapseLineage } from "@/components/collapse-lineage";
import { CompressionProgress } from "@/components/compression-progress";
import { CopiedFromFootage } from "@/components/copied-from-footage";
import { CostOfASymbol } from "@/components/cost-of-a-symbol";
import { EnsembleDisagreement } from "@/components/ensemble-disagreement";
import { FireballPolicy } from "@/components/fireball-policy";
import { FiveFailures } from "@/components/five-failures";
import { FourQuestions } from "@/components/four-questions";
import { KeepOrLookBack } from "@/components/keep-or-look-back";
import { LatentActions } from "@/components/latent-actions";
import { LeafLedger } from "@/components/leaf-ledger";
import { MaskedRebuild } from "@/components/masked-rebuild";
import { MemoriseOrRule } from "@/components/memorise-or-rule";
import { ModelAndPolicy } from "@/components/model-and-policy";
import { NameableAxes } from "@/components/nameable-axes";
import { NextWordDepends } from "@/components/next-word-depends";
import { NoiseToFrame } from "@/components/noise-to-frame";
import { PixelBudget } from "@/components/pixel-budget";
import { PixelsOrLatent } from "@/components/pixels-or-latent";
import { ProfessorForcing } from "@/components/professor-forcing";
import { RandomisedSimulator } from "@/components/randomised-simulator";
import { SamePointTwoFutures } from "@/components/same-point-two-futures";
import { ScheduledSamplingDial } from "@/components/scheduled-sampling-dial";
import { SecondLap } from "@/components/second-lap";
import { SeedLottery } from "@/components/seed-lottery";
import { SharedDescription } from "@/components/shared-description";
import { SingleFrameAlibi } from "@/components/single-frame-alibi";
import { StowawayLedger } from "@/components/stowaway-ledger";
import { TeacherForcingLoop } from "@/components/teacher-forcing-loop";
import { ThousandVersions } from "@/components/thousand-versions";
import { ThreeTargets } from "@/components/three-targets";
import { TrustHorizon } from "@/components/trust-horizon";
import { TwoZeroLosses } from "@/components/two-zero-losses";
import { UncertaintyPenalty } from "@/components/uncertainty-penalty";
import { WhoLabelledIt } from "@/components/who-labelled-it";
import { WordClusters } from "@/components/word-clusters";
import { GapDecision } from "@/components/gap-decision";

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
    TwoStories,
    ThreePapers1990,
    PlanOrLearn,
    ThreeNumbers,
    PredictTheSummary,
    ProbeBoard,
    StateObservation,
    BallBehindWall,
    BranchedRollouts,
    CacheOrRecipe,
    CollapseLineage,
    CompressionProgress,
    CopiedFromFootage,
    CostOfASymbol,
    EnsembleDisagreement,
    FireballPolicy,
    FiveFailures,
    FourQuestions,
    KeepOrLookBack,
    LatentActions,
    LeafLedger,
    MaskedRebuild,
    MemoriseOrRule,
    ModelAndPolicy,
    NameableAxes,
    NextWordDepends,
    NoiseToFrame,
    PixelBudget,
    PixelsOrLatent,
    ProfessorForcing,
    RandomisedSimulator,
    SamePointTwoFutures,
    ScheduledSamplingDial,
    SecondLap,
    SeedLottery,
    SharedDescription,
    SingleFrameAlibi,
    StowawayLedger,
    TeacherForcingLoop,
    ThousandVersions,
    ThreeTargets,
    TrustHorizon,
    TwoZeroLosses,
    UncertaintyPenalty,
    WhoLabelledIt,
    WordClusters,
    GapDecision,
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
