import re

UGANDA_CODE = "256"


def normalize_phone(raw):
    text = (raw or "").strip()
    if not text:
        raise ValueError("Please enter a valid phone number.")

    has_plus = text.startswith("+")
    digits = re.sub(r"\D", "", text)
    if len(digits) < 9:
        raise ValueError("Please enter a valid phone number.")

    if digits.startswith("0") and len(digits) in (9, 10):
        national = digits.lstrip("0")
        if len(national) < 9:
            raise ValueError("Please enter a valid phone number.")
        return f"+{UGANDA_CODE}{national}"

    if len(digits) == 9 and digits.startswith("7"):
        return f"+{UGANDA_CODE}{digits}"

    if digits.startswith(UGANDA_CODE):
        national = digits[len(UGANDA_CODE) :]
        if national.startswith("0"):
            national = national[1:]
        if len(national) < 9:
            raise ValueError("Please enter a valid phone number.")
        return f"+{UGANDA_CODE}{national}"

    if has_plus or 10 <= len(digits) <= 15:
        if len(digits) > 15:
            raise ValueError("Please enter a valid phone number.")
        return f"+{digits}"

    raise ValueError("Please enter a valid phone number.")


def display_phone(value):
    if not value:
        return ""
    text = str(value).strip()
    if not text.startswith("+"):
        try:
            text = normalize_phone(text)
        except ValueError:
            return text
    digits = text[1:]
    if digits.startswith(UGANDA_CODE) and len(digits) >= 12:
        national = digits[len(UGANDA_CODE) :]
        groups = [national[i : i + 3] for i in range(0, len(national), 3)]
        return "+256 " + " ".join(groups)
    return text


def excel_phone(value):
    shown = display_phone(value)
    if not shown:
        return ""
    return f'="{shown}"'
