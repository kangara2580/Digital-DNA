import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // [나노바나나2 (Gemini 3 Flash Image) 프롬프트 설정] - 유저 요청으로 C.U (Close-up) 전용으로 개조
    const systemPrompt = `[Role: Strict Orthographic 3-Way Character Sheet Expert]

당신은 업로드된 인물/캐릭터 이미지를 분석하여 영상 합성용 초고화질 얼굴 캐릭터 시트를 생성하는 전문가입니다. 아래 규칙을 엄격히 준수하여 얼굴에 집중된 'C.U(Close Up) 3면도' 단 1장의 고화질 이미지만 생성하십시오.

### 1. 출력 원칙 (Close Up Only)
- 오직 인물의 얼굴과 두부(어깨 위)에만 집중된 **[C.U (Close Up) 3면도]**를 하나의 이미지로 출력하십시오. 전신(Full Shot) 출력은 절대 금지합니다.

### 2. 각도 강제 및 여백 확보 원칙 (Strict Custom Aspect & Wide Spacing)
- NO 3/4 View: 반측면(45도, 3/4 view) 생성을 엄격히 금지합니다.
- 얼굴의 [정면(0°), 완전 측면(90°), 후면(180°)] 샷을 수평 선상에 나란히 배치해야 합니다.
- **CRITICAL**: 도화지의 비율을 극단적인 가로 비율(16:9 이상의 파노라마 비율)로 상정하고, **정면, 측면, 후면 얼굴 사이에 매우 넉넉한 여백(빈 공간)**을 두어 서로 절대 겹치지 않게 하십시오.

### 3. 절대 불변 및 일관성 원칙 (Consistency & Logic)
- Visual Identity: 원본 사진 인물의 얼굴, 헤어스타일, 이목구비, 피부색, 질감을 100% 보존하십시오.
- Anatomical Logic: 3각도(정면, 측면, 후면) 간의 해부학적 오차가 없도록 완벽하게 일치시켜야 합니다.
- Ultra High Quality: 4K 해상도로 노이즈 없이 선명하게 생성하십시오.

### 4. 기술 설정 및 실행 프로세스
- Background: 단순 단색(White or Neutral Grey).
- Execution: 원본 얼굴을 분석한 뒤, C.U 3면도 단 1장만 최종 결과물로 생성할 것.`;

    console.log("나노바나나2 백엔드 호출 시작... (프롬프트 장전 완료)");
    
    let resultImages: string[] = [];
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (apiKey && imageUrl.startsWith("data:image")) {
       try {
          const mimeType = imageUrl.split(';')[0].split(':')[1];
          const base64Data = imageUrl.split(',')[1];
          
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                 contents: [{
                    role: "user",
                    parts: [
                      { text: systemPrompt },
                      { inline_data: { mime_type: mimeType, data: base64Data } }
                    ]
                 }],
                 generationConfig: {
                    temperature: 0.1, // 일관성을 위해 낮춤
                 }
              })
          });

          if (!response.ok) {
             const errText = await response.text();
             console.error("Gemini API Error details:", errText);
             throw new Error(errText);
          }

          const data = await response.json();
          // Gemini가 이미지를 응답(inlineData)으로 줬는지 파싱 시도
          const parts = data?.candidates?.[0]?.content?.parts || [];
          
          for (const part of parts) {
             if (part.inlineData) {
                // 반환된 이미지가 있다면 base64로 가져옴
                resultImages.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
             } else if (part.inline_data) {
                resultImages.push(`data:${part.inline_data.mime_type};base64,${part.inline_data.data}`);
             }
          }
          
          console.log(`Gemini API 응답 완료. 반환된 이미지 파트 개수: ${resultImages.length}`);
       } catch(e) {
          console.error("구글 API 진짜 요청 중 에러 발생:", e);
       }
    } else {
       console.log("API Key가 없거나 imageUrl이 Data URL이 아닙니다. Mock 딜레이만 실행합니다.");
       await new Promise((resolve) => setTimeout(resolve, 3500));
    }

    if (resultImages.length === 0) {
       // 나노바나나(Gemini)가 이미지를 한 장도 반환하지 못한 경우 (완전 실패)
       return NextResponse.json({
         success: false,
         error: "나노바나나(Gemini) 생성 실패: 결과 이미지가 없습니다."
       }, { status: 400 });
    }

    // 최소 1장 이상의 이미지가 무사히 반환된 경우! 
    // 화면의 3칸을 꽉 채우기 위해, 첫 번째로 나온 결과물(3면도 이미지 1장)을 3개 복제해서 프론트에 보여줍니다.
    const returnedImage = resultImages[0];
    const finalAngles = [
       returnedImage, returnedImage, returnedImage 
    ];

    return NextResponse.json({
      success: true,
      resultAngles: finalAngles
    });

  } catch (error) {
    console.error("NanoBanana2 API Error:", error);
    return NextResponse.json({ error: "Failed to generate 3D multi-shot angles" }, { status: 500 });
  }
}
