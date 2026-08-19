import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],

  /**
   * One canonical host. Both www and the apex resolve to this project and both
   * answered 200, which is the same page served on two hostnames: link equity
   * splits and search engines have to guess which is real. The apex is the
   * brand, so www redirects to it.
   */
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.worldmodels101.com" }],
        destination: "https://worldmodels101.com/:path*",
        permanent: true,
      },
    ];
  },
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
