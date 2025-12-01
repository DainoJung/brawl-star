'use client';

import { useState, useRef, useEffect } from 'react';
import BottomNavigation from '@/components/base/BottomNavigation';
import { sendChatMessage } from '@/services/api';

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
      // 실제 API 호출
      const response = await sendChatMessage(text, TEMP_USER_ID);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
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

  const handleVoiceInput = () => {
    setIsListening(!isListening);
    // 실제 구현에서는 Web Speech API 사용
    if (!isListening) {
      // 음성 인식 시작
      setTimeout(() => {
        setIsListening(false);
        // 시뮬레이션: 음성 인식 결과
        setInputText('이 약은 식전인가요?');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="pt-6 px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">AI 복약 도우미</h1>
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
            className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            <i className={`${isListening ? 'ri-stop-line' : 'ri-mic-line'} text-lg`}></i>
          </button>
        </div>

        {isListening && (
          <p className="text-center text-sm text-red-500 mt-2">
            🎤 듣고 있습니다... 말씀해주세요
          </p>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}
