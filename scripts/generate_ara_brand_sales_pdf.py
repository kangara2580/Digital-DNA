from __future__ import annotations

from pathlib import Path
from typing import Sequence

from reportlab.lib import colors
from reportlab.lib.colors import Color
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "ARA_Brand_Sales_Deck_2026.pdf"
FONT_REGULAR = "C:/Windows/Fonts/NotoSansKR-VF.ttf"
FONT_SERIF = "C:/Windows/Fonts/NotoSerifKR-VF.ttf"

W, H = 960, 540
BLACK = Color(0.015, 0.015, 0.02)
DEEP = Color(0.035, 0.025, 0.045)
PANEL = Color(0.075, 0.07, 0.09)
PANEL2 = Color(0.11, 0.095, 0.12)
PINK = Color(1.0, 0.11, 0.45)
SOFT_PINK = Color(1.0, 0.56, 0.74)
WHITE = colors.white
MUTE = Color(0.72, 0.72, 0.78)
FAINT = Color(0.23, 0.21, 0.26)
GREEN = Color(0.14, 0.86, 0.58)
CYAN = Color(0.18, 0.65, 0.95)
YELLOW = Color(1.0, 0.72, 0.2)


def setup() -> None:
    pdfmetrics.registerFont(TTFont("NotoKR", FONT_REGULAR))
    pdfmetrics.registerFont(TTFont("NotoSerifKR", FONT_SERIF))


def sw(s: str, size: float, font: str = "NotoKR") -> float:
    return pdfmetrics.stringWidth(s, font, size)


def wrap(s: str, width: float, size: float, font: str = "NotoKR") -> list[str]:
    out: list[str] = []
    for para in s.split("\n"):
        line = ""
        for word in para.split(" "):
            cand = word if not line else f"{line} {word}"
            if sw(cand, size, font) <= width:
                line = cand
                continue
            if line:
                out.append(line)
            if sw(word, size, font) <= width:
                line = word
            else:
                part = ""
                for ch in word:
                    cand2 = part + ch
                    if sw(cand2, size, font) <= width:
                        part = cand2
                    else:
                        if part:
                            out.append(part)
                        part = ch
                line = part
        out.append(line)
    return out


def t(
    c: canvas.Canvas,
    s: str,
    x: float,
    y: float,
    size: float = 14,
    color: Color = WHITE,
    width: float | None = None,
    leading: float | None = None,
    font: str = "NotoKR",
    align: str = "left",
    max_lines: int | None = None,
) -> float:
    c.setFont(font, size)
    c.setFillColor(color)
    lines = wrap(s, width, size, font) if width else s.split("\n")
    if max_lines:
        lines = lines[:max_lines]
    yy = y
    leading = leading or size * 1.35
    for line in lines:
        xx = x
        if align == "center" and width:
            xx = x + (width - sw(line, size, font)) / 2
        if align == "right" and width:
            xx = x + width - sw(line, size, font)
        c.drawString(xx, yy, line)
        yy -= leading
    return yy


def bg(c: canvas.Canvas, page: int) -> None:
    c.setFillColor(BLACK)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(Color(0.28, 0.02, 0.13))
    c.circle(860, 470, 220, fill=1, stroke=0)
    c.setFillColor(Color(0.06, 0.02, 0.09))
    c.circle(80, 80, 220, fill=1, stroke=0)
    c.setStrokeColor(FAINT)
    c.line(48, 42, W - 48, 42)
    t(c, "ARA.PINK", 52, 20, 9, MUTE)
    t(c, f"{page:02d}", W - 72, 20, 9, MUTE)


def pill(c: canvas.Canvas, s: str, x: float, y: float, color: Color = PINK) -> None:
    w = sw(s, 9) + 24
    c.setFillColor(color)
    c.roundRect(x, y, w, 22, 11, fill=1, stroke=0)
    t(c, s, x + 12, y + 7, 8.5, WHITE)


def card(c: canvas.Canvas, x: float, y: float, w: float, h: float, fill: Color = PANEL, stroke: Color = FAINT) -> None:
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.setLineWidth(1)
    c.roundRect(x, y, w, h, 18, fill=1, stroke=1)


def image(c: canvas.Canvas, path: Path, x: float, y: float, w: float, h: float) -> None:
    with Image.open(path) as im:
        iw, ih = im.size
    scale = min(w / iw, h / ih)
    dw, dh = iw * scale, ih * scale
    c.drawImage(ImageReader(str(path)), x + (w - dw) / 2, y + (h - dh) / 2, dw, dh, preserveAspectRatio=True, mask="auto")


