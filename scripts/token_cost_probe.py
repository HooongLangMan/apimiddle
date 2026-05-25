import argparse
import json
import sys
import urllib.error
import urllib.request


SEED_PARAGRAPH = (
    "大型语言模型在真实业务中常见的使用场景包括问答、内容改写、结构化提取、长文总结、"
    "工作流自动化、代码辅助和多步骤推理。为了验证中转平台的倍率、日志记录和最终计费是否"
    "符合预期，需要构造一段足够长的输入，并要求模型输出结构化、连贯且相对较长的内容，"
    "以便在用户后台和官方后台都能观察到明显的 token 消耗变化。"
)


def request_json(url: str, api_key: str, payload: dict) -> dict:
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {exc.code}: {body}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Request failed: {exc}") from exc


def build_prompt(repeat_count: int, target_words: int) -> str:
    long_context = "\n\n".join(
        f"材料片段 {idx + 1}：{SEED_PARAGRAPH}" for idx in range(repeat_count)
    )
    task = (
        f"请基于以上材料，输出一篇结构化分析报告，要求尽量写到 {target_words} 字左右。"
        "内容必须包括：1. 背景概述；2. 典型应用场景；3. 实施难点；4. 风险与成本控制；"
        "5. 结论与建议。要求全文连续输出，不要过度简略。"
    )
    return f"{long_context}\n\n任务要求：{task}"


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate a higher-token test request.")
    parser.add_argument("--base-url", required=True, help="Example: https://api.token688.cn/v1")
    parser.add_argument("--api-key", required=True, help="User API key")
    parser.add_argument("--model", required=True, help="Model id to test")
    parser.add_argument(
        "--repeat-count",
        type=int,
        default=60,
        help="How many times to repeat the seed paragraph in the prompt.",
    )
    parser.add_argument(
        "--target-words",
        type=int,
        default=1800,
        help="Target output length in Chinese words.",
    )
    args = parser.parse_args()

    prompt = build_prompt(args.repeat_count, args.target_words)

    print("=== Request Summary ===")
    print(f"Base URL: {args.base_url}")
    print(f"Model: {args.model}")
    print(f"Repeat Count: {args.repeat_count}")
    print(f"Target Words: {args.target_words}")
    print(f"Prompt Length (chars): {len(prompt)}")

    response = request_json(
        f"{args.base_url.rstrip('/')}/chat/completions",
        args.api_key,
        {
            "model": args.model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            "stream": False,
        },
    )

    print("\n=== Usage ===")
    usage = response.get("usage", {})
    print(json.dumps(usage, ensure_ascii=False, indent=2))

    print("\n=== Response Preview ===")
    message = (
        response.get("choices", [{}])[0]
        .get("message", {})
        .get("content", "")
    )
    print(message[:1200])
    if len(message) > 1200:
      print("\n... [truncated]")

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
