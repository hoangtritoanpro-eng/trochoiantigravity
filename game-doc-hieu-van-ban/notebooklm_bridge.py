#!/usr/bin/env python3
"""
Local HTTP Server & Google NotebookLM Bridge cho "Đọc Hiểu Cùng AI (THPT)".
Đấu nối trực tiếp giao diện web với thư viện `gemini-notebook-mcp-cli` (notebooklm_tools)
để:
1. Tự động tạo Notebook & chuyển dữ liệu ngữ liệu + sơ đồ tư duy + thống kê đọc hiểu qua Google NotebookLM.
2. Yêu cầu Google NotebookLM thực hiện đầy đủ 9 tính năng Studio:
   - Tổng quan bằng âm thanh (`audio`)
   - Bản trình bày (`slide_deck`)
   - Tổng quan bằng video (`video`)
   - Bản đồ tư duy (`mind_map`)
   - Báo cáo (`report`)
   - Thẻ ghi nhớ (`flashcards`)
   - Bài kiểm tra (`quiz`)
   - Bản đồ hoạ thông tin (`infographic`)
   - Bảng dữ liệu (`data_table`)
3. Tự động tải và trả kết quả thực tế từ Google NotebookLM về hiển thị trực tiếp ngay trên App.
"""

from __future__ import annotations

import asyncio
import csv
import json
import os
import subprocess
import sys
import tempfile
import threading
import time
import traceback
import urllib.parse
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

# Tự động nạp mã nguồn gemini-notebook-mcp-cli nếu chưa cài vào site-packages
HERE = Path(__file__).resolve().parent
NLM_OUTPUT_DIR = HERE / "nlm_outputs"
NLM_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

REPO_CLI_SRC = HERE.parent / "gemini-notebook-mcp-cli" / "src"
if REPO_CLI_SRC.exists():
    if str(REPO_CLI_SRC) not in sys.path:
        sys.path.insert(0, str(REPO_CLI_SRC))
    cur_pp = os.environ.get("PYTHONPATH", "")
    if str(REPO_CLI_SRC) not in cur_pp:
        os.environ["PYTHONPATH"] = (
            f"{REPO_CLI_SRC}{os.pathsep}{cur_pp}" if cur_pp else str(REPO_CLI_SRC)
        )

# Đảm bảo lưu hồ sơ đăng nhập ở chế độ file và có thư mục lưu hợp lệ trên Windows
os.environ.setdefault("NLM_AUTH_STORAGE", "file")
if not os.environ.get("NOTEBOOKLM_MCP_CLI_PATH"):
    default_home_storage = Path.home() / ".notebooklm-mcp-cli"
    try:
        (default_home_storage / "profiles").mkdir(parents=True, exist_ok=True)
    except Exception:
        local_storage = HERE / ".nlm_storage"
        local_storage.mkdir(parents=True, exist_ok=True)
        os.environ["NOTEBOOKLM_MCP_CLI_PATH"] = str(local_storage)

try:
    from notebooklm_tools.core.client import NotebookLMClient
    from notebooklm_tools.services import (
        downloads as downloads_service,
        notebooks as notebooks_service,
        notes as notes_service,
        sources as sources_service,
        studio as studio_service,
    )
    from notebooklm_tools.services.auth import AuthManager
    from notebooklm_tools.utils.config import get_config

    HAS_NLM = True
except Exception as import_err:
    HAS_NLM = False
    IMPORT_ERR_MSG = str(import_err)

# Trạng thái tự động đăng nhập & tự động đẩy dữ liệu
LOGIN_STATE: dict[str, Any] = {
    "in_progress": False,
    "error": "",
    "last_auto_push": None,
}


