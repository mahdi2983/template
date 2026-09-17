import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import defaultEmailJson from "@/content/email.json";
import type { EmailSettings } from "@/lib/email";
import type { PageContent, SiteContent } from "@/types/content";

/**
 * Content storage. In production the GitHub repo *is* the database: publishing makes
 * one commit and Vercel redeploys it. Without a token in local dev, files are written
 * straight to disk so the editor can be tried end-to-end.
 */

export interface ContentSnapshot {
  site: SiteContent;
  pages: Record<string, PageContent>;
  email: EmailSettings;
  /** Fingerprint of the stored content files, used to detect concurrent edits. */
  version: string;
}

export interface PublishInput {
  site: SiteContent;
  pages: Record<string, PageContent>;
  email: EmailSettings;
  version: string;
  /** Uploaded images: public src ("/uploads/x.webp") → ref returned by `storeImage`. */
  images: Record<string, string>;
}

export interface PublishResult {
  version: string;
  commitUrl?: string;
}

export class ConflictError extends Error {}

const SITE_FILE = "content/site.json";
const EMAIL_FILE = "content/email.json";
const PAGES_DIR = "content/pages";

const defaultEmail = defaultEmailJson as EmailSettings;
const toJson = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const fingerprint = (entries: string[]) => createHash("sha256").update(entries.sort().join("\n")).digest("hex");

interface GitHubConfig {
  token: string;
  repo: string;
  branch: string;
}

function githubConfig(): GitHubConfig | null {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo) return null;
  return { token, repo, branch: process.env.GITHUB_BRANCH || "main" };
}

export function storageMode(): "github" | "local" | "unconfigured" {
  if (githubConfig()) return "github";
  return process.env.NODE_ENV === "development" ? "local" : "unconfigured";
}

function requireMode(): "github" | "local" {
  const mode = storageMode();
  if (mode === "unconfigured") {
    throw new Error("Publishing is not configured: add GITHUB_TOKEN and GITHUB_REPO in Vercel.");
  }
  return mode;
}

/* ------------------------------------------------------------------ GitHub */

async function gh<T>(config: GitHubConfig, endpoint: string, init?: RequestInit & { raw?: boolean }): Promise<T> {
  const response = await fetch(`https://api.github.com/repos/${config.repo}${endpoint}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: init?.raw ? "application/vnd.github.raw+json" : "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (!response.ok) {
    const detail = await response.text();
    console.error(`[admin] GitHub ${init?.method ?? "GET"} ${endpoint} → ${response.status}: ${detail}`);
    throw new Error(`GitHub responded ${response.status}. Check the token and the repository name.`);
  }
  return (init?.raw ? response.text() : response.json()) as Promise<T>;
}

interface GitHubEntry {
  name: string;
  path: string;
  sha: string;
  type: string;
}

async function githubListing(config: GitHubConfig) {
  const ref = `?ref=${encodeURIComponent(config.branch)}`;
  const [root, pages] = await Promise.all([
    gh<GitHubEntry[]>(config, `/contents/content${ref}`),
    gh<GitHubEntry[]>(config, `/contents/${PAGES_DIR}${ref}`),
  ]);
  const site = root.find((entry) => entry.path === SITE_FILE);
  if (!site) throw new Error(`${SITE_FILE} not found on branch ${config.branch}.`);
  const email = root.find((entry) => entry.path === EMAIL_FILE);
  const pageFiles = pages.filter((entry) => entry.type === "file" && entry.name.endsWith(".json"));
  const tracked = [site, ...(email ? [email] : []), ...pageFiles];
  return {
    site,
    hasEmail: Boolean(email),
    pageFiles,
    version: fingerprint(tracked.map((entry) => `${entry.path}:${entry.sha}`)),
  };
}

async function githubLoad(config: GitHubConfig): Promise<ContentSnapshot> {
  const listing = await githubListing(config);
  const ref = `?ref=${encodeURIComponent(config.branch)}`;
  const read = async (file: string) => JSON.parse(await gh<string>(config, `/contents/${file}${ref}`, { raw: true }));

  const [site, email, ...pageList] = await Promise.all([
    read(SITE_FILE) as Promise<SiteContent>,
    (listing.hasEmail ? read(EMAIL_FILE) : Promise.resolve(defaultEmail)) as Promise<EmailSettings>,
    ...listing.pageFiles.map((entry) => read(entry.path) as Promise<PageContent>),
  ]);
  return {
    site,
    email: { ...defaultEmail, ...email },
    pages: Object.fromEntries(pageList.map((page) => [page.slug, page])),
    version: listing.version,
  };
}

async function githubPublish(config: GitHubConfig, input: PublishInput): Promise<PublishResult> {
  const listing = await githubListing(config);
  if (listing.version !== input.version) {
    throw new ConflictError("The content was changed elsewhere since the editor was opened.");
  }

  const head = await gh<{ object: { sha: string } }>(config, `/git/ref/heads/${config.branch}`);
  const commit = await gh<{ tree: { sha: string } }>(config, `/git/commits/${head.object.sha}`);

  const keptPaths = new Set(Object.keys(input.pages).map((slug) => `${PAGES_DIR}/${slug}.json`));
  const tree = [
    { path: SITE_FILE, mode: "100644", type: "blob", content: toJson(input.site) },
    { path: EMAIL_FILE, mode: "100644", type: "blob", content: toJson(input.email) },
    ...Object.values(input.pages).map((page) => ({
      path: `${PAGES_DIR}/${page.slug}.json`,
      mode: "100644",
      type: "blob",
      content: toJson(page),
    })),
    ...listing.pageFiles
      .filter((entry) => !keptPaths.has(entry.path))
      .map((entry) => ({ path: entry.path, mode: "100644", type: "blob", sha: null })),
    ...Object.entries(input.images).map(([src, sha]) => ({ path: `public${src}`, mode: "100644", type: "blob", sha })),
  ];

  const newTree = await gh<{ sha: string }>(config, "/git/trees", {
    method: "POST",
    body: JSON.stringify({ base_tree: commit.tree.sha, tree }),
  });
  const newCommit = await gh<{ sha: string; html_url: string }>(config, "/git/commits", {
    method: "POST",
    body: JSON.stringify({
      message: "content: update via admin",
      tree: newTree.sha,
      parents: [head.object.sha],
    }),
  });
  // force: false → GitHub rejects the update if someone pushed in between.
  await gh(config, `/git/refs/heads/${config.branch}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: newCommit.sha, force: false }),
  });

  const after = await githubListing(config);
  return { version: after.version, commitUrl: newCommit.html_url };
}

