from pathlib import Path
from hashlib import sha256
from difflib import SequenceMatcher

root = Path(__file__).parent / "canonical-bytes"
pairs = [
    ("migration-v4-before.json", "migration-v5-after.json", "v4 acceptance migration"),
    ("foundation-v4-before.json", "foundation-v5-after.json", "foundation document fixture"),
    ("loss-list-v4-before.json", "loss-list-v5-after.json", "loss-list document fixture"),
]

for before_name, after_name, label in pairs:
    before = (root / before_name).read_bytes()
    after = (root / after_name).read_bytes()
    print(f"PAIR {label}")
    print(f"BEFORE {before_name} bytes={len(before)} sha256={sha256(before).hexdigest()}")
    print(f"AFTER  {after_name} bytes={len(after)} sha256={sha256(after).hexdigest()}")
    for tag, before_start, before_end, after_start, after_end in SequenceMatcher(
        None, before, after, autojunk=False
    ).get_opcodes():
        if tag != "equal":
            print(
                f"EDIT {tag} before[{before_start}:{before_end}]="
                f"{before[before_start:before_end].hex()} "
                f"after[{after_start}:{after_end}]={after[after_start:after_end].hex()}"
            )
    print()
