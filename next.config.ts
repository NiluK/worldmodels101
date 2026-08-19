import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
};

/**
 * Turbopack serialises loader options, so MDX plugins are referenced by name
 * rather than imported here.
 */
const withMDX = createMDX({
  options: {
    remarkPlugins: [["remark-gfm", {}], ["remark-math", {}]],
    rehypePlugins: [
      ["rehype-slug", {}],
      ["rehype-katex", { strict: false }],
    ],
  },
});

export default withMDX(nextConfig);