/* ------------------------------------------------------------------- Local */

const root = process.cwd();

async function localPageFiles(): Promise<string[]> {
  const files = await readdir(path.join(root, PAGES_DIR));
  return files.filter((file) => file.endsWith(".json")).map((file) => `${PAGES_DIR}/${file}`);
}

async function localRead(): Promise<{ raw: Record<string, string>; version: string }> {
  const files = [SITE_FILE, EMAIL_FILE, ...(await localPageFiles())];
  const raw = Object.fromEntries(
    await Promise.all(files.map(async (file) => [file, await readFile(path.join(root, file), "utf8")] as const)),
  );
  const version = fingerprint(files.map((file) => `${file}:${createHash("sha1").update(raw[file]!).digest("hex")}`));
  return { raw, version };
}

async function localLoad(): Promise<ContentSnapshot> {
  const { raw, version } = await localRead();
  const pages = Object.entries(raw)
    .filter(([file]) => file.startsWith(`${PAGES_DIR}/`))
    .map(([, text]) => JSON.parse(text) as PageContent);
  return {
    site: JSON.parse(raw[SITE_FILE]!) as SiteContent,
    email: { ...defaultEmail, ...(JSON.parse(raw[EMAIL_FILE]!) as EmailSettings) },
    pages: Object.fromEntries(pages.map((page) => [page.slug, page])),
    version,
  };
}

async function localPublish(input: PublishInput): Promise<PublishResult> {
  const current = await localRead();
  if (current.version !== input.version) {
    throw new ConflictError("The content was changed elsewhere since the editor was opened.");
  }
  await writeFile(path.join(root, SITE_FILE), toJson(input.site));
  await writeFile(path.join(root, EMAIL_FILE), toJson(input.email));
  const kept = new Set<string>();
  for (const page of Object.values(input.pages)) {
    const file = `${PAGES_DIR}/${page.slug}.json`;
    kept.add(file);
    await writeFile(path.join(root, file), toJson(page));
  }
  for (const file of await localPageFiles()) {
    if (!kept.has(file)) await rm(path.join(root, file));
  }
  return { version: (await localRead()).version };
}

/* -------------------------------------------------------------- Public API */

export async function loadContent(): Promise<ContentSnapshot> {
  const config = githubConfig();
  if (requireMode() === "github" && config) return githubLoad(config);
  return localLoad();
}

/** Stores one image and returns the reference `publish` needs (a git blob sha on GitHub). */
export async function storeImage(src: string, base64: string): Promise<string> {
  const config = githubConfig();
  if (requireMode() === "github" && config) {
    const blob = await gh<{ sha: string }>(config, "/git/blobs", {
      method: "POST",
      body: JSON.stringify({ content: base64, encoding: "base64" }),
    });
    return blob.sha;
  }
  const target = path.join(root, "public", src);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(base64, "base64"));
  return "local";
}

export async function publishContent(input: PublishInput): Promise<PublishResult> {
  const config = githubConfig();
  if (requireMode() === "github" && config) return githubPublish(config, input);
  return localPublish({ ...input, images: {} });
}
