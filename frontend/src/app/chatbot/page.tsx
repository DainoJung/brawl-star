'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import BottomNavigation from '@/components/base/BottomNavigation';
import { sendChatMessage, speechToText, textToSpeech } from '@/services/api';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// Temporary user ID for development
const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001';

export default function ChatbotPage() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '안녕하세요! 복약에 대해 궁금한 점이 있으시면 언제든 물어보세요. 😊',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  const quickQuestions = [
    '이 약은 식전인가요?',
    '졸음이 올 수 있나요?',
    '다른 약과 함께 먹어도 되나요?',
    '부작용이 있나요?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // TTS: 텍스트를 음성으로 읽기 (OpenAI TTS 사용)
  const speakText = useCallback(async (text: string) => {
    if (!ttsEnabled || typeof window === 'undefined') return;

    try {
      // OpenAI TTS API 호출
      const result = await textToSpeech(text);

      if (result.success && result.audio && !result.use_browser_tts) {
        // 서버에서 받은 오디오 재생
        const audioData = `data:${result.mime_type || 'audio/mpeg'};base64,${result.audio}`;
        const audio = new Audio(audioData);
        audio.play();
      } else {
        // 폴백: 브라우저 TTS 사용
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ko-KR';
        utterance.rate = 0.9;
        utterance.pitch = 1;

        const voices = window.speechSynthesis.getVoices();
        const koreanVoice = voices.find(voice => voice.lang.includes('ko'));
        if (koreanVoice) {
          utterance.voice = koreanVoice;
        }

        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('TTS 오류:', error);
      // 오류 시 브라우저 TTS 폴백
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }, [ttsEnabled]);

  // 음성 목록 로드 (TTS용)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(text, TEMP_USER_ID);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);

      // TTS로 응답 읽기
      speakText(response.message);
    } catch (error) {
      console.error('Chat API error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: '죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // STT: 음성 녹음 시작
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 지원되는 MIME 타입 확인
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // 스트림 정리
        stream.getTracks().forEach(track => track.stop());

        // 오디오 데이터 처리
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType.split(';')[0] });
        await processVoiceInput(audioBlob, mimeType.split(';')[0]);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsListening(true);

    } catch (error) {
      console.error('마이크 접근 오류:', error);
      alert('마이크에 접근할 수 없습니다. 마이크 권한을 확인해주세요.');
    }
  };

  // STT: 음성 녹음 중지
  const stopRecording = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  // STT: 음성 데이터를 텍스트로 변환
  const processVoiceInput = async (audioBlob: Blob, mimeType: string) => {
    setIsProcessingVoice(true);

    try {
      // Blob을 Base64로 변환
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(audioBlob);

      const base64Audio = await base64Promise;

      console.log(`음성 데이터 전송 - 크기: ${audioBlob.size} bytes, MIME: ${mimeType}`);

      // API 호출
      const result = await speechToText(base64Audio, mimeType);

      console.log('STT 결과:', result);

      if (result.success && result.text) {
        setInputText(result.text);
        // 자동으로 메시지 전송
        handleSendMessage(result.text);
      } else {
        alert(result.error || '음성을 인식하지 못했습니다. 다시 시도해주세요.');
      }

    } catch (error) {
      console.error('음성 처리 오류:', error);
      alert('음성 처리 중 오류가 발생했습니다. 서버 연결을 확인해주세요.');
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // 음성 입력 토글
  const handleVoiceInput = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="pt-6 px-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">AI 복약 도우미</h1>
          {/* TTS 토글 버튼 */}
          <button
            onClick={() => {
              setTtsEnabled(!ttsEnabled);
              if (ttsEnabled) {
                window.speechSynthesis.cancel();
              }
            }}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              ttsEnabled
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            <i className={`${ttsEnabled ? 'ri-volume-up-line' : 'ri-volume-mute-line'} text-lg`}></i>
            <span className="text-sm font-medium">{ttsEnabled ? '음성 ON' : '음성 OFF'}</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 pb-40 px-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!message.isUser && (
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                  <i className="ri-robot-line text-white text-lg"></i>
                </div>
              )}
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                  message.isUser
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                <p className="text-base leading-relaxed">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.isUser ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                <i className="ri-robot-line text-white text-lg"></i>
              </div>
              <div className="bg-white px-4 py-3 rounded-2xl border border-gray-200">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Questions */}
        {messages.length === 1 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              자주 묻는 질문
            </h3>
            <div className="space-y-2">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSendMessage(question)}
                  className="w-full text-left p-4 bg-white rounded-xl border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                >
                  <span className="text-base text-gray-700">{question}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
              placeholder="궁금한 점을 입력하세요..."
              disabled={isLoading}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base disabled:bg-gray-100"
            />
            <button
              onClick={() => handleSendMessage(inputText)}
              disabled={isLoading || !inputText.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
            >
              <i className="ri-send-plane-line text-sm"></i>
            </button>
          </div>
          <button
            onClick={handleVoiceInput}
            disabled={isProcessingVoice || isLoading}
            className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : isProcessingVoice
                  ? 'bg-blue-300 text-white cursor-not-allowed'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed'
            }`}
          >
            <i className={`${
              isProcessingVoice
                ? 'ri-loader-4-line animate-spin'
                : isListening
                  ? 'ri-stop-line'
                  : 'ri-mic-line'
            } text-lg`}></i>
          </button>
        </div>

        {isListening && (
          <p className="text-center text-sm text-red-500 mt-2 animate-pulse">
            🎤 듣고 있습니다... 말씀이 끝나면 버튼을 다시 눌러주세요
          </p>
        )}

        {isProcessingVoice && (
          <p className="text-center text-sm text-blue-500 mt-2">
            ⏳ 음성을 분석하고 있습니다...
          </p>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}
