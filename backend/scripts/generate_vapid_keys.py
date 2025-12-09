#!/usr/bin/env python3
"""
VAPID 키 생성 스크립트
Web Push 알림을 위한 공개키/비공개키 쌍을 생성합니다.

사용법:
    python scripts/generate_vapid_keys.py

생성된 키를 .env 파일에 추가하세요:
    VAPID_PUBLIC_KEY=생성된_공개키
    VAPID_PRIVATE_KEY=생성된_비공개키
"""

from py_vapid import Vapid


def generate_vapid_keys():
    """VAPID 키 쌍 생성"""
    vapid = Vapid()
    vapid.generate_keys()

    print("=" * 60)
    print("VAPID Keys Generated Successfully!")
    print("=" * 60)
    print()
    print("Add these to your .env file:")
    print()
    print(f"VAPID_PUBLIC_KEY={vapid.public_key}")
    print(f"VAPID_PRIVATE_KEY={vapid.private_key}")
    print()
    print("=" * 60)
    print()
    print("For frontend (applicationServerKey):")
    print(f"{vapid.public_key}")
    print()


if __name__ == "__main__":
    generate_vapid_keys()
