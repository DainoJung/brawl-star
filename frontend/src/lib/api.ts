const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// OCR API - 처방전 이미지 분석
export async function analyzePrescription(imageFile: File): Promise<{
  success: boolean;
  medicines: Array<{
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    timing: string;
    confidence: number;
    originalText: string;
    status: 'auto' | 'check' | 'review';
    warning?: string;
  }>;
  warnings: Array<{
    drug1: string;
    drug2: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
  }>;
  raw_text?: string;
}> {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch(`${API_BASE_URL}/api/ocr/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to analyze prescription');
  }

  return response.json();
}

// 약물 상호작용 분석
export async function checkDrugInteractions(
  newMedicines: string[],
  existingMedicines: string[]
): Promise<{
  success: boolean;
  interactions: Array<{
    drug1: string;
    drug2: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
  }>;
}> {
  const response = await fetch(`${API_BASE_URL}/api/ai/check-interactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      new_medicines: newMedicines,
      existing_medicines: existingMedicines,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to check drug interactions');
  }

  return response.json();
}

// 챗봇 API
export async function sendChatMessage(
  message: string,
  userId: string,
  context?: { medicines: string[] }
): Promise<{
  success: boolean;
  message: string;
  suggestions?: string[];
}> {
  const response = await fetch(`${API_BASE_URL}/api/chat/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      user_id: userId,
      context,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send chat message');
  }

  return response.json();
}

// 스케줄 자동 생성
export async function generateSchedule(
  medicines: Array<{
    name: string;
    frequency: string;
    timing: string;
  }>
): Promise<{
  success: boolean;
  schedules: Array<{
    medicine_name: string;
    times: string[];
  }>;
}> {
  const response = await fetch(`${API_BASE_URL}/api/ai/generate-schedule`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ medicines }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate schedule');
  }

  return response.json();
}

// 음성 인식 (STT)
export async function transcribeAudio(audioBlob: Blob): Promise<{
  success: boolean;
  text: string;
}> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'audio.webm');

  const response = await fetch(`${API_BASE_URL}/api/stt/transcribe`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to transcribe audio');
  }

  return response.json();
}
