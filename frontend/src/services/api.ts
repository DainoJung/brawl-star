const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Chat API
export async function sendChatMessage(message: string, userId: string): Promise<{ success: boolean; message: string; suggestions?: string[] }> {
  const response = await fetch(`${API_URL}/api/chat/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      user_id: userId,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send chat message');
  }

  return response.json();
}

// OCR API
export async function analyzePresciption(imageBase64: string): Promise<{
  medicines: Array<{
    name: string;
    dosage: string;
    frequency: string;
    timing: string;
    times: string[];
    days?: string[];
    confidence?: number;
    original_text?: string;
    warning?: string;
  }>;
  raw_text?: string;
}> {
  const response = await fetch(`${API_URL}/api/ocr/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: imageBase64,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to analyze prescription');
  }

  return response.json();
}

// Drug Interaction Check API
export async function checkDrugInteractions(medicineNames: string[]): Promise<{
  interactions: Array<{
    drugs: string[];
    severity: string;
    description: string;
    recommendation: string;
  }>;
  safe: boolean;
}> {
  const response = await fetch(`${API_URL}/api/interaction/check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      medicine_names: medicineNames,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to check drug interactions');
  }

  return response.json();
}

// Schedule Generation API
export async function generateSchedule(medicines: Array<{
  name: string;
  frequency: string;
  timing: string;
  times: string[];
  days?: string[];
}>): Promise<{
  schedules: Array<{
    medicine_name: string;
    time: string;
    day: string;
    timing: string;
  }>;
}> {
  const response = await fetch(`${API_URL}/api/schedule/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      medicines,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate schedule');
  }

  return response.json();
}
