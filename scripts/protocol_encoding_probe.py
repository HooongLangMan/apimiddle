import json
import sys
import urllib.error
import urllib.request


BASE_URL = "https://api.token688.cn"
API_KEY = "sk-4pprxzZ4uRKmg5eXh0sxHlPrOtavpw6M7XxVdHtj1k9TqO77"
MODEL = "claude-opus-4-7"


def request_json(url: str, headers: dict[str, str], payload: dict) -> dict:
    req = urllib.request.Request(
        url,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {exc.code}: {body}") from exc


def probe_openai(prompt: str, label: str) -> None:
    print(f"\n=== OpenAI Compatible / {label} ===")
    response = request_json(
        f"{BASE_URL}/v1/chat/completions",
        {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json; charset=utf-8",
        },
        {
            "model": MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "stream": False,
        },
    )
    print(json.dumps(response, ensure_ascii=False, indent=2))


def probe_anthropic(prompt: str, label: str) -> None:
    print(f"\n=== Anthropic Messages / {label} ===")
    response = request_json(
        f"{BASE_URL}/v1/messages",
        {
            "x-api-key": API_KEY,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json; charset=utf-8",
        },
        {
            "model": MODEL,
            "max_tokens": 64,
            "messages": [{"role": "user", "content": prompt}],
        },
    )
    print(json.dumps(response, ensure_ascii=False, indent=2))


def main() -> int:
    english_prompt = "Reply with exactly: TEST_OK_EN"
    chinese_prompt = "只回答：测试成功"

    probe_openai(english_prompt, "English")
    probe_openai(chinese_prompt, "Chinese")
    probe_anthropic(english_prompt, "English")
    probe_anthropic(chinese_prompt, "Chinese")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
