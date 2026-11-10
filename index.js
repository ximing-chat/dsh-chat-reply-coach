import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGE_DIR = dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = join(PACKAGE_DIR, "skills", "chat-reply-coach");

export const name = "chat-reply-coach";
export const inject = ["skills"];

/** Strip a leading YAML frontmatter block, keeping the body verbatim. */
function stripFrontmatter(raw) {
  const match = raw.match(/^---\r?\n[\s\S]*?\r?\n---[ \t]*\r?\n?/);
  return match === null ? raw : raw.slice(match[0].length);
}

/**
 * Register the bundled skill as a runtime skill so it is available in every
 * workspace of this profile. The catalog entry points at the package's own
 * `skills/chat-reply-coach` directory, so `references/*` resolve there.
 */
export function apply(ctx) {
  let meta;
  let content;
  try {
    const raw = readFileSync(join(SKILL_DIR, "SKILL.md"), "utf8");
    meta = JSON.parse(readFileSync(join(SKILL_DIR, "meta.json"), "utf8"));
    content = stripFrontmatter(raw).trim();
  } catch (error) {
    const code = error?.code ?? "UNKNOWN";
    ctx.logger.warn(`chat-reply-coach: skill files unreadable (${code}), registration skipped`);
    return;
  }

  ctx.effect(() =>
    ctx.skills.register({
      name: meta.name,
      description: meta.description,
      whenToUse: meta.whenToUse,
      content,
      source: "plugin:chat-reply-coach",
      path: join(SKILL_DIR, "SKILL.md"),
      resourceBase: { kind: "directory", path: SKILL_DIR },
      invocation: { modelInvocable: true, userInvocable: true },
    }),
  );
}
