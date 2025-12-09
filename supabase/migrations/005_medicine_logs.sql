-- 복용 기록 테이블 생성
CREATE TABLE IF NOT EXISTS medicine_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    medicine_id UUID REFERENCES medicines(id) ON DELETE SET NULL,
    medicine_name TEXT NOT NULL,
    scheduled_time TEXT NOT NULL,
    taken_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('taken', 'skipped', 'missed')),
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS medicine_logs_user_id_idx ON medicine_logs(user_id);
CREATE INDEX IF NOT EXISTS medicine_logs_taken_at_idx ON medicine_logs(taken_at);

-- RLS 비활성화 (프론트엔드에서 임시 사용자 ID로 접근)
ALTER TABLE medicine_logs DISABLE ROW LEVEL SECURITY;

-- 코멘트
COMMENT ON TABLE medicine_logs IS '약 복용 기록';
COMMENT ON COLUMN medicine_logs.scheduled_time IS '예정 복용 시간 (HH:MM)';
COMMENT ON COLUMN medicine_logs.taken_at IS '실제 복용 시간';
COMMENT ON COLUMN medicine_logs.status IS '복용 상태: taken(복용), skipped(건너뜀), missed(놓침)';
