from __future__ import annotations

from pathlib import Path
from typing import Iterable, Sequence

from reportlab.lib import colors
from reportlab.lib.colors import Color
from reportlab.lib.pagesizes import landscape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "ARA_Business_Introduction_2026.pdf"
FONT_REGULAR = "C:/Windows/Fonts/NotoSansKR-VF.ttf"
FONT_SERIF = "C:/Windows/Fonts/NotoSerifKR-VF.ttf"

W, H = 960, 540

NAVY = Color(0.025, 0.045, 0.11)
INK = Color(0.07, 0.09, 0.14)
MUTED = Color(0.36, 0.42, 0.52)
LINE = Color(0.83, 0.87, 0.92)
PANEL = Color(0.965, 0.975, 0.99)
GREEN = Color(0.0, 0.68, 0.48)
CYAN = Color(0.08, 0.62, 0.88)
PINK = Color(0.93, 0.18, 0.45)
AMBER = Color(0.95, 0.6, 0.12)
PURPLE = Color(0.42, 0.26, 0.85)
WHITE = colors.white


def setup_fonts() -> None:
    pdfmetrics.registerFont(TTFont("NotoKR", FONT_REGULAR))
    pdfmetrics.registerFont(TTFont("NotoSerifKR", FONT_SERIF))


def sw(text: str, size: float, font: str = "NotoKR") -> float:
    return pdfmetrics.stringWidth(text, font, size)


def wrap(text: str, width: float, size: float, font: str = "NotoKR") -> list[str]:
    lines: list[str] = []
    for raw in text.split("\n"):
        words = raw.split(" ")
        current = ""
        for word in words:
            candidate = word if not current else f"{current} {word}"
            if sw(candidate, size, font) <= width:
                current = candidate
            else:
                if current:
                    lines.append(current)
                if sw(word, size, font) <= width:
                    current = word
                else:
                    piece = ""
                    for ch in word:
                        cand = piece + ch
                        if sw(cand, size, font) <= width:
                            piece = cand
                        else:
                            if piece:
                                lines.append(piece)
                            piece = ch
                    current = piece
        lines.append(current)
    return lines


def text(
    c: canvas.Canvas,
    body: str,
    x: float,
    y: float,
    size: float = 18,
    color: Color = INK,
    font: str = "NotoKR",
    width: float | None = None,
    leading: float | None = None,
    max_lines: int | None = None,
    align: str = "left",
) -> float:
    c.setFont(font, size)
    c.setFillColor(color)
    leading = leading or size * 1.35
    lines = wrap(body, width, size, font) if width else body.split("\n")
    if max_lines:
        lines = lines[:max_lines]
    yy = y
    for line in lines:
        xx = x
        if align == "center":
            xx = x + ((width or 0) - sw(line, size, font)) / 2
        elif align == "right":
            xx = x + (width or 0) - sw(line, size, font)
        c.drawString(xx, yy, line)
        yy -= leading
    return yy


def card(c: canvas.Canvas, x: float, y: float, w: float, h: float, fill=WHITE, stroke=LINE, radius=12) -> None:
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.setLineWidth(1)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=1)


def pill(c: canvas.Canvas, label: str, x: float, y: float, fill: Color, fg=WHITE) -> None:
    pad_x = 14
    ww = sw(label, 10, "NotoKR") + pad_x * 2
    c.setFillColor(fill)
    c.roundRect(x, y, ww, 24, 12, fill=1, stroke=0)
    text(c, label, x + pad_x, y + 7, 10, fg)


def footer(c: canvas.Canvas, page: int) -> None:
    c.setStrokeColor(Color(0.9, 0.92, 0.95))
    c.line(48, 34, W - 48, 34)
    text(c, "ARA | AI Short-form Commerce Platform", 48, 18, 9, MUTED)
    text(c, f"{page:02d}", W - 70, 18, 9, MUTED)


def title(c: canvas.Canvas, eyebrow: str, heading: str, sub: str, page: int) -> None:
    c.setFillColor(PANEL)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    pill(c, eyebrow, 56, H - 86, GREEN)
    text(c, heading, 56, H - 145, 31, INK, "NotoKR", 720, 40)
    text(c, sub, 58, H - 235, 14, MUTED, "NotoKR", 760, 21)
    footer(c, page)


