import sys
import os
import subprocess
import threading
import requests
from PyQt6.QtWidgets import (QApplication, QMainWindow, QVBoxLayout, QWidget,
                             QLabel, QProgressBar, QStackedWidget, QSizePolicy)
from PyQt6.QtGui import QPixmap, QColor, QFont, QPalette
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtWebEngineCore import QWebEngineSettings
from PyQt6.QtCore import QUrl, Qt, QTimer


def resource_path(relative_path):
    """Get absolute path to resource, works for dev and for PyInstaller."""
    try:
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.dirname(os.path.abspath(__file__))
    return os.path.abspath(os.path.join(base_path, relative_path))


class ScanTrackApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("ScanTrack — QR Inventory Management")
        self.setMinimumSize(1280, 800)

        # ── Critical: set palette BEFORE showing window to prevent white flash ──
        palette = QPalette()
        palette.setColor(QPalette.ColorRole.Window, QColor("#f1f5f9"))
        palette.setColor(QPalette.ColorRole.Base, QColor("#f1f5f9"))
        self.setPalette(palette)
        self.setStyleSheet("QMainWindow { background-color: #f1f5f9; }")

        # ── Stacked widget: splash (0) → app (1) ──
        self.stack = QStackedWidget()
        self.stack.setStyleSheet("background-color: #f1f5f9;")
        self.setCentralWidget(self.stack)

        # ─── PAGE 0: SPLASH SCREEN ────────────────────────────────────────────
        splash = QWidget()
        splash.setStyleSheet("background-color: #f1f5f9;")
        splash_layout = QVBoxLayout(splash)
        splash_layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        splash_layout.setSpacing(20)

        # Logo
        self.logo_label = QLabel()
        logo_path = resource_path("logo.png")
        pixmap = QPixmap(logo_path)
        if not pixmap.isNull():
            self.logo_label.setPixmap(
                pixmap.scaled(160, 160,
                              Qt.AspectRatioMode.KeepAspectRatio,
                              Qt.TransformationMode.SmoothTransformation)
            )
        self.logo_label.setStyleSheet(
            "border: 2px solid #f97316; border-radius: 20px; "
            "padding: 20px; background: #ffffff;"
        )
        self.logo_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        splash_layout.addWidget(self.logo_label, alignment=Qt.AlignmentFlag.AlignCenter)

        # App name
        app_name = QLabel("ScanTrack")
        app_name.setStyleSheet(
            "color: #1e293b; font-size: 28px; font-weight: 900; "
            "font-family: 'Segoe UI', Arial, sans-serif; margin-top: 4px;"
        )
        splash_layout.addWidget(app_name, alignment=Qt.AlignmentFlag.AlignCenter)

        # Subtitle
        subtitle = QLabel("QR Inventory Management System")
        subtitle.setStyleSheet(
            "color: #64748b; font-size: 13px; "
            "font-family: 'Segoe UI', Arial, sans-serif;"
        )
        splash_layout.addWidget(subtitle, alignment=Qt.AlignmentFlag.AlignCenter)

        # Status label
        self.loader_label = QLabel("Starting ScanTrack...")
        self.loader_label.setStyleSheet(
            "color: #f97316; font-size: 12px; font-weight: 600; "
            "font-family: 'Segoe UI', Arial, sans-serif; margin-top: 16px;"
        )
        splash_layout.addWidget(self.loader_label, alignment=Qt.AlignmentFlag.AlignCenter)

        # Progress bar (indeterminate)
        self.progress = QProgressBar()
        self.progress.setFixedWidth(360)
        self.progress.setFixedHeight(6)
        self.progress.setRange(0, 0)  # indeterminate
        self.progress.setTextVisible(False)
        self.progress.setStyleSheet("""
            QProgressBar {
                border: none;
                border-radius: 3px;
                background: #e2e8f0;
            }
            QProgressBar::chunk {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                    stop:0 #f97316, stop:1 #fb923c);
                border-radius: 3px;
            }
        """)
        splash_layout.addWidget(self.progress, alignment=Qt.AlignmentFlag.AlignCenter)

        self.stack.addWidget(splash)

        # ─── PAGE 1: BROWSER ──────────────────────────────────────────────────
        main_page = QWidget()
        main_page.setStyleSheet("background-color: #f1f5f9;")
        main_layout = QVBoxLayout(main_page)
        main_layout.setContentsMargins(0, 0, 0, 0)

        self.browser = QWebEngineView()

        # Prevent white background flash in WebEngine
        self.browser.page().setBackgroundColor(QColor("#f1f5f9"))

        # Enable camera access (for QR scanner)
        settings = self.browser.settings()
        settings.setAttribute(QWebEngineSettings.WebAttribute.MediaVideoCapture, True)
        settings.setAttribute(QWebEngineSettings.WebAttribute.JavascriptEnabled, True)
        settings.setAttribute(QWebEngineSettings.WebAttribute.LocalStorageEnabled, True)

        main_layout.addWidget(self.browser)
        self.stack.addWidget(main_page)

        # ─── State ────────────────────────────────────────────────────────────
        self.server_ready = False
        self._node_proc = None

        self.browser.loadFinished.connect(self._on_load_finished)
        self.browser.loadProgress.connect(self._on_load_progress)

        # Start backend in background thread
        self._start_backend()

    def _start_backend(self):
        backend_dir = resource_path("backend")
        server_script = os.path.join(backend_dir, "server.js")

        def run_server():
            if not os.path.isdir(backend_dir):
                print(f"[ScanTrack] ERROR: Backend dir not found: {backend_dir}")
                return

            # Kill only whatever is using port 5000 (not all node.exe processes)
            if sys.platform == "win32":
                try:
                    kill_cmd = (
                        'for /f "tokens=5" %a in '
                        '(\'netstat -aon ^| findstr ":5000"\') '
                        'do taskkill /F /PID %a 2>nul'
                    )
                    subprocess.run(kill_cmd, shell=True, capture_output=True, timeout=5)
                except Exception:
                    pass

            cmd = f'node "{server_script}"'
            try:
                self._node_proc = subprocess.Popen(
                    cmd, cwd=backend_dir, shell=True,
                    stdout=subprocess.PIPE, stderr=subprocess.PIPE
                )
                self._node_proc.wait()
            except Exception as e:
                print(f"[ScanTrack] Server error: {e}")

        threading.Thread(target=run_server, daemon=True).start()

        # Poll server readiness every 1s
        self._poll_timer = QTimer(self)
        self._poll_timer.timeout.connect(self._poll_server)
        self._poll_timer.start(1000)
        self.loader_label.setText("Starting backend server...")

    def _poll_server(self):
        try:
            r = requests.get("http://localhost:5000/api/health", timeout=1)
            if r.status_code == 200:
                self._poll_timer.stop()
                self.server_ready = True
                self.loader_label.setText("Loading ScanTrack...")
                self.browser.setUrl(QUrl("http://localhost:5000/"))
        except Exception:
            pass  # Still starting up

    def _on_load_progress(self, progress):
        if progress > 80:
            self.loader_label.setText("Almost ready...")

    def _on_load_finished(self, ok):
        if ok and self.server_ready:
            # Wait 400ms to allow React to fully paint before showing
            QTimer.singleShot(400, self._show_app)
        elif not ok:
            self.loader_label.setText("Connection error — retrying...")
            QTimer.singleShot(2000, lambda: self.browser.reload())

    def _show_app(self):
        self.stack.setCurrentIndex(1)

    def closeEvent(self, event):
        """Clean up node process on close."""
        if self._node_proc and self._node_proc.poll() is None:
            try:
                self._node_proc.terminate()
            except Exception:
                pass
        event.accept()


if __name__ == "__main__":
    app = QApplication(sys.argv)
    app.setApplicationName("ScanTrack")
    app.setOrganizationName("ScanTrack")

    window = ScanTrackApp()
    window.show()
    sys.exit(app.exec())