def build_nlm_client(profile: str | None = None) -> NotebookLMClient:
    if not HAS_NLM:
        raise RuntimeError(f"Chưa cài đặt thư viện notebooklm_tools: {IMPORT_ERR_MSG}")
    if not profile:
        profile = get_config().auth.default_profile
    manager = AuthManager(profile)
    if not manager.profile_exists():
        raise RuntimeError(
            f"Chưa có hồ sơ đăng nhập Google NotebookLM ('{manager.profile_name}'). "
            "Hãy bấm nút '🔑 Đăng nhập NotebookLM' để xác thực tài khoản Google."
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


def create_one_artifact(
    client: NotebookLMClient,
    notebook_id: str,
    art_type: str,
    title: str,
    source_ids: list[str] | None = None,
    focus_prompt: str = "",
) -> dict[str, Any]:
    """Gọi studio_service.create_artifact cho từng loại trong 9 tính năng."""
    if art_type == "audio":
        res = studio_service.create_artifact(
            client,
            notebook_id,
            "audio",
            source_ids=source_ids or None,
            audio_format="deep_dive",
            language="vi",
            focus_prompt=focus_prompt
            or "Tổng quan bằng âm thanh (Podcast đối thoại chuyên sâu) bằng tiếng Việt phân tích tác phẩm và giải đáp các câu hỏi đọc hiểu.",
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
    elif art_type == "video":
        res = studio_service.create_artifact(
            client,
            notebook_id,
            "video",
            source_ids=source_ids or None,
            video_format="explainer",
            language="vi",
            focus_prompt=focus_prompt
            or "Tạo tổng quan bằng video giải thích sâu sắc giá trị nội dung và nghệ thuật của tác phẩm.",
        )
    elif art_type == "mind_map":
        res = studio_service.create_artifact(
            client,
            notebook_id,
            "mind_map",
            source_ids=source_ids or None,
            title=f"Bản đồ tư duy: {title}",
        )
    elif art_type == "report":
        res = studio_service.create_artifact(
            client,
            notebook_id,
            "report",
            source_ids=source_ids or None,
            report_format="Study Guide",
            language="vi",
            custom_prompt=focus_prompt,
        )
    elif art_type == "flashcards":
        res = studio_service.create_artifact(
            client,
            notebook_id,
            "flashcards",
            source_ids=source_ids or None,
            difficulty="medium",
            focus_prompt=focus_prompt
            or "Tạo thẻ ghi nhớ tiếng Việt ôn tập kiến thức trọng tâm, biện pháp nghệ thuật và thông điệp của văn bản.",
        )
    elif art_type == "quiz":
        res = studio_service.create_artifact(
            client,
            notebook_id,
            "quiz",
            source_ids=source_ids or None,
            question_count=10,
            difficulty="medium",
            focus_prompt=focus_prompt
            or "Tạo bài kiểm tra đọc hiểu tiếng Việt chuẩn THPT (Nhận biết, Thông hiểu, Vận dụng) bám sát văn bản.",
        )
    elif art_type == "infographic":
        res = studio_service.create_artifact(
            client,
            notebook_id,
            "infographic",
            source_ids=source_ids or None,
            orientation="landscape",
            detail_level="standard",
            language="vi",
            focus_prompt=focus_prompt
            or "Tạo bản đồ hoạ thông tin (Infographic) tổng hợp trực quan bố cục, hình tượng, nghệ thuật và thông điệp của tác phẩm.",
        )
    elif art_type == "data_table":
        res = studio_service.create_artifact(
            client,
            notebook_id,
            "data_table",
            source_ids=source_ids or None,
            description=focus_prompt
            or "Bảng dữ liệu tổng hợp hệ thống hình tượng, biện pháp nghệ thuật, dẫn chứng, tác dụng và kết quả đọc hiểu theo mức độ nhận thức.",
            language="vi",
        )
    else:
        raise ValueError(f"Loại học liệu không hợp lệ: {art_type}")
    out = dict(res)
    out["artifact_type"] = art_type
    return out


def execute_push_payload(client: NotebookLMClient, body: dict[str, Any]) -> dict[str, Any]:
    """Đẩy dữ liệu nguồn + Ghi chú học liệu Studio lên Google NotebookLM và tự động khởi tạo các tính năng Studio trên NotebookLM."""
    notebook_id = str(body.get("notebook_id") or "").strip()
    title = str(body.get("title") or "Đọc hiểu Ngữ văn THPT").strip()
    sources = body.get("sources") or []
    studio_notes = body.get("studio_notes") or []
    artifacts = body.get("artifacts") or [
        "audio",
        "slide_deck",
        "video",
        "mind_map",
        "report",
        "flashcards",
        "quiz",
        "infographic",
        "data_table",
    ]
    focus_prompt = str(body.get("focus_prompt") or "").strip()
    sources_already_uploaded = bool(body.get("sources_already_uploaded"))
    open_in_browser = bool(body.get("open_in_browser", True))

    notebook_id, notebook_url, source_ids = ensure_notebook_and_sources(
        client,
        notebook_id,
        title,
        sources,
        skip_sources_if_exists=sources_already_uploaded,
    )

    # 1. Tạo ngay các Ghi chú Học liệu Studio (Notes) cho từng tính năng đã chọn bên trong cột Studio của Google NotebookLM
    created_notes: list[dict[str, Any]] = []
    if not sources_already_uploaded and studio_notes:
        for note in studio_notes:
            n_title = str(note.get("title") or "").strip()
            n_content = str(note.get("content") or "").strip()
            if not n_title or not n_content:
                continue
            try:
                nr = notes_service.create_note(client, notebook_id, n_content, title=n_title)
                created_notes.append(dict(nr))
            except Exception:
                pass

    # 2. Khởi tạo các tính năng Studio gốc của Google NotebookLM (ưu tiên các mục hoàn thành nhanh trước)
    priority_order = [
        "mind_map",
        "report",
        "quiz",
        "flashcards",
        "data_table",
        "slide_deck",
        "infographic",
        "audio",
        "video",
    ]
    ordered_artifacts = sorted(
        artifacts,
        key=lambda x: priority_order.index(x) if x in priority_order else 99,
    )

    created_artifacts: list[dict[str, Any]] = []
    artifact_errors: list[dict[str, str]] = []

    for idx, art_type in enumerate(ordered_artifacts):
        if idx > 0:
            time.sleep(0.4)
        try:
            res = create_one_artifact(
                client,
                notebook_id,
                str(art_type),
                title,
                source_ids=source_ids or None,
                focus_prompt=focus_prompt,
            )
            created_artifacts.append(res)
        except Exception as art_err:
            artifact_errors.append({"type": str(art_type), "error": str(art_err)})

    if open_in_browser and notebook_url:
        try:
            webbrowser.open(notebook_url)
        except Exception:
            pass

    return {
        "ok": True,
        "notebook_id": notebook_id,
        "notebook_url": notebook_url,
        "title": title,
        "sources_added": len(source_ids),
        "notes_added": len(created_notes),
        "created_artifacts": created_artifacts,
        "errors": artifact_errors,
    }


def ensure_notebook_and_sources(
    client: NotebookLMClient,
    notebook_id: str,
    title: str,
    sources: list[dict[str, Any]],
    skip_sources_if_exists: bool = False,
) -> tuple[str, str, list[str]]:
    """Đảm bảo có notebook_id và đã nạp nguồn dữ liệu."""
    created_new = False
    if not notebook_id:
        nb_res = notebooks_service.create_notebook(client, title=title)
        notebook_id = nb_res["notebook_id"]
        notebook_url = nb_res["url"]
        created_new = True
    else:
        notebook_url = notebooks_service.notebook_url(client, notebook_id)

    source_ids: list[str] = []
    if created_new or not skip_sources_if_exists:
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

    return notebook_id, notebook_url, source_ids


def fetch_and_extract_artifact(
    client: NotebookLMClient,
    notebook_id: str,
    artifact_type: str,
    artifact_id: str | None = None,
) -> dict[str, Any]:
    """Kiểm tra trạng thái học liệu trên Google NotebookLM; nếu đã hoàn tất thì tải về và trích xuất dữ liệu để hiển thị ngay trên App."""
    nb_dir = NLM_OUTPUT_DIR / notebook_id
    nb_dir.mkdir(parents=True, exist_ok=True)
    safe_id = (artifact_id or "latest")[:36]

    # 1. Mind Map có thể lấy trực tiếp từ list_mind_maps hoặc download_mind_map
    if artifact_type == "mind_map":
        out_file = nb_dir / f"mind_map_{safe_id}.json"
        try:
            saved = downloads_service.download_sync(
                client, notebook_id, "mind_map", str(out_file), artifact_id=artifact_id or None
            )
            raw_json = Path(saved).read_text(encoding="utf-8")
            tree = json.loads(raw_json)
            return {
                "ok": True,
                "status": "completed",
                "artifact_type": "mind_map",
                "file_url": f"/nlm_outputs/{notebook_id}/{Path(saved).name}",
                "result_data": {"kind": "mind_map", "tree": tree},
            }
        except Exception as e:
            return {"ok": True, "status": "in_progress", "message": str(e)}

    # 2. Kiểm tra trạng thái qua get_studio_status
    st = studio_service.get_studio_status(client, notebook_id)
    artifacts = st.get("artifacts", [])
    target = None
    if artifact_id:
        target = next((a for a in artifacts if a.get("artifact_id") == artifact_id), None)
    if not target:
        # Tìm học liệu mới nhất cùng loại
        same_type = [a for a in artifacts if a.get("type") == artifact_type]
        if same_type:
            target = same_type[0]

    if not target:
        return {"ok": True, "status": "in_progress", "message": "Đang khởi tạo trên NotebookLM..."}

    status_str = target.get("status") or "in_progress"
    actual_id = target.get("artifact_id") or artifact_id
    safe_id = (actual_id or "latest")[:36]

    if status_str == "failed":
        return {
            "ok": False,
            "status": "failed",
            "error": target.get("error_reason") or "Google NotebookLM không tạo được mục này.",
        }

    # Audio đôi khi ở status in_progress nhưng đã có audio_url, hoặc completed
    if status_str != "completed" and not (artifact_type == "audio" and target.get("audio_url")):
        return {
            "ok": True,
            "status": "in_progress",
            "artifact_id": actual_id,
            "title": target.get("title") or "",
        }

    # 3. Đã hoàn thành -> tải và trích xuất dữ liệu để hiển thị lên App
    if artifact_type == "report":
        content_md = target.get("report_content") or ""
        out_file = nb_dir / f"report_{safe_id}.md"
        if not content_md:
            saved = downloads_service.download_sync(
                client, notebook_id, "report", str(out_file), artifact_id=actual_id
            )
            content_md = Path(saved).read_text(encoding="utf-8")
        else:
            out_file.write_text(content_md, encoding="utf-8")
        return {
            "ok": True,
            "status": "completed",
            "artifact_type": "report",
            "artifact_id": actual_id,
            "file_url": f"/nlm_outputs/{notebook_id}/{out_file.name}",
            "result_data": {
                "kind": "report",
                "title": target.get("title") or "Báo cáo từ Google NotebookLM",
                "markdown": content_md,
            },
        }

    if artifact_type in ("quiz", "flashcards"):
        app_data = client.get_interactive_app_data(notebook_id, actual_id) if actual_id else None
        out_file = nb_dir / f"{artifact_type}_{safe_id}.json"
        if app_data:
            out_file.write_text(json.dumps(app_data, ensure_ascii=False, indent=2), encoding="utf-8")
        else:
            saved = asyncio.run(
                downloads_service.download_async(
                    client,
                    notebook_id,
                    artifact_type,
                    str(out_file),
                    artifact_id=actual_id,
                    output_format="json",
                )
            )["path"]
            app_data = json.loads(Path(saved).read_text(encoding="utf-8"))
        return {
            "ok": True,
            "status": "completed",
            "artifact_type": artifact_type,
            "artifact_id": actual_id,
            "file_url": f"/nlm_outputs/{notebook_id}/{out_file.name}",
            "result_data": {
                "kind": artifact_type,
                "title": target.get("title") or "",
                "app_data": app_data,
            },
        }

    if artifact_type == "data_table":
        out_file = nb_dir / f"data_table_{safe_id}.csv"
        saved = downloads_service.download_sync(
            client, notebook_id, "data_table", str(out_file), artifact_id=actual_id
        )
        rows: list[list[str]] = []
        with open(saved, "r", encoding="utf-8-sig", newline="") as f:
            reader = csv.reader(f)
            for row in reader:
                rows.append(row)
        return {
            "ok": True,
            "status": "completed",
            "artifact_type": "data_table",
            "artifact_id": actual_id,
            "file_url": f"/nlm_outputs/{notebook_id}/{Path(saved).name}",
            "result_data": {
                "kind": "data_table",
                "title": target.get("title") or "Bảng dữ liệu từ Google NotebookLM",
                "rows": rows,
            },
        }

    if artifact_type in ("audio", "video", "slide_deck", "infographic"):
        ext_map = {
            "audio": "m4a",
            "video": "mp4",
            "slide_deck": "pdf",
            "infographic": "png",
        }
        ext = ext_map[artifact_type]
        out_file = nb_dir / f"{artifact_type}_{safe_id}.{ext}"
        if not out_file.exists() or out_file.stat().st_size == 0:
            dl_res = asyncio.run(
                downloads_service.download_async(
                    client,
                    notebook_id,
                    artifact_type,
                    str(out_file),
                    artifact_id=actual_id,
                    slide_deck_format="pdf",
                )
            )
            saved_path = Path(dl_res["path"])
        else:
            saved_path = out_file

        file_url = f"/nlm_outputs/{notebook_id}/{saved_path.name}"
        return {
            "ok": True,
            "status": "completed",
            "artifact_type": artifact_type,
            "artifact_id": actual_id,
            "file_url": file_url,
            "result_data": {
                "kind": artifact_type,
                "title": target.get("title") or "",
                "file_url": file_url,
            },
        }

    return {"ok": True, "status": status_str, "artifact_id": actual_id}


class BridgeHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, directory=str(HERE), **kwargs)

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Private-Network", "true")
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
        if parsed.path == "/api/notebooklm/fetch-artifact":
            qs = urllib.parse.parse_qs(parsed.query)
            nb_id = (qs.get("notebook_id") or [""])[0].strip()
            art_type = (qs.get("artifact_type") or [""])[0].strip()
            art_id = (qs.get("artifact_id") or [""])[0].strip() or None
            return self.handle_fetch_artifact(nb_id, art_type, art_id)
        return super().do_GET()

    def do_POST(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/notebooklm/login":
            return self.handle_login()
        if parsed.path == "/api/notebooklm/auth-cookie":
            return self.handle_auth_cookie()
        if parsed.path == "/api/notebooklm/push":
            return self.handle_push()
        if parsed.path == "/api/notebooklm/execute-one":
            return self.handle_execute_one()
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
            auto_push = LOGIN_STATE.get("last_auto_push")
            LOGIN_STATE["last_auto_push"] = None
            return self.send_json(
                {
                    "ok": True,
                    "bridge": True,
                    "authenticated": True,
                    "notebooks": res.get("notebooks", []),
                    "count": res.get("count", 0),
                    "login_in_progress": LOGIN_STATE["in_progress"],
                    "last_auto_push": auto_push,
                }
            )
        except Exception as e:
            return self.send_json(
                {
                    "ok": True,
                    "bridge": True,
                    "authenticated": False,
                    "login_in_progress": LOGIN_STATE["in_progress"],
                    "login_error": LOGIN_STATE["error"],
                    "error": str(e),
                }
            )

    def handle_login(self) -> None:
        body = self.read_json()
        auto_push_payload = body.get("auto_push_payload")

        # Nếu đã đăng nhập sẵn và có auto_push_payload -> Đẩy dữ liệu qua NotebookLM ngay lập tức!
        try:
            client = build_nlm_client()
            notebooks_service.list_notebooks(client, max_results=5)
            if auto_push_payload:
                push_res = execute_push_payload(client, auto_push_payload)
                return self.send_json(
                    {
                        "ok": True,
                        "already_authenticated": True,
                        "auto_pushed": True,
                        "push_result": push_res,
                        "message": "Đã kết nối & tự động đẩy dữ liệu qua Google NotebookLM để tạo các tính năng Studio!",
                    }
                )
        except Exception:
            pass

        def _bg_login_worker(payload: dict[str, Any] | None) -> None:
            LOGIN_STATE["in_progress"] = True
            LOGIN_STATE["error"] = ""
            try:
                from notebooklm_tools.utils.cdp import extract_cookies_via_cdp, terminate_chrome

                profile_name = get_config().auth.default_profile or "default"
                auth = AuthManager(profile_name)
                try:
                    result = extract_cookies_via_cdp(
                        auto_launch=True,
                        wait_for_login=True,
                        login_timeout=300,
                        profile_name=profile_name,
                        clear_profile=False,
                    )
                    auth.save_profile(
                        cookies=result["cookies"],
                        csrf_token=result.get("csrf_token", ""),
                        session_id=result.get("session_id", ""),
                        email=result.get("email", ""),
                        force=True,
                        build_label=result.get("build_label", ""),
                        base_host=result.get("base_host", ""),
                    )
                finally:
                    try:
                        terminate_chrome()
                    except Exception:
                        pass

                # Ngay khi đăng nhập xong -> Tự động đẩy dữ liệu qua Google NotebookLM và tạo các tính năng Studio!
                if payload:
                    client = build_nlm_client(profile_name)
                    LOGIN_STATE["last_auto_push"] = execute_push_payload(client, payload)
            except Exception as err:
                LOGIN_STATE["error"] = str(err)
                # Fallback chạy CLI login nếu CDP trực tiếp gặp lỗi
                try:
                    cmd = [
                        sys.executable,
                        "-m",
                        "notebooklm_tools.cli.main",
                        "login",
                        "--storage",
                        "file",
                        "--force",
                    ]
                    subprocess.Popen(cmd, cwd=str(HERE), env=os.environ.copy())
                except Exception:
                    pass
            finally:
                LOGIN_STATE["in_progress"] = False

        if not LOGIN_STATE["in_progress"]:
            threading.Thread(
                target=_bg_login_worker, args=(auto_push_payload,), daemon=True
            ).start()

        return self.send_json(
            {
                "ok": True,
                "message": "Đã mở trình duyệt đăng nhập Google NotebookLM. Ngay khi bạn đăng nhập xong, hệ thống sẽ TỰ ĐỘNG đẩy dữ liệu qua NotebookLM và tạo các tính năng Studio!",
            }
        )

    def handle_auth_cookie(self) -> None:
        """Cho phép dán trực tiếp Cookie hoặc lệnh cURL từ trang Google NotebookLM để kết nối & đẩy tự động."""
        try:
            body = self.read_json()
            cookie_text = str(body.get("cookie_text") or "").strip()
            auto_push_payload = body.get("auto_push_payload")
            if not cookie_text:
                return self.send_json({"ok": False, "error": "Chưa có dữ liệu Cookie / cURL."}, 400)

            profile_name = get_config().auth.default_profile or "default"
            auth = AuthManager(profile_name)
            with tempfile.NamedTemporaryFile(
                "w", encoding="utf-8", suffix=".txt", delete=False
            ) as tmp:
                tmp.write(cookie_text)
                tmp_path = tmp.name
            try:
                auth.login_with_file(tmp_path)
            finally:
                try:
                    os.remove(tmp_path)
                except Exception:
                    pass

            client = build_nlm_client(profile_name)
            push_res = None
            if auto_push_payload:
                push_res = execute_push_payload(client, auto_push_payload)

            return self.send_json(
                {
                    "ok": True,
                    "authenticated": True,
                    "push_result": push_res,
                    "message": "Đã kết nối Google NotebookLM thành công và tự động đẩy dữ liệu qua tạo các tính năng Studio!",
                }
            )
        except Exception as e:
            traceback.print_exc()
            return self.send_json({"ok": False, "error": f"Không xác thực được Cookie: {e}"}, 500)

    def handle_studio_status(self, notebook_id: str) -> None:
        if not notebook_id:
            return self.send_json({"ok": False, "error": "Thiếu notebook_id"}, 400)
        try:
            client = build_nlm_client()
            st = studio_service.get_studio_status(client, notebook_id)
            return self.send_json({"ok": True, "notebook_id": notebook_id, **st})
        except Exception as e:
            return self.send_json({"ok": False, "error": str(e)}, 500)

    def handle_fetch_artifact(
        self, notebook_id: str, artifact_type: str, artifact_id: str | None
    ) -> None:
        if not notebook_id or not artifact_type:
            return self.send_json({"ok": False, "error": "Thiếu notebook_id hoặc artifact_type"}, 400)
        try:
            client = build_nlm_client()
            res = fetch_and_extract_artifact(client, notebook_id, artifact_type, artifact_id)
            return self.send_json(res)
        except Exception as e:
            traceback.print_exc()
            return self.send_json({"ok": False, "status": "error", "error": str(e)}, 500)

    def handle_execute_one(self) -> None:
        """Tự động nạp nguồn (nếu chưa nạp) + lưu Note học liệu + khởi tạo 1 tính năng trên NotebookLM + trả kết quả."""
        try:
            body = self.read_json()
            client = build_nlm_client()

            notebook_id = str(body.get("notebook_id") or "").strip()
            title = str(body.get("title") or "Đọc hiểu Ngữ văn THPT").strip()
            sources = body.get("sources") or []
            artifact_type = str(body.get("artifact_type") or "").strip()
            focus_prompt = str(body.get("focus_prompt") or "").strip()
            sources_already_uploaded = bool(body.get("sources_already_uploaded"))
            studio_note = body.get("studio_note")

            notebook_id, notebook_url, source_ids = ensure_notebook_and_sources(
                client,
                notebook_id,
                title,
                sources,
                skip_sources_if_exists=sources_already_uploaded,
            )

            if isinstance(studio_note, dict):
                n_title = str(studio_note.get("title") or "").strip()
                n_content = str(studio_note.get("content") or "").strip()
                if n_title and n_content:
                    try:
                        notes_service.create_note(client, notebook_id, n_content, title=n_title)
                    except Exception:
                        pass

            created = create_one_artifact(
                client,
                notebook_id,
                artifact_type,
                title,
                source_ids=source_ids or None,
                focus_prompt=focus_prompt,
            )

            # Nếu là mind_map thì create_one_artifact đã trả về mind_map_json ngay lập tức!
            if artifact_type == "mind_map" and created.get("mind_map_json"):
                try:
                    tree = json.loads(created["mind_map_json"])
                except Exception:
                    tree = {}
                return self.send_json(
                    {
                        "ok": True,
                        "notebook_id": notebook_id,
                        "notebook_url": notebook_url,
                        "artifact_type": "mind_map",
                        "artifact_id": created.get("artifact_id"),
                        "status": "completed",
                        "result_data": {"kind": "mind_map", "tree": tree},
                    }
                )

            return self.send_json(
                {
                    "ok": True,
                    "notebook_id": notebook_id,
                    "notebook_url": notebook_url,
                    "artifact_type": artifact_type,
                    "artifact_id": created.get("artifact_id"),
                    "status": created.get("status", "in_progress"),
                }
            )
        except Exception as e:
            traceback.print_exc()
            return self.send_json({"ok": False, "error": str(e)}, 500)

    def handle_push(self) -> None:
        try:
            body = self.read_json()
            client = build_nlm_client()
            res = execute_push_payload(client, body)
            return self.send_json(res)
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
