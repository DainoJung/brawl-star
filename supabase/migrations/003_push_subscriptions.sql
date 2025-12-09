-- Push 구독 테이블 생성
-- iOS PWA 백그라운드 알림을 위한 Web Push 구독 정보 저장

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Push 구독 정보 (Web Push API)
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,

    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS push_subscriptions_endpoint_idx ON push_subscriptions(endpoint);

-- RLS 정책 활성화
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 구독만 조회/수정 가능
CREATE POLICY "Users can view own push subscriptions"
    ON push_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions"
    ON push_subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push subscriptions"
    ON push_subscriptions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions"
    ON push_subscriptions FOR DELETE
    USING (auth.uid() = user_id);

-- 서비스 역할은 모든 작업 허용 (백엔드 스케줄러용)
CREATE POLICY "Service role can do everything"
    ON push_subscriptions FOR ALL
    USING (auth.role() = 'service_role');

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER push_subscriptions_updated_at
    BEFORE UPDATE ON push_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_push_subscriptions_updated_at();

-- 코멘트
COMMENT ON TABLE push_subscriptions IS 'Web Push 알림 구독 정보';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'Push 서비스 엔드포인트 URL';
COMMENT ON COLUMN push_subscriptions.p256dh IS 'P-256 ECDH 공개키 (Base64 URL-safe)';
COMMENT ON COLUMN push_subscriptions.auth IS '인증 시크릿 (Base64 URL-safe)';
