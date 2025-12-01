import google.generativeai as genai
from PIL import Image
import io
import json
import uuid
from typing import Optional
from app.core.config import settings
from app.schemas.medicine import MedicineResult, DrugInteraction

# Configure Gemini
genai.configure(api_key=settings.GOOGLE_API_KEY)


class GeminiService:
    def __init__(self):
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
        self.vision_model = genai.GenerativeModel(settings.GEMINI_MODEL)

    async def analyze_prescription_image(self, image_data: bytes) -> dict:
        """
        처방전 이미지를 분석하여 약물 정보를 추출합니다.
        """
        try:
            # 이미지 로드
            image = Image.open(io.BytesIO(image_data))

            # OCR 및 약물 정보 추출 프롬프트
            prompt = """
            이 처방전 이미지를 분석하여 약물 정보를 JSON 형식으로 추출해주세요.

            다음 형식으로 응답해주세요:
            {
                "medicines": [
                    {
                        "name": "약 이름 (예: 암로디핀정 5mg)",
                        "dosage": "용량 (예: 1정)",
                        "frequency": "복용 횟수 (예: 1일 1회)",
                        "timing": "복용 시기 (식전 또는 식후)",
                        "confidence": 인식 신뢰도 (0-100 사이 숫자),
                        "originalText": "원본에서 읽은 텍스트"
                    }
                ],
                "raw_text": "처방전에서 읽은 전체 텍스트"
            }

            주의사항:
            1. 약 이름은 가능한 정확하게 추출하되, 불확실하면 confidence를 낮게 설정해주세요.
            2. 용량, 복용 횟수, 복용 시기를 명확히 구분해주세요.
            3. 한글로 응답해주세요.
            4. JSON 형식만 응답해주세요. 다른 텍스트는 포함하지 마세요.
            """

            response = self.vision_model.generate_content([prompt, image])

            # JSON 파싱
            response_text = response.text.strip()
            # JSON 블록 추출 (```json ... ``` 형식 처리)
            if response_text.startswith("```"):
                lines = response_text.split("\n")
                json_lines = []
                in_json = False
                for line in lines:
                    if line.startswith("```json"):
                        in_json = True
                        continue
                    elif line.startswith("```"):
                        in_json = False
                        continue
                    if in_json:
                        json_lines.append(line)
                response_text = "\n".join(json_lines)

            result = json.loads(response_text)

            # MedicineResult 형식으로 변환
            medicines = []
            for med in result.get("medicines", []):
                confidence = med.get("confidence", 50)
                status = "auto" if confidence >= 85 else "check" if confidence >= 60 else "review"
                medicines.append(MedicineResult(
                    id=str(uuid.uuid4()),
                    name=med.get("name", ""),
                    dosage=med.get("dosage", ""),
                    frequency=med.get("frequency", ""),
                    timing=med.get("timing", "식후"),
                    confidence=confidence,
                    originalText=med.get("originalText", ""),
                    status=status,
                    warning=None
                ))

            return {
                "success": True,
                "medicines": medicines,
                "raw_text": result.get("raw_text", "")
            }

        except json.JSONDecodeError as e:
            return {
                "success": False,
                "medicines": [],
                "raw_text": "",
                "error": f"JSON 파싱 오류: {str(e)}"
            }
        except Exception as e:
            return {
                "success": False,
                "medicines": [],
                "raw_text": "",
                "error": str(e)
            }

    async def check_drug_interactions(
        self,
        new_medicines: list[str],
        existing_medicines: list[str]
    ) -> list[DrugInteraction]:
        """
        신규 약물과 기존 약물 간의 상호작용을 분석합니다.
        """
        try:
            prompt = f"""
            다음 약물들 간의 상호작용을 분석해주세요.

            신규 약물: {', '.join(new_medicines)}
            기존 복용 약물: {', '.join(existing_medicines)}

            다음 JSON 형식으로 응답해주세요:
            {{
                "interactions": [
                    {{
                        "drug1": "약물1 이름",
                        "drug2": "약물2 이름",
                        "severity": "high/medium/low",
                        "description": "상호작용 설명 (한글로)"
                    }}
                ]
            }}

            주의사항:
            1. 실제 의학적으로 알려진 상호작용만 포함해주세요.
            2. severity는 high(병용금기), medium(주의), low(경미)로 구분해주세요.
            3. 상호작용이 없으면 빈 배열을 반환해주세요.
            4. JSON 형식만 응답해주세요.
            """

            response = self.model.generate_content(prompt)

            # JSON 파싱
            response_text = response.text.strip()
            if response_text.startswith("```"):
                lines = response_text.split("\n")
                json_lines = []
                in_json = False
                for line in lines:
                    if line.startswith("```json") or line.startswith("```"):
                        in_json = not in_json
                        continue
                    if in_json:
                        json_lines.append(line)
                response_text = "\n".join(json_lines)

            result = json.loads(response_text)

            interactions = []
            for interaction in result.get("interactions", []):
                interactions.append(DrugInteraction(
                    drug1=interaction.get("drug1", ""),
                    drug2=interaction.get("drug2", ""),
                    severity=interaction.get("severity", "low"),
                    description=interaction.get("description", "")
                ))

            return interactions

        except Exception as e:
            print(f"Drug interaction check error: {str(e)}")
            return []

    async def generate_schedule(self, medicines: list[dict]) -> list[dict]:
        """
        약물 정보를 기반으로 최적의 복용 스케줄을 생성합니다.
        """
        try:
            medicines_info = json.dumps(medicines, ensure_ascii=False)

            prompt = f"""
            다음 약물들의 최적 복용 스케줄을 생성해주세요.

            약물 정보:
            {medicines_info}

            다음 JSON 형식으로 응답해주세요:
            {{
                "schedules": [
                    {{
                        "medicine_name": "약물 이름",
                        "times": ["08:00", "20:00"]
                    }}
                ]
            }}

            고려사항:
            1. 식전 약은 식사 30분 전 시간으로 설정
            2. 식후 약은 식사 직후 시간으로 설정
            3. 1일 1회는 아침, 1일 2회는 아침/저녁, 1일 3회는 아침/점심/저녁으로 배정
            4. 기본 식사 시간: 아침 08:00, 점심 12:00, 저녁 18:00
            5. JSON 형식만 응답해주세요.
            """

            response = self.model.generate_content(prompt)

            response_text = response.text.strip()
            if response_text.startswith("```"):
                lines = response_text.split("\n")
                json_lines = []
                in_json = False
                for line in lines:
                    if line.startswith("```json") or line.startswith("```"):
                        in_json = not in_json
                        continue
                    if in_json:
                        json_lines.append(line)
                response_text = "\n".join(json_lines)

            result = json.loads(response_text)
            return result.get("schedules", [])

        except Exception as e:
            print(f"Schedule generation error: {str(e)}")
            return []

    async def chat_response(
        self,
        message: str,
        context: Optional[dict] = None
    ) -> dict:
        """
        사용자 질문에 대한 AI 응답을 생성합니다.
        """
        try:
            context_info = ""
            if context and context.get("medicines"):
                context_info = f"\n\n사용자가 현재 복용 중인 약: {', '.join(context['medicines'])}"

            prompt = f"""
            당신은 복약 관리 AI 어시스턴트입니다. 사용자의 약물 관련 질문에 친절하고 정확하게 답변해주세요.
            {context_info}

            사용자 질문: {message}

            다음 JSON 형식으로 응답해주세요:
            {{
                "message": "답변 내용 (한글로, 200자 이내)",
                "suggestions": ["후속 질문 제안1", "후속 질문 제안2"]
            }}

            주의사항:
            1. 의학적 조언은 일반적인 정보만 제공하고, 전문가 상담을 권유하세요.
            2. 친근하고 이해하기 쉬운 언어를 사용하세요.
            3. 응급 상황 징후가 있으면 즉시 병원 방문을 권유하세요.
            4. JSON 형식만 응답해주세요.
            """

            response = self.model.generate_content(prompt)

            response_text = response.text.strip()
            if response_text.startswith("```"):
                lines = response_text.split("\n")
                json_lines = []
                in_json = False
                for line in lines:
                    if line.startswith("```json") or line.startswith("```"):
                        in_json = not in_json
                        continue
                    if in_json:
                        json_lines.append(line)
                response_text = "\n".join(json_lines)

            result = json.loads(response_text)

            return {
                "success": True,
                "message": result.get("message", "죄송합니다. 답변을 생성하지 못했습니다."),
                "suggestions": result.get("suggestions", [])
            }

        except Exception as e:
            return {
                "success": False,
                "message": "죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요.",
                "suggestions": []
            }


# 싱글톤 인스턴스
gemini_service = GeminiService()
