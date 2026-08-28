FROM crafty-font-harness-python-source:655d35e6 AS python-source

FROM crafty-font-harness-runtime:16e22a55

USER root
WORKDIR /capsule
COPY font-security-harness.mjs font-harness-limit-exec.py capsule-control.mjs capsule-entrypoint.sh attestation.json ./
COPY --from=python-source /usr/bin/python3.12 /usr/bin/python3.12
COPY --from=python-source /usr/lib/libpython3.12.so.1.0 /usr/lib/libpython3.12.so.1.0
COPY --from=python-source /usr/lib/python3.12 /usr/lib/python3.12
RUN ln -s python3.12 /usr/bin/python3 \
  && mkdir -p /scripts \
  && cp /capsule/font-harness-limit-exec.py /scripts/font-harness-limit-exec.py \
  && chown root:root /capsule/* /scripts/font-harness-limit-exec.py \
  && chmod 0555 /capsule/capsule-entrypoint.sh /capsule/font-harness-limit-exec.py \
  && chmod 0555 /scripts/font-harness-limit-exec.py \
  && chmod 0444 /capsule/font-security-harness.mjs /capsule/capsule-control.mjs /capsule/attestation.json
USER 65532:65532
ENTRYPOINT ["/capsule/capsule-entrypoint.sh"]
CMD ["attest"]
