"""
알람 스케줄러 서비스
- 매분 실행되어 알람 시간을 체크하고 Push 알림 발송
"""
from datetime import datetime
from typing import Optional
import asyncio

from app.core.supabase import get_supabase_admin
from app.api.endpoints.push import send_push_to_user


class AlarmScheduler:
    """알람 스케줄러"""

    def __init__(self):
        self.is_running = False
        self._task: Optional[asyncio.Task] = None

    async def start(self):
        """스케줄러 시작"""
        if self.is_running:
            print("[AlarmScheduler] 이미 실행 중입니다.")
            return

        self.is_running = True
        print("[AlarmScheduler] 스케줄러 시작")
        self._task = asyncio.create_task(self._run_loop())

    async def stop(self):
        """스케줄러 중지"""
        self.is_running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        print("[AlarmScheduler] 스케줄러 중지")

    async def _run_loop(self):
        """매분 실행되는 루프"""
        while self.is_running:
            try:
                # 다음 정각까지 대기
                now = datetime.now()
                seconds_until_next_minute = 60 - now.second
                await asyncio.sleep(seconds_until_next_minute)

                # 알람 체크 및 발송
                await self.check_and_send_alarms()

            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[AlarmScheduler] 루프 오류: {e}")
                await asyncio.sleep(60)  # 오류 시 1분 대기

    async def check_and_send_alarms(self):
        """현재 시간의 알람 체크 및 Push 발송"""
        now = datetime.now()
        current_time = now.strftime("%H:%M")
        current_day = ['일', '월', '화', '수', '목', '금', '토'][now.weekday() + 1 if now.weekday() < 6 else 0]

        # Python의 weekday()는 월요일=0, 일요일=6
        # 한국어 요일 배열과 맞추기 위해 조정
        weekday_map = {0: '월', 1: '화', 2: '수', 3: '목', 4: '금', 5: '토', 6: '일'}
        current_day = weekday_map[now.weekday()]

        print(f"[AlarmScheduler] 알람 체크: {current_time} ({current_day})")

        supabase = get_supabase_admin()

        try:
            # 현재 시간에 해당하는 약물 조회
            # medicines 테이블에서 times 배열에 현재 시간이 포함되고,
            # days 배열에 현재 요일이 포함된 것들 조회
            medicines_result = supabase.table("medicines").select("*").execute()

            if not medicines_result.data:
                return

            # 사용자별로 알림 발송할 약물 그룹화
            user_medicines = {}

            for medicine in medicines_result.data:
                # times 배열에 현재 시간이 포함되는지 확인
                times = medicine.get("times", [])
                if current_time not in times:
                    continue

                # days 배열에 현재 요일이 포함되는지 확인
                days = medicine.get("days", [])
                # days가 비어있으면 매일로 간주
                if days and current_day not in days:
                    continue

                user_id = medicine.get("user_id")
                if not user_id:
                    continue

                if user_id not in user_medicines:
                    user_medicines[user_id] = []
                user_medicines[user_id].append(medicine)

            # 각 사용자에게 Push 발송
            for user_id, medicines in user_medicines.items():
                medicine_names = [m["name"] for m in medicines]
                timing_text = self._get_timing_text(medicines[0].get("timing", ""))

                title = "💊 복약 시간입니다!"
                body = f"{current_time} {timing_text}\n{', '.join(medicine_names)}"

                result = await send_push_to_user(
                    user_id=user_id,
                    title=title,
                    body=body,
                    data={
                        "type": "alarm",
                        "time": current_time,
                        "medicines": medicine_names,
                        "medicine_ids": [m["id"] for m in medicines]
                    },
                    tag=f"alarm-{current_time}-{user_id}"
                )

                print(f"[AlarmScheduler] {user_id}: {len(medicine_names)}개 약 알림 발송 "
                      f"(성공: {result['sent']}, 실패: {result['failed']})")

        except Exception as e:
            print(f"[AlarmScheduler] 알람 체크 오류: {e}")

    def _get_timing_text(self, timing: str) -> str:
        """복용 시기 텍스트 변환"""
        timing_map = {
            "before_meal": "식전",
            "after_meal": "식후",
            "anytime": ""
        }
        return timing_map.get(timing, "")


# 싱글톤 인스턴스
alarm_scheduler = AlarmScheduler()
