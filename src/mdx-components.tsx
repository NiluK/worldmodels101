import type { MDXComponents } from "mdx/types";
import { Figure, MarginNote } from "@/components/figure";
import { BrakingDemo } from "@/components/braking-demo";
import { SenseMap } from "@/components/sense-map";
import { VideoFigure, VideoPair, NoVideo } from "@/components/video-figure";
import { SearchSpill } from "@/components/search-spill";
import { SenseGlyph } from "@/components/sense-glyph";
import { AgentLoop } from "@/components/agent-loop";
import { Lineage, SourceList } from "@/components/lineage";
import { Quote, Gloss } from "@/components/quote";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Figure,
    MarginNote,
    BrakingDemo,
    SenseMap,
    VideoFigure,
    VideoPair,
    NoVideo,
    SearchSpill,
    SenseGlyph,
    AgentLoop,
    Lineage,
    SourceList,
    Quote,
    Gloss,
    ...components,
  };
}
