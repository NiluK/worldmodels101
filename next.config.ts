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

      /**
       * The chapter slugs were working titles ("the-idea", "latents") and are
       * now the question each chapter answers, which is what people search
       * for. These are permanent so the old links, and whatever search engines
       * already hold, land on the right page instead of a 404.
       */
      {
        source: "/chapters/what-people-mean",
        destination: "/chapters/what-is-a-world-model",
        permanent: true,
      },
      {
        source: "/zh/chapters/what-people-mean",
        destination: "/zh/chapters/what-is-a-world-model",
        permanent: true,
      },
      {
        source: "/chapters/the-idea",
        destination: "/chapters/how-do-world-models-work",
        permanent: true,
      },
      {
        source: "/zh/chapters/the-idea",
        destination: "/zh/chapters/how-do-world-models-work",
        permanent: true,
      },
      {
        source: "/chapters/prediction",
        destination: "/chapters/why-prediction-is-learning",
        permanent: true,
      },
      {
        source: "/zh/chapters/prediction",
        destination: "/zh/chapters/why-prediction-is-learning",
        permanent: true,
      },
      {
        source: "/chapters/latents",
        destination: "/chapters/what-is-latent-space",
        permanent: true,
      },
      {
        source: "/zh/chapters/latents",
        destination: "/zh/chapters/what-is-latent-space",
        permanent: true,
      },
      {
        source: "/chapters/dynamics",
        destination: "/chapters/what-is-a-dynamics-model",
        permanent: true,
      },
      {
        source: "/zh/chapters/dynamics",
        destination: "/zh/chapters/what-is-a-dynamics-model",
        permanent: true,
      },
      {
        source: "/chapters/dreaming",
        destination: "/chapters/can-ai-learn-inside-a-world-model",
        permanent: true,
      },
      {
        source: "/zh/chapters/dreaming",
        destination: "/zh/chapters/can-ai-learn-inside-a-world-model",
        permanent: true,
      },
      {
        source: "/chapters/jepa",
        destination: "/chapters/what-is-jepa",
        permanent: true,
      },
      {
        source: "/zh/chapters/jepa",
        destination: "/zh/chapters/what-is-jepa",
        permanent: true,
      },
      {
        source: "/chapters/video-worlds",
        destination: "/chapters/are-video-models-world-simulators",
        permanent: true,
      },
      {
        source: "/zh/chapters/video-worlds",
        destination: "/zh/chapters/are-video-models-world-simulators",
        permanent: true,
      },
      {
        source: "/chapters/whats-broken",
        destination: "/chapters/what-is-still-broken",
        permanent: true,
      },
      {
        source: "/zh/chapters/whats-broken",
        destination: "/zh/chapters/what-is-still-broken",
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
