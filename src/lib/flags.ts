/**
 * Narration is fully wired: `pnpm narrate` generates the MP3s, they deploy as
 * static assets, and <Narration /> plays them. Only the on-page player is
 * hidden. Flip this to true to bring it back — nothing else needs changing.
 *
 * Audio still lives at /audio/<slug>.mp3 and remains directly reachable.
 */
export const SHOW_NARRATION = false;
