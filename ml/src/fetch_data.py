"""Download the UCI Statlog German Credit dataset (docs/02 F10).

1,000 loan applications from a German bank (1994), each labelled good/bad
credit risk. Public, well-documented, and small enough to train in seconds:
https://archive.ics.uci.edu/dataset/144/statlog+german+credit+data
"""

from __future__ import annotations

import urllib.request
from pathlib import Path

URL = (
    "https://archive.ics.uci.edu/ml/machine-learning-databases/"
    "statlog/german/german.data"
)
DATA_DIR = Path(__file__).resolve().parents[1] / "data"
DATA_FILE = DATA_DIR / "german.data"


def fetch(force: bool = False) -> Path:
    """Download the raw dataset if not already present. Returns the path."""
    if DATA_FILE.exists() and not force:
        print(f"already present: {DATA_FILE}")
        return DATA_FILE
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    print(f"downloading {URL} ...")
    with urllib.request.urlopen(URL, timeout=60) as resp:  # noqa: S310 (fixed https URL)
        raw = resp.read()
    if len(raw) < 50_000:  # sanity: the file is ~80 KB
        raise RuntimeError(f"download looks truncated ({len(raw)} bytes)")
    DATA_FILE.write_bytes(raw)
    print(f"saved {len(raw):,} bytes -> {DATA_FILE}")
    return DATA_FILE


if __name__ == "__main__":
    fetch()