def screen(c: canvas.Canvas, path: Path, x: float, y: float, w: float, h: float, label: str | None = None) -> None:
    card(c, x, y, w, h, Color(0.03, 0.03, 0.04), Color(0.24, 0.18, 0.24))
    c.setFillColor(Color(0.08, 0.07, 0.09))
    c.roundRect(x + 10, y + h - 28, w - 20, 14, 7, fill=1, stroke=0)
    image(c, path, x + 12, y + 18, w - 24, h - 54)
    if label:
        t(c, label, x + 18, y + 10, 8.5, MUTE)


def heading(c: canvas.Canvas, eyebrow: str, title: str, subtitle: str, page: int) -> None:
    bg(c, page)
    pill(c, eyebrow, 56, H - 80)
    t(c, title, 56, H - 142, 31, WHITE, 720, 39)
    if subtitle:
        t(c, subtitle, 58, H - 204, 13, MUTE, 680, 19)


def metric(c: canvas.Canvas, x: float, y: float, w: float, label: str, value: str, desc: str, color: Color) -> None:
    card(c, x, y, w, 108)
    c.setFillColor(color)
    c.roundRect(x + 18, y + 78, 38, 8, 4, fill=1, stroke=0)
    t(c, label, x + 18, y + 62, 10, MUTE)
    t(c, value, x + 18, y + 34, 22, WHITE)
    t(c, desc, x + 18, y + 15, 9.5, MUTE, w - 36)


def mini_metric(c: canvas.Canvas, x: float, y: float, w: float, label: str, value: str, desc: str, color: Color) -> None:
    card(c, x, y, w, 80)
    c.setFillColor(color)
    c.roundRect(x + 16, y + 54, 32, 7, 4, fill=1, stroke=0)
    t(c, label, x + 16, y + 41, 8.5, MUTE)
    t(c, value, x + 16, y + 20, 17, WHITE)
    t(c, desc, x + 16, y + 8, 7.5, MUTE, w - 32, max_lines=1)


def simple_table(c: canvas.Canvas, headers: Sequence[str], rows: Sequence[Sequence[str]], x: float, y: float, widths: Sequence[float], row_h: float = 34) -> None:
    total = sum(widths)
    c.setFillColor(PINK)
    c.roundRect(x, y - row_h, total, row_h, 12, fill=1, stroke=0)
    xx = x
    for h, ww in zip(headers, widths):
        t(c, h, xx + 12, y - 22, 10, WHITE, ww - 24)
        xx += ww
    yy = y - row_h
    for i, row in enumerate(rows):
        c.setFillColor(PANEL if i % 2 == 0 else PANEL2)
        c.rect(x, yy - row_h, total, row_h, fill=1, stroke=0)
        c.setStrokeColor(FAINT)
        c.line(x, yy - row_h, x + total, yy - row_h)
        xx = x
        for cell, ww in zip(row, widths):
            t(c, cell, xx + 12, yy - 22, 10.2, WHITE if i == 0 else MUTE, ww - 24, max_lines=1)
            xx += ww
        yy -= row_h
    c.setStrokeColor(FAINT)
    c.roundRect(x, yy, total, y - yy, 12, fill=0, stroke=1)


def cover(c: canvas.Canvas) -> None:
    bg(c, 1)
    c.setFillColor(PINK)
    c.circle(735, 282, 155, fill=1, stroke=0)
    c.setFillColor(Color(0.05, 0.02, 0.05))
    c.roundRect(612, 160, 240, 260, 34, fill=1, stroke=0)
    t(c, "ARA", 665, 315, 54, WHITE)
    t(c, "Brand Campaign\nSales Deck", 665, 258, 22, SOFT_PINK, 170, 28)
    pill(c, "BRAND PARTNERSHIP 2026", 58, 402)
    t(c, "AI 숏폼 캠페인을\n더 빠르게, 더 많이,\n더 성과 중심으로.", 58, 310, 38, WHITE, 520, 50)
    t(c, "브랜드가 UGC 릴스를 확보하고, 크리에이터가 수익을 만드는 AI 숏폼 캠페인 플랫폼", 60, 122, 15, MUTE, 560)


def opportunity(c: canvas.Canvas) -> None:
    heading(c, "01 WHY NOW", "브랜드는 더 많은 숏폼이 필요하지만, 제작 방식은 아직 느립니다.", "광고 소재는 빠르게 소모되고, 체험단 운영은 수작업에 머물러 있습니다.", 2)
    metric(c, 60, 235, 245, "Need", "Always-on Reels", "브랜드는 매주 새로운 숏폼 소재가 필요합니다.", PINK)
    metric(c, 358, 235, 245, "Pain", "Manual Campaigns", "체험단 모집, 제출, 평가, 정산이 분산되어 있습니다.", CYAN)
    metric(c, 656, 235, 245, "Shift", "AI Remix", "하나의 릴스를 브랜드/제품별로 빠르게 변환합니다.", GREEN)
    t(c, "ARA는 브랜드 캠페인 운영과 AI 숏폼 제작을 하나의 플로우로 묶습니다.", 82, 132, 25, WHITE, 790)


