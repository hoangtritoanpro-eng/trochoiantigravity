#!/usr/bin/env python3
"""
Local HTTP Server & Google NotebookLM Bridge cho "Đọc Hiểu Cùng AI (THPT)".
Đấu nối trực tiếp giao diện web với thư viện `gemini-notebook-mcp-cli` (notebooklm_tools)
để đẩy ngữ liệu, sơ đồ tư duy, kết quả đọc hiểu sang Google NotebookLM và yêu cầu tạo:
- Bài giảng (Study Guide / Report)
- Sơ đồ tư duy (Mind Map)
- Bản trình bày (Slide Deck)
- Thẻ ghi chú (Flashcards)
- Video bài giảng (Video Overview)
- Podcast thảo luận (Audio Overview)
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import traceback
import urllib.parse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

# Tự động nạp mã nguồn gemini-notebook-mcp-cli nếu chưa cài vào site-packages
HERE = Path(__file__).resolve().parent
REPO_CLI_SRC = HERE.parent / "gemini-notebook-mcp-cli" / "src"
if REPO_CLI_SRC.exists() and str(REPO_CLI_SRC) not in sys.path:
    sys.path.insert(0, str(REPO_CLI_SRC))

try:
    from notebooklm_tools.core.client import NotebookLMClient
    from notebooklm_tools.services import (
        notebooks as notebooks_service,
        sources as sources_service,
        studio as studio_service,
    )
    from notebooklm_tools.services.auth import AuthManager
    from notebooklm_tools.utils.config import get_config

    HAS_NLM = True
except Exception as import_err:
    HAS_NLM = False
    IMPORT_ERR_MSG = str(import_err)


def build_nlm_client(profile: str | None = None) -> NotebookLMClient:
    if not HAS_NLM:
        raise RuntimeError(f"Chưa cài đặt thư viện notebooklm_tools: {IMPORT_ERR_MSG}")
    if not profile:
        profile = get_config().auth.default_profile
    manager = AuthManager(profile)
    if not manager.profile_exists():
        raise RuntimeError(
            f"Chưa có hồ sơ đăng nhập Google NotebookLM ('{manager.profile_name}'). "
            "Hãy bấm nút '🔑 Đăng nhập Google NotebookLM' hoặc chạy lệnh 'nlm login'."
        )
    p = manager.load_profile()
    return NotebookLMClient(
        cookies=p.cookies,
        csrf_token=p.csrf_token or "",
        session_id=p.session_id or "",
        build_label=p.build_label or "",
        base_host=p.base_host or "",
        profile_name=profile,
        auth_revision=getattr(p, "revision", None),
        is_env_auth=False,
    )


class BridgeHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, directory=str(HERE), **kwargs)

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.end_headers()

    def send_json(self, payload: dict[str, Any], status: int = 200) -> None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def read_json(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0") or "0")
        if length <= 0:
            return {}
        raw = self.rfile.read(length).decode("utf-8")
        return json.loads(raw) if raw.strip() else {}

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/notebooklm/status":
            return self.handle_status()
        if parsed.path == "/api/notebooklm/studio-status":
            qs = urllib.parse.parse_qs(parsed.query)
            nb_id = (qs.get("notebook_id") or [""])[0].strip()
            return self.handle_studio_status(nb_id)
        return super().do_GET()

    def do_POST(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/notebooklm/login":
            return self.handle_login()
        if parsed.path == "/api/notebooklm/push":
            return self.handle_push()
        self.send_json({"ok": False, "error": f"Không tìm thấy đường dẫn {parsed.path}"}, 404)

    def handle_status(self) -> None:
        if not HAS_NLM:
            return self.send_json(
                {
                    "ok": True,
                    "bridge": True,
                    "authenticated": False,
                    "error": f"Thiếu thư viện notebooklm_tools: {IMPORT_ERR_MSG}",
                }
            )
        try:
            client = build_nlm_client()
            res = notebooks_service.list_notebooks(client, max_results=25)
            return self.send_json(
                {
                    "ok": True,
                    "bridge": True,
                    "authenticated": True,
                    "notebooks": res.get("notebooks", []),
                    "count": res.get("count", 0),
                }
            )
        except Exception as e:
            return self.send_json(
                {
                    "ok": True,
                    "bridge": True,
                    "authenticated": False,
                    "error": str(e),
                }
            )

    def handle_login(self) -> None:
        try:
            cmd = [sys.executable, "-m", "notebooklm_tools.cli.main", "login"]
            subprocess.Popen(cmd, cwd=str(HERE))
            return self.send_json(
                {
                    "ok": True,
                    "message": "Đã mở trình duyệt để đăng nhập Google NotebookLM. Sau khi đăng nhập xong trên trình duyệt, hãy bấm '🔄 Kiểm tra kết nối'.",
                }
            )
        except Exception as e:
            return self.send_json({"ok": False, "error": f"Không khởi chạy được nlm login: {e}"}, 500)

    def handle_studio_status(self, notebook_id: str) -> None:
        if not notebook_id:
            return self.send_json({"ok": False, "error": "Thiếu notebook_id"}, 400)
        try:
            client = build_nlm_client()
            st = studio_service.get_studio_status(client, notebook_id)
            return self.send_json({"ok": True, "notebook_id": notebook_id, **st})
        except Exception as e:
            return self.send_json({"ok": False, "error": str(e)}, 500)

    def handle_push(self) -> None:
        try:
            body = self.read_json()
            client = build_nlm_client()

            notebook_id = str(body.get("notebook_id") or "").strip()
            title = str(body.get("title") or "Đọc hiểu Ngữ văn THPT").strip()
            sources = body.get("sources") or []
            artifacts = body.get("artifacts") or []
            focus_prompt = str(body.get("focus_prompt") or "").strip()

            # 1. Tạo Notebook mới nếu chưa chọn notebook_id
            if not notebook_id:
                nb_res = notebooks_service.create_notebook(client, title=title)
                notebook_id = nb_res["notebook_id"]
                notebook_url = nb_res["url"]
            else:
                notebook_url = notebooks_service.notebook_url(client, notebook_id)

            # 2. Đẩy các nguồn dữ liệu văn bản + phân tích + sơ đồ tư duy + thống kê vào NotebookLM
            source_ids: list[str] = []
            for src in sources:
                s_title = str(src.get("title") or "Ngữ liệu đọc hiểu").strip()
                s_text = str(src.get("text") or "").strip()
                if not s_text:
                    continue
                added = sources_service.add_source(
                    client,
                    notebook_id,
                    "text",
                    text=s_text,
                    title=s_title,
                    wait=True,
                    wait_timeout=90.0,
                )
                if added and added.get("source_id"):
                    source_ids.append(added["source_id"])

            # 3. Yêu cầu NotebookLM Studio tạo các học liệu đã chọn (tiếng Việt)
            created_artifacts: list[dict[str, Any]] = []
            artifact_errors: list[dict[str, str]] = []

            for art_type in artifacts:
                try:
                    if art_type == "report":
                        res = studio_service.create_artifact(
                            client,
                            notebook_id,
                            "report",
                            source_ids=source_ids or None,
                            report_format="Study Guide",
                            language="vi",
                            custom_prompt=focus_prompt,
                        )
                    elif art_type == "mind_map":
                        res = studio_service.create_artifact(
                            client,
                            notebook_id,
                            "mind_map",
                            source_ids=source_ids or None,
                            title=f"Sơ đồ tư duy: {title}",
                        )
                    elif art_type == "slide_deck":
                        res = studio_service.create_artifact(
                            client,
                            notebook_id,
                            "slide_deck",
                            source_ids=source_ids or None,
                            slide_format="detailed_deck",
                            language="vi",
                            focus_prompt=focus_prompt
                            or "Thiết kế bản trình bày bài giảng Ngữ văn THPT rõ ràng, giàu tính sư phạm.",
                        )
                    elif art_type == "flashcards":
                        res = studio_service.create_artifact(
                            client,
                            notebook_id,
                            "flashcards",
                            source_ids=source_ids or None,
                            difficulty="medium",
                            focus_prompt=focus_prompt
                            or "Tạo thẻ ghi chú tiếng Việt ôn tập kiến thức trọng tâm, biện pháp nghệ thuật và thông điệp của văn bản.",
                        )
                    elif art_type == "video":
                        res = studio_service.create_artifact(
                            client,
                            notebook_id,
                            "video",
                            source_ids=source_ids or None,
                            video_format="explainer",
                            language="vi",
                            focus_prompt=focus_prompt
                            or "Tạo video bài giảng giải thích sâu sắc giá trị nội dung và nghệ thuật của tác phẩm.",
                        )
                    elif art_type == "audio":
                        res = studio_service.create_artifact(
                            client,
                            notebook_id,
                            "audio",
                            source_ids=source_ids or None,
                            audio_format="deep_dive",
                            language="vi",
                            focus_prompt=focus_prompt
                            or "Cuộc trò chuyện podcast chuyên sâu, sinh động bằng tiếng Việt phân tích tác phẩm và giải đáp các câu hỏi đọc hiểu.",
                        )
                    else:
                        continue
                    created_artifacts.append(dict(res))
                except Exception as art_err:
                    artifact_errors.append({"type": str(art_type), "error": str(art_err)})

            return self.send_json(
                {
                    "ok": True,
                    "notebook_id": notebook_id,
                    "notebook_url": notebook_url,
                    "title": title,
                    "sources_added": len(source_ids),
                    "created_artifacts": created_artifacts,
                    "errors": artifact_errors,
                }
            )
        except Exception as e:
            traceback.print_exc()
            return self.send_json({"ok": False, "error": str(e)}, 500)


def main() -> None:
    port = int(os.environ.get("PORT", "8899"))
    server = ThreadingHTTPServer(("127.0.0.1", port), BridgeHandler)
    print(f"================================================================")
    print(f"  ĐỌC HIỂU CÙNG AI (THPT) + GOOGLE NOTEBOOKLM BRIDGE")
    print(f"  Địa chỉ: http://localhost:{port}")
    print(f"  Trạng thái thư viện NotebookLM CLI: {'SẴN SÀNG' if HAS_NLM else 'CHƯA CÀI'}")
    print(f"================================================================")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nĐã dừng máy chủ.")


if __name__ == "__main__":
    main()