def bullet_list(c: canvas.Canvas, items: Sequence[str], x: float, y: float, width: float, size: float = 14) -> float:
    yy = y
    for item in items:
        c.setFillColor(GREEN)
        c.circle(x + 5, yy + 6, 3, fill=1, stroke=0)
        yy = text(c, item, x + 18, yy, size, INK, width=width - 18, leading=size * 1.45)
        yy -= 8
    return yy


def metric(c: canvas.Canvas, label: str, value: str, detail: str, x: float, y: float, w: float, color: Color) -> None:
    card(c, x, y, w, 102)
    c.setFillColor(color)
    c.roundRect(x + 15, y + 72, 32, 8, 4, fill=1, stroke=0)
    text(c, label, x + 15, y + 58, 10, MUTED)
    text(c, value, x + 15, y + 30, 22, INK)
    text(c, detail, x + 15, y + 13, 9, MUTED)


def table(
    c: canvas.Canvas,
    headers: Sequence[str],
    rows: Sequence[Sequence[str]],
    x: float,
    y_top: float,
    widths: Sequence[float],
    row_h: float = 34,
    font_size: float = 10.5,
) -> float:
    total_w = sum(widths)
    c.setFillColor(NAVY)
    c.roundRect(x, y_top - row_h, total_w, row_h, 9, fill=1, stroke=0)
    xx = x
    for head, ww in zip(headers, widths):
        text(c, head, xx + 10, y_top - 22, font_size, WHITE, width=ww - 20)
        xx += ww
    yy = y_top - row_h
    for i, row in enumerate(rows):
        fill = WHITE if i % 2 == 0 else PANEL
        c.setFillColor(fill)
        c.rect(x, yy - row_h, total_w, row_h, fill=1, stroke=0)
        c.setStrokeColor(LINE)
        c.line(x, yy - row_h, x + total_w, yy - row_h)
        xx = x
        for cell, ww in zip(row, widths):
            text(c, cell, xx + 10, yy - 22, font_size, INK, width=ww - 20, max_lines=1)
            xx += ww
        yy -= row_h
    c.setStrokeColor(LINE)
    c.roundRect(x, yy, total_w, y_top - yy, 9, fill=0, stroke=1)
    return yy


def arrow(c: canvas.Canvas, x1: float, y1: float, x2: float, y2: float, color: Color = GREEN) -> None:
    c.setStrokeColor(color)
    c.setFillColor(color)
    c.setLineWidth(2)
    c.line(x1, y1, x2, y2)
    c.line(x2, y2, x2 - 8, y2 + 5)
    c.line(x2, y2, x2 - 8, y2 - 5)


def slide_cover(c: canvas.Canvas) -> None:
    c.setFillColor(NAVY)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(Color(0.0, 0.42, 0.34))
    c.circle(760, 430, 180, fill=1, stroke=0)
    c.setFillColor(Color(0.78, 0.12, 0.35))
    c.circle(905, 120, 160, fill=1, stroke=0)
    pill(c, "BUSINESS INTRODUCTION 2026", 56, 420, GREEN)
    text(c, "ARA", 56, 330, 58, WHITE)
    text(c, "AI Short-form Commerce\n& Brand Campaign Platform", 60, 258, 26, WHITE, width=720, leading=35)
    text(
        c,
        "AI로 재사용 가능한 숏폼을 거래하고, 브랜드 캠페인으로 확장되는 크리에이터 커머스 플랫폼",
        60,
        160,
        15,
        Color(0.82, 0.88, 0.94),
        width=650,
    )
    text(c, "ara.pink", 60, 58, 13, Color(0.8, 0.9, 0.95))


