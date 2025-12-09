-- Push subscriptions RLS 정책 수정
-- Service role이 제대로 작동하도록 수정

-- 기존 정책들 삭제
DROP POLICY IF EXISTS "Users can view own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can insert own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can update own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Service role can do everything" ON push_subscriptions;

-- RLS 비활성화 (서버 백엔드에서만 접근하므로 RLS 불필요)
ALTER TABLE push_subscriptions DISABLE ROW LEVEL SECURITY;

-- 또는 모든 접근 허용하는 정책 생성 (RLS 활성화 유지 시)
-- ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all operations" ON push_subscriptions FOR ALL USING (true) WITH CHECK (true);
