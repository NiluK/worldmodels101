import type { MDXComponents } from "mdx/types";
import { Figure, MarginNote } from "@/components/figure";
import { BrakingDemo } from "@/components/braking-demo";
import { DefinitionMap } from "@/components/definition-map";
import { VideoFigure, VideoPair } from "@/components/video-figure";
import { SearchSpill } from "@/components/search-spill";
import { DefinitionGlyph } from "@/components/definition-glyph";
import { AgentLoop } from "@/components/agent-loop";
import { SourceList } from "@/components/sources";
import { Quote, Gloss } from "@/components/quote";
import { TransitionEquation } from "@/components/transition-equation";
import { GeneratedLandscape } from "@/components/generated-landscape";
import { ArchitectureTimeline } from "@/components/architecture-timeline";
import { HorizonSlider } from "@/components/horizon-slider";
import { RolloutEquation } from "@/components/rollout-equation";
import { Quiz } from "@/components/quiz";

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
    AgentLoop,
    SourceList,
    Quote,
    Gloss,
    TransitionEquation,
    GeneratedLandscape,
    ArchitectureTimeline,
    HorizonSlider,
    RolloutEquation,
    Quiz,
    ...components,
  };
}