def product_flow(c: canvas.Canvas) -> None:
    heading(c, "02 PRODUCT FLOW", "캠페인 개설부터 콘텐츠 확보까지 한 번에 연결합니다.", "", 3)
    steps = [
        ("Campaign", "브랜드 미션 등록"),
        ("Create", "크리에이터 릴스 제작"),
        ("Remix", "AI 변환/커스터마이징"),
        ("Rank", "성과 기반 랭킹"),
        ("License", "우수 콘텐츠 사용권 구매"),
    ]
    x = 58
    for i, (h, b) in enumerate(steps):
        card(c, x, 255, 155, 120)
        t(c, f"0{i+1}", x + 18, 330, 13, PINK)
        t(c, h, x + 18, 300, 18, WHITE)
        t(c, b, x + 18, 276, 11, MUTE, 110)
        if i < 4:
            c.setStrokeColor(PINK)
            c.setLineWidth(2)
            c.line(x + 158, 315, x + 178, 315)
            c.line(x + 178, 315, x + 170, 320)
            c.line(x + 178, 315, x + 170, 310)
        x += 178
    t(c, "브랜드는 캠페인 운영 시간을 줄이고, 크리에이터는 반복 수익 기회를 얻습니다.", 72, 124, 23, SOFT_PINK, 790)


def visuals(c: canvas.Canvas) -> None:
    heading(c, "03 REAL PRODUCT VISUALS", "현재 제품 흐름은 판매자 업로드와 구매자 커스터마이징 중심으로 설계되어 있습니다.", "", 4)
    screen(c, ROOT / "public" / "steps" / "creator-step1-upload.png", 58, 115, 262, 250, "Seller upload")
    screen(c, ROOT / "public" / "steps" / "user-step1-browse.png", 348, 115, 262, 250, "Buyer browse")
    screen(c, ROOT / "public" / "steps" / "user-step2-customize.png", 638, 115, 262, 250, "AI customize")


def brand_campaign(c: canvas.Canvas) -> None:
    heading(c, "04 BRAND CAMPAIGN MODEL", "브랜드는 예산을 걸고, 크리에이터는 릴스로 경쟁합니다.", "", 5)
    card(c, 60, 130, 360, 260)
    t(c, "Campaign Example", 84, 348, 13, SOFT_PINK)
    t(c, "New Product Launch\nUGC Challenge", 84, 300, 30, WHITE, 270, 37)
    t(c, "미션: 15초 릴스 업로드\n평가: 조회수 + 참여율 + 브랜드 심사\n보상: 순위 상금 + 브랜드 픽 라이선스", 86, 220, 13, MUTE, 280, 22)
    card(c, 470, 130, 390, 260)
    simple_table(c, ["평가 기준", "비중"], [("조회수", "40%"), ("좋아요/댓글/공유", "30%"), ("브랜드 심사", "30%")], 500, 340, [220, 100], 42)
    t(c, "단순 조회수 경쟁이 아니라 브랜드 적합도까지 반영해 품질을 관리합니다.", 500, 164, 15, WHITE, 310)


def revenue(c: canvas.Canvas) -> None:
    heading(c, "05 REVENUE MODEL", "브랜드 영업용 핵심 메시지는 명확합니다: 콘텐츠 확보 비용을 줄이고, 성과를 숫자로 봅니다.", "", 6)
    simple_table(
        c,
        ["수익원", "구조", "브랜드 가치"],
        [
            ("캠페인 운영 수수료", "브랜드 예산의 15~25%", "UGC 수집/평가/정산 대행"),
            ("콘텐츠 라이선스", "우수 릴스 사용권 구매", "광고 소재 재사용"),
            ("판매자 구독", "크리에이터 노출/분석", "공급자 품질 상승"),
            ("AI 변환", "Kling 3.0 원가+10%", "소재 버전 확장"),
        ],
        70,
        365,
        [185, 250, 350],
        36,
    )
    mini_metric(c, 92, 82, 230, "Campaign", "300만원", "예시 브랜드 예산", PINK)
    mini_metric(c, 365, 82, 230, "ARA Fee", "60만원", "20% 운영 수수료", GREEN)
    mini_metric(c, 638, 82, 230, "Creator Pool", "240만원", "상금/참가 보상", CYAN)