def slide_summary(c: canvas.Canvas) -> None:
    title(
        c,
        "01 EXECUTIVE SUMMARY",
        "ARA는 숏폼 마켓, AI 변환, 브랜드 체험단을 하나로 묶는 플랫폼입니다.",
        "현재 제품은 회원, 영상, 구매, AI 작업, 관리자 콘솔의 운영형 백엔드 기반을 갖추고 있으며, 완성 후에는 브랜드가 UGC 캠페인을 실행하고 크리에이터가 반복 수익을 만드는 인프라가 됩니다.",
        2,
    )
    metric(c, "Initial Model", "Marketplace", "릴스 거래 수수료", 56, 120, 190, GREEN)
    metric(c, "Growth Model", "Seller SaaS", "판매자 구독/분석", 270, 120, 190, CYAN)
    metric(c, "Future Model", "Campaign", "브랜드 체험단/라이선스", 484, 120, 190, PINK)
    metric(c, "AI Layer", "Kling 3.0", "원가+10% 전략", 698, 120, 190, PURPLE)


def slide_problem(c: canvas.Canvas) -> None:
    title(c, "02 PROBLEM", "숏폼은 매주 필요하지만, 제작과 성과 관리는 여전히 비효율적입니다.", "", 3)
    cols = [
        ("구매자", ["직접 촬영/편집할 시간 부족", "광고대행사는 비싸고 느림", "반복적으로 쓸 소재가 필요"]),
        ("판매자", ["릴스를 만들 수 있지만 수익화 채널 부족", "브랜드 캠페인 접근이 어려움", "콘텐츠의 반복 판매 구조 부재"]),
        ("브랜드", ["체험단 운영이 수작업 중심", "UGC 수집/평가/재사용권 관리 어려움", "조회수 외 품질 평가 체계 부족"]),
    ]
    x = 56
    for label, items in cols:
        card(c, x, 126, 266, 260)
        text(c, label, x + 20, 340, 21, INK)
        bullet_list(c, items, x + 20, 298, 220, 13)
        x += 292


def slide_solution(c: canvas.Canvas) -> None:
    title(c, "03 SOLUTION", "ARA는 숏폼을 사고, AI로 바꾸고, 캠페인 성과로 연결합니다.", "", 4)
    steps = [
        ("1", "판매자 업로드", "릴스/템플릿 등록"),
        ("2", "구매자 구매", "상업적 사용권 확보"),
        ("3", "AI 변환", "Kling 3.0 / Gemini"),
        ("4", "캠페인 제출", "브랜드 미션 참여"),
        ("5", "랭킹/정산", "상금/라이선스 거래"),
    ]
    x = 52
    y = 250
    for i, (num, head, body) in enumerate(steps):
        card(c, x, y, 152, 104)
        c.setFillColor(GREEN if i < 3 else PINK)
        c.circle(x + 28, y + 75, 15, fill=1, stroke=0)
        text(c, num, x + 23, y + 70, 11, WHITE)
        text(c, head, x + 20, y + 42, 15, INK)
        text(c, body, x + 20, y + 20, 10.5, MUTED, width=110)
        if i < len(steps) - 1:
            arrow(c, x + 154, y + 52, x + 182, y + 52)
        x += 178
    text(c, "핵심 포지션", 60, 160, 16, INK)
    text(c, "AI 생성 툴이 아니라, 거래·정산·캠페인까지 이어지는 숏폼 커머스 인프라", 60, 128, 24, GREEN, width=780)


def slide_personas(c: canvas.Canvas) -> None:
    title(c, "04 CUSTOMER PERSONAS", "구매자 니즈는 '릴스를 산다'가 아니라 '내 브랜드용 숏폼을 빠르게 만든다'입니다.", "", 5)
    rows = [
        ("소상공인/1인 브랜드", "카페, 미용실, PT샵, 음식점", "촬영 없이 홍보 릴스 확보"),
        ("쇼핑몰 셀러", "스마트스토어, 자사몰, 쿠팡", "상품 광고 소재 반복 생성"),
        ("마케터/대행사", "프리랜서, 소형 대행사", "클라이언트별 숏폼 A/B 테스트"),
        ("체험단 참여자", "마이크로 크리에이터", "브랜드 미션에 맞는 릴스 제작"),
    ]
    table(c, ["타겟", "예시", "구매 이유"], rows, 64, 350, [210, 260, 330], 44, 12)
    text(c, "판매자 니즈", 70, 116, 15, INK)
    text(c, "내가 만든 숏폼으로 반복 수익을 만들고, 브랜드 캠페인에서 상금과 추가 계약을 얻는다.", 70, 88, 15, GREEN, width=770)


