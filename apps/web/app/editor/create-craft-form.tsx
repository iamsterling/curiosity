"use client";

import { createFileWorkspace } from "@crafty/editor/ui";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import styles from "./editor.module.css";

const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 64);

export const CreateCraftForm = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const slug = slugify(name);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (slug) router.push(createFileWorkspace(slug).file.href);
  };

  return (
    <form className={styles.createForm} onSubmit={submit}>
      <label htmlFor="new-craft-name">New canvas</label>
      <input
        autoComplete="off"
        id="new-craft-name"
        onChange={(event) => setName(event.target.value)}
        placeholder="Canvas name"
        value={name}
      />
      <button disabled={!slug} type="submit">
        Create
      </button>
    </form>
  );
};
