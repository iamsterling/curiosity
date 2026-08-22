FROM oven/bun:1.3.14@sha256:e10577f0db68676a7024391c6e5cb4b879ebd17188ab750cf10024a6d700e5c4

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates git openssh-client procps ripgrep tini \
  && rm -rf /var/lib/apt/lists/*

COPY acquire.mjs candidate-boundary-probe.mjs prepare.mjs validate.mjs validation-files.mjs /opt/opencode2-validation/

ENTRYPOINT ["/usr/bin/tini", "--", "bun"]
