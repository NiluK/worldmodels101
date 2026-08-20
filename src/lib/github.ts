/** One place for the repo, so a rename does not have to be chased through the UI. */
export const REPO = "NiluK/worldmodels101";
export const REPO_URL = `https://github.com/${REPO}`;

/**
 * Star count for the CTA, cached for an hour.
 *
 * Every caller must tolerate null. GitHub rate-limits unauthenticated requests
 * hard, and a build that fails because a social-proof number was unavailable
 * would be a bad trade. The CTA reads fine without a number.
 */
export async function getStars(): Promise<number | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}`, {
      headers: { accept: "application/vnd.github+json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { stargazers_count?: unknown };
    return typeof data.stargazers_count === "number" ? data.stargazers_count : null;
  } catch {
    return null;
  }
}
