import type { Video } from "@prisma/client";

const TYPE_PRICE_SUGGEST = "PRICE_SUGGEST";

export function priceSuggestionTitle(): string {
  return "데이터 기반 가격 인하 제안";
}

export function buildPriceSuggestionBody(
  video: Pick<Video, "title" | "price">,
  suggestedPrice: number,
): string {
  const vibe =
    "오랫동안 선택받지 못한 이 동영상에 새로운 생명(DNA)을 불어넣어 주세요! ";
  const data =
    `이 영상과 비슷한 분위기의 동영상들이 최근 ${suggestedPrice.toLocaleString("ko-KR")}원대에 활발히 거래되고 있어요. `;
  const ask = `${video.price.toLocaleString("ko-KR")}원 → ${suggestedPrice.toLocaleString("ko-KR")}원으로 낮춰보시겠어요?`;
  return vibe + data + ask;
}

export { TYPE_PRICE_SUGGEST };
