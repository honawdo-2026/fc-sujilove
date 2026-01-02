
import { GoogleGenAI, Type } from "@google/genai";
import { MatchSchedule } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeScheduleImage = async (base64Image: string): Promise<MatchSchedule[]> => {
  const prompt = `
    이 이미지(축구 경기 일정표)를 분석해서 "수지" 팀의 경기 일정을 추출해줘.
    
    [표 구조 분석 지침]
    1. 표의 가장 왼쪽 열(First Column)에 날짜(예: "1월 4일", "2월 1일" 등)가 적혀있다.
    2. 표의 최상단 행(Header Row)에 구장 장소(예: 수지체육공원, 상현레스피아, 죽전아르피아 등)와 시간(예: 08:00~12:00)이 적혀있다.
    3. 전체 표에서 "수지" (또는 수지A, 수지B)라는 글자가 포함된 셀을 모두 찾아라.
    4. 각 "수지" 팀 셀에 대해:
       - 해당 셀의 **행(Row)**을 왼쪽으로 따라가서 날짜를 추출해라.
       - 해당 셀의 **열(Column)**을 위쪽으로 따라가서 장소와 시간을 추출해라.
       - 같은 셀(또는 같은 시간대 블록)에 있는 다른 팀 이름들을 찾아 상대팀으로 정의해라.
    
    [출력 데이터 형식]
    - date: "M월 D일" 형식 (예: 1월 4일) - 반드시 표 왼쪽 열의 날짜를 그대로 쓸 것.
    - venue: 구장 이름 (예: 수지체육공원)
    - time: 시간 범위 (예: 08:00~12:00)
    - opponents: 상대팀 목록 (쉼표로 구분)

    반드시 아래 JSON 배열 형식으로만 응답해:
    [{"date": "1월 4일", "venue": "상현레스피아", "time": "08:00~12:00", "opponents": "상현, 다솜"}]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING },
              venue: { type: Type.STRING },
              time: { type: Type.STRING },
              opponents: { type: Type.STRING },
            },
            required: ["date", "venue", "time", "opponents"],
          },
        },
      }
    });

    const text = response.text || "[]";
    return JSON.parse(text) as MatchSchedule[];
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