def slide_code_foundation(c: canvas.Canvas) -> None:
    title(c, "05 CURRENT PRODUCT FOUNDATION", "현재 코드에는 운영형 마켓플레이스의 핵심 백엔드 뼈대가 이미 들어와 있습니다.", "", 6)
    rows = [
        ("회원/인증", "Google OAuth, Supabase Auth, profiles 동기화"),
        ("마켓", "videos, sell/upload, seller videos, category/search"),
        ("거래", "purchases 테이블, 구매자/판매자/영상/가격 기록"),
        ("AI 작업", "generation_jobs, Kling motion-control/task/history"),
        ("운영", "admin members/videos/purchases/reports/jobs"),
        ("안전장치", "reports, audit logs, content change logs, admin notes"),
    ]
    table(c, ["영역", "현재 코드 기반"], rows, 64, 374, [180, 620], 40, 11.5)
    text(c, "PPT에서 말할 수 있는 현재 사실", 70, 84, 14, MUTED)
    text(c, "ARA는 단순 목업이 아니라, 회원·거래·AI 작업·관리자 운영을 Supabase/PostgreSQL 기반으로 확장 가능한 구조를 갖추고 있습니다.", 70, 58, 14, INK, width=790)


def slide_architecture(c: canvas.Canvas) -> None:
    title(c, "06 TECHNOLOGY ARCHITECTURE", "Supabase, Vercel, Kling 3.0, Gemini, Admin Console이 핵심 인프라입니다.", "", 7)
    boxes = [
        (60, 320, "Buyer / Seller / Brand", CYAN),
        (330, 320, "ARA Web App\nara.pink", GREEN),
        (610, 320, "Admin Console\n운영/검수/정산", PINK),
        (150, 170, "Supabase Auth\n회원/권한", PURPLE),
        (350, 170, "PostgreSQL\nvideos, purchases,\ngeneration_jobs", NAVY),
        (565, 170, "AI Providers\nKling 3.0 / Gemini", AMBER),
    ]
    for x, y, label, color in boxes:
        card(c, x, y, 200, 86, WHITE)
        c.setFillColor(color)
        c.roundRect(x + 15, y + 58, 34, 8, 4, fill=1, stroke=0)
        text(c, label, x + 15, y + 38, 13, INK, width=160, leading=17)
    arrow(c, 260, 363, 322, 363)
    arrow(c, 530, 363, 604, 363)
    arrow(c, 425, 318, 250, 255)
    arrow(c, 430, 318, 450, 255)
    arrow(c, 470, 318, 610, 255)


def slide_revenue(c: canvas.Canvas) -> None:
    title(c, "07 BUSINESS MODEL", "초기 수익은 판매자 중심, AI는 사용량을 만드는 촉매로 설계합니다.", "", 8)
    rows = [
        ("릴스 거래 수수료", "구매자가 릴스 구매 시 30~35%", "핵심"),
        ("판매자 구독", "노출/분석/낮은 수수료 제공", "핵심"),
        ("AI 변환 마진", "Kling 3.0 원가 + 약 10%", "보조"),
        ("브랜드 캠페인", "캠페인 운영 수수료 15~25%", "미래 핵심"),
        ("라이선스 거래", "브랜드가 우수 UGC 사용권 구매", "고마진"),
    ]
    table(c, ["수익원", "구조", "역할"], rows, 64, 370, [210, 430, 160], 42, 12)
    text(c, "최종 방향", 70, 88, 14, MUTED)
    text(c, "구매자에게는 저렴한 AI 변환 경험을 제공하고, 판매자 구독과 브랜드 캠페인으로 반복 매출을 키웁니다.", 70, 58, 18, GREEN, width=780)


