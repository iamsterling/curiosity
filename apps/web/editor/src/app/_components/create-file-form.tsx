"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createFileWorkspace } from "@crafty/editor/ui";

const slugify = (value: string): string =>
  value.trim().toLowerCase().replace(/[^a-z0-9-]+/gu, "-").replace(/^-+|-+$/gu, "").slice(0, 64);

/**
 * Client island inside the Server Component browser: it needs an input and a
 * navigation, so it opts in. Creating a file is lazy — opening `/editor/<slug>`
 * materialises an empty scene on first save.
 */
export function CreateFileForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const slug = slugify(name);
  const workspace = slug ? createFileWorkspace(slug) : null;
  return (
    <form
      className="browser-create"
      onSubmit={(event) => {
        event.preventDefault();
        if (workspace) router.push(workspace.file.href);
      }}
    >
      <label className="sr-only" htmlFor="new-file-name">New file name</label>
      <input
        id="new-file-name"
        placeholder="New file name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        autoComplete="off"
      />
      <button type="submit" disabled={!slug}>Create</button>
      {workspace ? <span className="browser-create-hint">{workspace.file.href}</span> : null}
    </form>
  );
}
