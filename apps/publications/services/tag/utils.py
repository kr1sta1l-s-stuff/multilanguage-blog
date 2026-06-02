import re


_NON_WORD = re.compile(r"[\W_]+", flags=re.UNICODE)


def slugify(name: str) -> str:
    lowered = name.strip().casefold()
    collapsed = _NON_WORD.sub("-", lowered)
    return collapsed.strip("-")