def slide_pricing(c: canvas.Canvas) -> None:
    title(c, "08 PRICING STRATEGY", "초기 가격은 구매자 진입장벽을 낮추고 판매자 수익화를 강화합니다.", "", 9)
    rows1 = [
        ("Basic Reel", "2,900원", "870원", "2,030원"),
        ("Standard Reel", "5,900원", "1,770원", "4,130원"),
        ("Premium Reel", "9,900원", "2,970원", "6,930원"),
        ("Pro Reel", "14,900원", "4,470원", "10,430원"),
    ]
    table(c, ["릴스 상품", "가격", "ARA 수익", "판매자 정산"], rows1, 60, 385, [170, 130, 150, 150], 36, 10.5)
    rows2 = [
        ("Kling 3.0 5초", "2,200원", "원가 + 10%"),
        ("Kling 3.0 10초", "4,400원", "원가 + 10%"),
        ("Kling 3.0 15초", "6,600원", "원가 + 10%"),
        ("배경/인물 변경", "300~500원", "저마진/고사용량"),
    ]
    table(c, ["AI 기능", "가격", "전략"], rows2, 60, 202, [210, 150, 240], 34, 10.5)
    rows3 = [
        ("Free", "0원", "35%"),
        ("Plus", "14,900원/월", "25%"),
        ("Pro", "44,000원/월", "20%"),
        ("Studio", "149,000원/월", "15%"),
    ]
    table(c, ["판매자 플랜", "월 구독", "거래 수수료"], rows3, 690, 385, [90, 115, 110], 36, 10)


def slide_unit(c: canvas.Canvas) -> None:
    title(c, "09 UNIT ECONOMICS", "거래 1건의 수익은 작지만, 판매자 구독과 반복 거래가 누적되면 효율이 올라갑니다.", "", 10)
    metric(c, "릴스 1건", "≈ 1,569원", "5,900원 거래 기준 실질 수익", 60, 310, 240, GREEN)
    metric(c, "AI 10초 1회", "≈ 400~500원", "Kling 3.0 원가+10%", 330, 310, 240, CYAN)
    metric(c, "구매자 1회", "≈ 2,000원", "릴스+AI 1회 사용", 600, 310, 240, PINK)
    rows = [
        ("Seller Plus 월 10건", "구독 14,900원 + 수수료 12,250원", "약 27,150원"),
        ("Seller Pro 월 50건", "구독 44,000원 + 수수료 59,000원", "약 103,000원"),
        ("브랜드 캠페인 300만원", "운영 수수료 20%", "약 600,000원"),
    ]
    table(c, ["시나리오", "계산", "ARA 수익"], rows, 86, 220, [220, 390, 180], 44, 11.5)


def slide_forecast(c: canvas.Canvas) -> None:
    title(c, "10 1-YEAR OPERATING TARGET", "1년 내 목표는 월 거래 7,500건, 연 순수익 약 2억원 수준입니다.", "", 11)
    rows = [
        ("월 활성 구매자", "5,000명"),
        ("월 활성 판매자", "800명"),
        ("유료 판매자", "120명"),
        ("월 릴스 거래", "7,500건"),
        ("월 AI 생성", "6,000~7,000회"),
        ("월 순수익", "약 1,500만~1,800만원"),
        ("연 순수익", "약 2억원"),
    ]
    table(c, ["지표", "목표"], rows, 80, 382, [330, 330], 38, 13)
    text(c, "검증용 첫 목표", 760, 350, 14, MUTED)
    bullet_list(c, ["판매자 100명", "등록 릴스 1,000개", "월 거래 1,000건", "유료 판매자 20명"], 760, 315, 140, 12)


