#!/usr/bin/env python3
"""Apply per-process resource limits, then replace this process with the target."""

import json
import os
import resource
import sys


def fail(code: str) -> None:
    sys.stderr.write(json.dumps({"diagnostic": code}, separators=(",", ":")) + "\n")
    raise SystemExit(125)


if len(sys.argv) < 3:
    fail("HARNESS_LAUNCH_ARGUMENT_INVALID")

try:
    limits = json.loads(sys.argv[1])
    cpu_soft = int(limits["cpuSoftSeconds"])
    cpu_hard = int(limits["cpuHardSeconds"])
    address_space = int(limits["addressSpaceBytes"])
    enforce_address_space = bool(limits["enforceAddressSpace"])
    file_size = int(limits["fileSizeBytes"])
    open_files = int(limits["openFiles"])
except (KeyError, TypeError, ValueError, json.JSONDecodeError):
    fail("HARNESS_LIMIT_CONFIG_INVALID")

limits_to_install = [
    (resource.RLIMIT_CPU, (cpu_soft, cpu_hard), "HARNESS_CPU_LIMIT_INSTALL_FAILED"),
    (resource.RLIMIT_FSIZE, (file_size, file_size), "HARNESS_FILE_SIZE_LIMIT_INSTALL_FAILED"),
    (resource.RLIMIT_NOFILE, (open_files, open_files), "HARNESS_OPEN_FILES_LIMIT_INSTALL_FAILED"),
]
if enforce_address_space:
    limits_to_install.append(
        (resource.RLIMIT_AS, (address_space, address_space), "HARNESS_ADDRESS_SPACE_LIMIT_INSTALL_FAILED")
    )

for resource_id, value, diagnostic in limits_to_install:
    try:
        resource.setrlimit(resource_id, value)
    except (OSError, ValueError):
        fail(diagnostic)

try:
    os.execv(sys.argv[2], sys.argv[2:])
except OSError:
    fail("HARNESS_EXEC_FAILED")
