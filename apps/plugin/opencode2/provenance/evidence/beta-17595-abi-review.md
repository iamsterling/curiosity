# beta-17595 ABI review

- Compared registry packages: `@opencode-ai/plugin@0.0.0-beta-17519` and
  `@opencode-ai/plugin@0.0.0-beta-17595`.
- beta-17595 plugin integrity:
  `sha512-AeK5lPPpy/3IO7zgmLvn9uaQD4OzN8EYQlxFk8P5WxOb1THLAzNs3c8eQJ8ZY2k6SFgdZJ/Vr+0Czo06yEI0RA==`.
- beta-17595 CLI integrity:
  `sha512-suz/2lpQv2yb6Z45OJeE9bQnBUrNj1ed5qXHLp+BNmowD8ltGdZ8CatOyT7tZBmmG7e3XQOL7+YB8B8SelcaQw==`.
- beta-17595 Darwin arm64 CLI integrity:
  `sha512-eWvkULx1V6R3pCTGThsAlgP7950qTziiNX1UHKw8sbHSxeXSSFyKMzLy/+ER36BCWXuniV16sMQ3WC3/EIRUlw==`.
- Active and registry Darwin arm64 executable SHA-256:
  `874ba7c06b959f308beb4dbd825e331fedc86196d8c79ab65c45afea2ca86746`.
- Resolved Promise SDK entrypoint SHA-256:
  `635130e6226771c2db358921af2dd3a2c6a03e39f3c926f54f56ba8e4392506f`.
- Reviewed used surfaces: Promise and Effect `Plugin.define`, Promise adapter,
  app/options, session prompt/interrupt/context hook, tool transform/hooks, and
  event subscription. The declaration changes add MCP context capabilities;
  they do not remove or alter those used surfaces.
- Exact companion Effect version: `4.0.0-beta.107`, integrity
  `sha512-OoBAv8eF+yanc+C6xhgEUnWeXUSHA6ynnscYqpkAY9GSnzZWystsIjBowVqCkLpHGlnRtdIqYT3wHwpOY6JDnQ==`.
