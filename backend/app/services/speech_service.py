import base64
import tempfile
import os
from typing import Optional
from openai import OpenAI
from app.core.config import settings

# Configure OpenAI
client = OpenAI(api_key=settings.OPENAI_API_KEY)


class SpeechService:
    """
    OpenAI를 활용한 음성 서비스
    - STT: OpenAI Whisper API 사용
    - TTS: OpenAI TTS API 사용
    """

    def __init__(self):
        self.stt_model = "whisper-1"
        self.tts_model = "tts-1"
        self.tts_voice = "echo"  # alloy, echo, fable, onyx, nova, shimmer
        self.tts_speed = 1.15  # 0.25 ~ 4.0 (기본 1.0)

    async def speech_to_text(self, audio_data: bytes, mime_type: str = "audio/webm") -> dict:
        """
        음성 데이터를 텍스트로 변환합니다.
        OpenAI Whisper API를 활용합니다.
        """
        try:
            print(f"STT 요청 - 오디오 크기: {len(audio_data)} bytes, MIME: {mime_type}")

            # MIME 타입에 따른 파일 확장자 결정
            extension_map = {
                "audio/webm": ".webm",
                "audio/mp4": ".mp4",
                "audio/mpeg": ".mp3",
                "audio/wav": ".wav",
                "audio/ogg": ".ogg",
            }
            extension = extension_map.get(mime_type, ".webm")

            # 임시 파일로 저장
            with tempfile.NamedTemporaryFile(suffix=extension, delete=False) as temp_file:
                temp_file.write(audio_data)
                temp_file_path = temp_file.name

            try:
                # OpenAI Whisper API 호출
                with open(temp_file_path, "rb") as audio_file:
                    transcript = client.audio.transcriptions.create(
                        model=self.stt_model,
                        file=audio_file,
                        language="ko"  # 한국어 지정
                    )

                text = transcript.text.strip() if transcript.text else ""
                print(f"인식된 텍스트: {text}")

                # 빈 응답 처리
                if not text:
                    return {
                        "success": False,
                        "text": "",
                        "error": "음성을 인식하지 못했습니다."
                    }

                return {
                    "success": True,
                    "text": text,
                    "confidence": 0.95  # Whisper는 confidence를 제공하지 않으므로 고정값 사용
                }

            finally:
                # 임시 파일 삭제
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)

        except Exception as e:
            import traceback
            print(f"STT Error: {str(e)}")
            print(traceback.format_exc())
            return {
                "success": False,
                "text": "",
                "error": str(e)
            }

    async def text_to_speech(self, text: str, language: str = "ko-KR") -> dict:
        """
        텍스트를 음성으로 변환합니다.
        OpenAI TTS API를 활용합니다.
        """
        try:
            print(f"TTS 요청 - 텍스트: {text[:50]}...")

            # OpenAI TTS API 호출
            response = client.audio.speech.create(
                model=self.tts_model,
                voice=self.tts_voice,
                input=text,
                speed=self.tts_speed,
                response_format="mp3"
            )

            # 오디오 데이터를 Base64로 인코딩
            audio_data = response.content
            audio_base64 = base64.b64encode(audio_data).decode("utf-8")

            print(f"TTS 성공 - 오디오 크기: {len(audio_data)} bytes")

            return {
                "success": True,
                "use_browser_tts": False,
                "text": text,
                "language": language,
                "audio": audio_base64,
                "mime_type": "audio/mpeg",
                "message": "OpenAI TTS로 생성된 음성입니다."
            }

        except Exception as e:
            import traceback
            print(f"TTS Error: {str(e)}")
            print(traceback.format_exc())
            # 실패 시 브라우저 TTS 폴백
            return {
                "success": True,
                "use_browser_tts": True,
                "text": text,
                "language": language,
                "audio": None,
                "message": f"TTS 오류로 브라우저 음성을 사용합니다: {str(e)}"
            }


# 싱글톤 인스턴스
speech_service = SpeechService()
