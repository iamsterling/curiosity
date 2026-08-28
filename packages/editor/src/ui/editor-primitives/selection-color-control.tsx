"use client";

import { Button } from "../primitives/button.js";
import { SelectionColorInput } from "./selection-color-input.js";
import { SelectionColorValue } from "./selection-color-value.js";

export const SelectionColorControl = ({
  property,
}: {
  property: "fill" | "stroke";
}): React.ReactNode => (
  <Button
    type="button"
    variant="ghost"
    size="icon-lg"
    aria-label={`${property} color`}
    title={`${property} color`}
    className="pointer-events-auto relative size-10 overflow-hidden rounded-xl border border-border/60 bg-muted/45 p-1.5 hover:bg-muted"
    onPointerDown={(event) => event.stopPropagation()}
    onClick={(event) => event.stopPropagation()}
  >
    <SelectionColorValue
      property={property}
      kind={property}
      aria-hidden="true"
      className="size-7 rounded-lg border-2 border-black/15 shadow-inner"
    />
    <SelectionColorInput
      property={property}
      className="absolute inset-0 size-full cursor-pointer opacity-0"
      aria-label={`${property} color picker`}
    />
  </Button>
);