def brand_value(c: canvas.Canvas) -> None:
    heading(c, "06 VALUE FOR BRANDS", "ARA는 브랜드에게 '많은 숏폼'과 '성과 좋은 숏폼'을 동시에 제공합니다.", "", 7)
    items = [
        ("콘텐츠 대량 확보", "하나의 캠페인에서 여러 크리에이터의 릴스를 수집"),
        ("AI 버전 확장", "배경, 인물, 메시지를 바꿔 다양한 소재 생성"),
        ("성과 랭킹", "조회수와 참여율, 브랜드 심사를 함께 관리"),
        ("재사용권 거래", "좋은 릴스를 광고 소재로 추가 구매"),
    ]
    x, y = 64, 250
    for i, (h, b) in enumerate(items):
        card(c, x, y, 390, 90)
        c.setFillColor(PINK if i % 2 == 0 else GREEN)
        c.roundRect(x + 20, y + 62, 36, 8, 4, fill=1, stroke=0)
        t(c, h, x + 20, y + 38, 17, WHITE)
        t(c, b, x + 20, y + 17, 10.5, MUTE, 310)
        x += 430
        if x > 520:
            x, y = 64, y - 112


def pricing(c: canvas.Canvas) -> None:
    heading(c, "07 BRAND PACKAGE", "초기 브랜드 영업은 작은 캠페인부터 시작하는 것이 현실적입니다.", "", 8)
    simple_table(
        c,
        ["패키지", "브랜드 예산", "ARA 수익", "추천 대상"],
        [
            ("Micro", "990,000원", "약 20%", "마이크로 브랜드 테스트"),
            ("Growth", "3,000,000원", "약 20%", "신제품/팝업/시즌 캠페인"),
            ("Brand", "10,000,000원", "15~20%", "중대형 브랜드 캠페인"),
            ("Enterprise", "별도 견적", "운영비+성과", "대행사/대기업"),
        ],
        70,
        320,
        [145, 170, 140, 335],
        40,
    )
    t(c, "초기 세일즈 문구", 78, 82, 11, SOFT_PINK)
    t(c, "광고 소재 한두 개를 만드는 비용으로 여러 크리에이터의 숏폼 후보를 확보합니다.", 78, 56, 17, WHITE, 790)


def roadmap(c: canvas.Canvas) -> None:
    heading(c, "08 GO-TO-MARKET", "처음부터 대기업보다 빠르게 의사결정하는 마이크로 브랜드를 공략합니다.", "", 9)
    cols = [
        ("Step 1", "뷰티/패션/푸드 브랜드 10곳", "소형 캠페인 제안"),
        ("Step 2", "크리에이터 100명 확보", "릴스 공급량 구축"),
        ("Step 3", "첫 캠페인 20개 운영", "성과 사례 확보"),
        ("Step 4", "브랜드 픽 라이선스 판매", "고마진 수익 확대"),
    ]
    x = 60
    for label, h, b in cols:
        card(c, x, 175, 195, 205)
        pill(c, label, x + 20, 335, PINK)
        t(c, h, x + 20, 285, 19, WHITE, 150, 25)
        t(c, b, x + 20, 220, 12, MUTE, 145)
        x += 220


def ask(c: canvas.Canvas) -> None:
    bg(c, 10)
    pill(c, "PARTNERSHIP PROPOSAL", 60, 410)
    t(c, "ARA와 함께\n브랜드 숏폼 캠페인을\n더 빠르게 실험하세요.", 60, 320, 38, WHITE, 600, 50)
    t(c, "제안: Micro Campaign으로 첫 UGC 릴스 캠페인 테스트\n목표: 2주 내 릴스 후보 확보, 성과 랭킹, 브랜드 픽 콘텐츠 선정", 64, 150, 16, MUTE, 700, 26)
    card(c, 655, 185, 215, 190, Color(0.06, 0.03, 0.06), Color(0.4, 0.08, 0.18))
    t(c, "ARA.PINK", 690, 310, 30, PINK)
    t(c, "AI Short-form\nCampaign Platform", 692, 255, 15, WHITE, 150, 21)


def build() -> None:
    setup()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUT), pagesize=(W, H))
    slides = [cover, opportunity, product_flow, visuals, brand_campaign, revenue, brand_value, pricing, roadmap, ask]
    for i, slide in enumerate(slides):
        slide(c)
        if i < len(slides) - 1:
            c.showPage()
    c.save()
    print(OUT)


if __name__ == "__main__":
    build()
