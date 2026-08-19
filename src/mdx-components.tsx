import type { MDXComponents } from "mdx/types";
import { Figure, MarginNote } from "@/components/figure";
import { BrakingDemo } from "@/components/braking-demo";
import { DefinitionMap } from "@/components/definition-map";
import { VideoFigure, VideoPair, NoVideo } from "@/components/video-figure";
import { SearchSpill } from "@/components/search-spill";
import { DefinitionGlyph } from "@/components/definition-glyph";
import { AgentLoop } from "@/components/agent-loop";
import { Lineage, SourceList } from "@/components/lineage";
import { Quote, Gloss } from "@/components/quote";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Figure,
    MarginNote,
    BrakingDemo,
    DefinitionMap,
    VideoFigure,
    VideoPair,
    NoVideo,
    SearchSpill,
    DefinitionGlyph,
    AgentLoop,
    Lineage,
    SourceList,
    Quote,
    Gloss,
    ...components,
  };
}