def slide_campaign(c: canvas.Canvas) -> None:
    title(c, "11 BRAND CAMPAIGN EXPANSION", "ARA의 미래 가치는 브랜드 체험단 캠페인 플랫폼에서 커집니다.", "", 12)
    steps = [
        "브랜드가 캠페인과 예산을 등록",
        "크리에이터가 미션에 맞는 릴스 제작/제출",
        "SNS 업로드 후 조회수·참여율·브랜드 심사로 평가",
        "상금 지급, 브랜드 픽, 광고 사용권 추가 구매",
    ]
    bullet_list(c, steps, 72, 345, 520, 15)
    rows = [
        ("Micro", "990,000원", "약 20%"),
        ("Growth", "3,000,000원", "약 20%"),
        ("Brand", "10,000,000원", "15~20%"),
        ("Enterprise", "별도 견적", "운영비 + 성과 수수료"),
    ]
    table(c, ["캠페인", "브랜드 결제", "ARA 수익"], rows, 600, 360, [110, 140, 130], 38, 10.5)
    text(c, "평가 기준 예시: 조회수 40% + 좋아요/댓글/공유 30% + 브랜드 심사 30%", 72, 86, 17, GREEN, width=780)


def slide_competition(c: canvas.Canvas) -> None:
    title(c, "12 COMPETITIVE ADVANTAGE", "ARA는 AI 생성 툴이 아니라, 콘텐츠 거래와 캠페인을 연결하는 인프라입니다.", "", 13)
    rows = [
        ("일반 AI 영상 툴", "사용자가 처음부터 프롬프트 작성", "저장용 결과물 중심", "판매자 수익화 없음"),
        ("기존 체험단", "폼/DM/엑셀 중심 운영", "성과 측정 수작업", "콘텐츠 재사용권 관리 어려움"),
        ("ARA", "검증된 릴스 기반 AI 변환", "거래/정산/Admin 연결", "브랜드 캠페인/랭킹/라이선스"),
    ]
    table(c, ["구분", "제작 방식", "운영 방식", "수익화"], rows, 54, 350, [120, 250, 250, 230], 54, 10.5)
    text(c, "핵심 차별점", 70, 94, 14, MUTED)
    text(c, "AI 생성 + 숏폼 마켓 + 크리에이터 수익화 + 브랜드 캠페인", 70, 62, 23, GREEN, width=780)


def slide_kpi(c: canvas.Canvas) -> None:
    title(c, "13 OPERATING DASHBOARD", "운영자는 Admin에서 거래, AI 원가, 정산, 캠페인을 숫자로 관리해야 합니다.", "", 14)
    rows = [
        ("Supply", "등록 릴스 수, 승인율, 판매자 활성도"),
        ("Demand", "월 거래 수, 구매자당 구매 수, 재구매율"),
        ("AI Cost", "생성 수, 실패율, 재시도율, API 원가"),
        ("Finance", "거래 수수료, 구독 매출, 정산 예정액"),
        ("Campaign", "캠페인 수, 제출 릴스 수, 브랜드 재구매율"),
        ("Safety", "신고 수, 검수 대기, 정지 계정, 감사로그"),
    ]
    table(c, ["관리 영역", "핵심 KPI"], rows, 80, 370, [190, 580], 42, 12)


def slide_roadmap(c: canvas.Canvas) -> None:
    title(c, "14 ROADMAP", "마켓 검증 후 브랜드 캠페인 플랫폼으로 확장합니다.", "", 15)
    phases = [
        ("0~3개월", "Marketplace Validation", ["결제/크레딧", "정산", "판매자 구독", "Admin 재무"]),
        ("3~9개월", "Campaign Platform", ["브랜드 캠페인", "미션 제출", "랭킹/상금", "브랜드 심사"]),
        ("9~18개월", "Global Creator Commerce", ["다국어/다통화", "글로벌 판매자", "라이선스 거래", "성과 API"]),
    ]
    x = 60
    for idx, (period, head, items) in enumerate(phases):
        card(c, x, 145, 260, 245)
        pill(c, period, x + 20, 340, [GREEN, CYAN, PINK][idx])
        text(c, head, x + 20, 300, 18, INK, width=210)
        bullet_list(c, items, x + 20, 255, 210, 12.5)
        x += 300


