setup sqlite

drizzle

Effect.ts?

# Canvas

Increase zoom sensitivity

Pages

Reusable Components/Symbols

Figma-style Smart Stacks

Easy Animate

CMD+A should select all layers in current canvas, not DOM elements.

Scroll

select -&gt; double click -&gt; edit points



&nbsp;

&nbsp;

# UI

Align Panel (pen.dev's grid)

glass UI effects since we're already using webGPU? ([https://github.com/jeantimex/glass-effect-webgpu](https://github.com/jeantimex/glass-effect-webgpu))

Prototyping

# Hosted
binary build
MCP server
OAuth
Multi-tenant

# CMS




BUGS:
- remember zoom level, coordinate focus on refresh/reload
- true websocket/multiplayer per document!
- snap to x/y with every tool. possibly proximity based within 10-15px.
- show dot indicator below pen cursor before clicking on canvas, to show the user where there are placing a point
- show half-way indicator on pen path when hovering that line, when hovering over any pen path show another similar indicator and snap the placement to that line within proximity.
- denote between active pen dot(last touched/placed/selected/etc) and inactive! other apps use white dots for inactive, then smaller blue/colored dot inside the white dot for active.


- every single thing that can go in the canvas is constructed through "pen points", <-- look up the correct term here
- Double clicking / hitting enter on an already selected element in the canvas should transition to edit mode, exposing that element's pen nodes.


- when moving an object, hold shift + move to center the object in viewport and see the canvas moving behind it, instead of moving the object within the part of the viewport/canvas we can see. make sense?







/feature default action over canvas should be contextual. when no objects/elements are below the cursor, use hand tool, when elements are below cursor, use select tool.

/bug seeing this warning in devtools: "WebGPU canvas configured with a different format than is preferred by this device ("bgra8unorm"). This requires an extra copy, which may impact performance."