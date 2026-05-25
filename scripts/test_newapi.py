import argparse
import json
import sys
import urllib.error
import urllib.request


def request_json(url: str, api_key: str, payload: dict | None = None) -> dict:
    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST" if payload is not None else "GET",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {exc.code}: {body}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Request failed: {exc}") from exc


def main() -> int:
    parser = argparse.ArgumentParser(description="Smoke test a New API endpoint.")
    parser.add_argument("--base-url", required=True, help="Example: https://api.token688.cn/v1")
    parser.add_argument("--api-key", required=True, help="User API key")
    parser.add_argument("--model", help="Model to test. Defaults to the first listed model.")
    parser.add_argument(
        "--message",
        default="只回答：测试成功",
        help="Prompt used for the chat completion smoke test.",
    )
    args = parser.parse_args()

    base_url = args.base_url.rstrip("/")

    print(f"[1/2] Fetching models from {base_url}/models ...")
    models_resp = request_json(f"{base_url}/models", args.api_key)
    models = models_resp.get("data", [])
    if not models:
        print(json.dumps(models_resp, ensure_ascii=False, indent=2))
        raise RuntimeError("No models returned for this API key.")

    model_ids = [item.get("id") for item in models if item.get("id")]
    print("Available models:")
    for model_id in model_ids:
        print(f"  - {model_id}")

    model = args.model or model_ids[0]
    print(f"\n[2/2] Testing chat completion with model: {model}")
    chat_resp = request_json(
        f"{base_url}/chat/completions",
        args.api_key,
        {
            "model": model,
            "messages": [
                {
                    "role": "user",
                    "content": args.message,
                }
            ],
            "stream": False,
        },
    )

    print("\nChat response:")
    print(json.dumps(chat_resp, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