def slide_risk(c: canvas.Canvas) -> None:
    title(c, "15 RISKS & CONTROL", "사업 리스크는 기술보다 운영·권리·원가 관리에 있습니다.", "", 16)
    rows = [
        ("구매자 니즈 약함", "릴스 구매가 아닌 '내 브랜드 숏폼 제작'으로 포지셔닝"),
        ("Kling 원가 상승", "크레딧 차감 조정, 실패율 제한, 원가 대시보드"),
        ("저작권/초상권", "업로드 동의, 라이선스 정책, 신고/삭제 플로우"),
        ("조회수 조작", "조회수+참여율+브랜드 심사 혼합 평가"),
        ("정산 복잡성", "초기 월 1~2회 관리자 승인 정산"),
        ("품질 편차", "승인제, 판매자 등급, 브랜드 픽 시스템"),
    ]
    table(c, ["리스크", "대응"], rows, 64, 380, [220, 580], 42, 11.5)


def slide_market(c: canvas.Canvas) -> None:
    title(c, "16 MARKET OPPORTUNITY", "ARA는 숏폼 커머스, 크리에이터 이코노미, AI 영상 생성 시장의 교차점에 있습니다.", "", 17)
    metric(c, "AI Video Market", "$788.5M", "2025 global estimate", 70, 310, 240, GREEN)
    metric(c, "AI Video Forecast", "$3.44B", "2033 global estimate", 350, 310, 240, CYAN)
    metric(c, "TikTok Shop GMV", "$64.3B", "2025 reported global GMV", 630, 310, 240, PINK)
    text(c, "초기 집중 시장", 70, 215, 15, MUTED)
    text(c, "숏폼 광고 소재가 필요한 소상공인·셀러·마이크로 브랜드와, 릴스로 수익화하려는 크리에이터", 70, 178, 22, INK, width=780)
    text(c, "시장 전체를 한 번에 노리기보다, 거래가 실제로 발생하는 좁은 공급/수요부터 검증합니다.", 70, 118, 14, MUTED, width=760)


def slide_closing(c: canvas.Canvas) -> None:
    c.setFillColor(NAVY)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    pill(c, "FINAL POSITIONING", 60, 400, GREEN)
    text(c, "ARA는 숏폼을 사고파는 곳을 넘어,\n브랜드가 AI 기반 UGC 캠페인을 실행하고\n크리에이터가 반복 수익을 만드는 인프라입니다.", 60, 310, 32, WHITE, width=780, leading=43)
    text(c, "Next: 결제/크레딧/정산 완성 → 판매자 100명 확보 → 첫 브랜드 캠페인 운영", 62, 105, 15, Color(0.82, 0.88, 0.94), width=800)
    text(c, "ara.pink", 62, 58, 13, Color(0.8, 0.9, 0.95))


def slide_sources(c: canvas.Canvas) -> None:
    title(c, "APPENDIX", "References & assumptions", "시장 수치는 공개 리포트와 공식 가격표를 기준으로 한 사업소개서용 가정입니다. 실제 API 단가와 환율, PG 수수료는 계약 조건에 따라 달라질 수 있습니다.", 19)
    rows = [
        ("AI Video Market", "Grand View Research AI Video Generator Market Report"),
        ("TikTok Shop GMV", "TechNode Global / Momentum Works related coverage"),
        ("Gemini Pricing", "Google Gemini API official pricing"),
        ("Infra Cost", "Vercel Pricing, Supabase Pricing"),
        ("Internal Basis", "Current ARA codebase: videos, purchases, generation_jobs, admin console"),
    ]
    table(c, ["구분", "출처/근거"], rows, 70, 345, [180, 620], 44, 11)
    text(c, "본 문서는 제품 전략과 사업모델 정리를 위한 내부/제안용 초안입니다.", 72, 96, 13, MUTED, width=760)


def build() -> None:
    setup_fonts()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUT), pagesize=(W, H))
    slides = [
        slide_cover,
        slide_summary,
        slide_problem,
        slide_solution,
        slide_personas,
        slide_code_foundation,
        slide_architecture,
        slide_revenue,
        slide_pricing,
        slide_unit,
        slide_forecast,
        slide_campaign,
        slide_competition,
        slide_kpi,
        slide_roadmap,
        slide_risk,
        slide_market,
        slide_closing,
        slide_sources,
    ]
    for i, draw in enumerate(slides):
        draw(c)
        if i < len(slides) - 1:
            c.showPage()
    c.save()
    print(OUT)


if __name__ == "__main__":
    build()
