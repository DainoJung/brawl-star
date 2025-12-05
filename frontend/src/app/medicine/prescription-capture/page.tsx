'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TopHeader from '@/components/base/TopHeader';
import { useMedicineStore } from '@/store/medicine';

export default function PrescriptionCapturePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const { setOcrResults } = useMedicineStore();

  // 카메라 스트림 시작
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // 후면 카메라 우선
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setShowCameraModal(true);
    } catch (error) {
      console.error('Camera access error:', error);
      setCameraError('카메라에 접근할 수 없습니다. 권한을 허용해주세요.');
      // 카메라 접근 실패 시 파일 선택으로 대체
      cameraInputRef.current?.click();
    }
  }, []);

  // 카메라 스트림 중지
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCameraModal(false);
  }, [stream]);

  // 사진 촬영
  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        // 이미지 데이터 URL 생성
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageDataUrl);

        // File 객체로 변환
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'prescription.jpg', { type: 'image/jpeg' });
            setCapturedFile(file);
          }
        }, 'image/jpeg', 0.9);

        stopCamera();
        setShowPreviewModal(true);
      }
    }
  }, [stopCamera]);

  // 파일 선택 처리
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 이미지 미리보기 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
        setCapturedFile(file);
        setShowPreviewModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // 카메라 입력 처리 (모바일)
  const handleCameraInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
        setCapturedFile(file);
        setShowPreviewModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // 카메라 버튼 클릭
  const handleCameraClick = () => {
    // 모바일 기기 감지
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      // 모바일에서는 카메라 input 사용
      cameraInputRef.current?.click();
    } else {
      // 데스크톱에서는 getUserMedia 사용
      startCamera();
    }
  };

  // 이미지 제출 (분석 요청)
  const handleSubmitImage = async () => {
    if (!capturedFile) return;

    setIsUploading(true);
    setShowPreviewModal(false);

    try {
      // 이미지를 store에 저장 (처리 페이지에서 사용)
      localStorage.setItem('prescriptionImage', capturedImage || '');

      // 실제 API 호출
      const formData = new FormData();
      formData.append('image', capturedFile);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/ocr/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setOcrResults(result.medicines);
        router.push('/medicine/prescription-result');
      } else {
        // API 오류 시 시뮬레이션 모드로 진행
        console.warn('API not available, using simulation mode');
        router.push('/medicine/prescription-processing');
      }
    } catch (error) {
      console.error('Failed to analyze prescription:', error);
      // 오류 시에도 시뮬레이션 모드로 진행
      router.push('/medicine/prescription-processing');
    } finally {
      setIsUploading(false);
    }
  };

  // 다시 촬영
  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedFile(null);
    setShowPreviewModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <TopHeader
        title="처방전 추가"
        showBack
        onBack={() => router.push('/medicine')}
      />

      <div className="pt-20 pb-8 px-5">
        {/* 안내 문구 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
          <div className="text-center mb-6">
            {/* 예시 이미지 */}
            
              <h3 className="text-lg font-semibold text-gray-900 mb-4">촬영 예시</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="relative">
                  <img
                    src="/clean.jpg"
                    alt="선명한 처방전 예시"
                    className="w-full h-48 object-cover rounded-xl border-2 border-green-400"
                  />
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
                    <i className="ri-check-line"></i>
                    <span>좋아요</span>
                  </div>
                </div>
                <div className="relative">
                  <img
                    src="/blur.jpg"
                    alt="흐린 처방전 예시"
                    className="w-full h-48 object-cover rounded-xl border-2 border-red-400 opacity-60"
                  />
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
                    <i className="ri-close-line"></i>
                    <span>안돼요</span>
                  </div>
                </div>
              </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              처방전을 전체가 보이게<br />촬영해주세요
            </h2>
          </div>

          {/* 촬영 가이드 */}
          <div className="bg-blue-50 rounded-xl p-5 space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 flex items-center justify-center bg-blue-500 rounded-full flex-shrink-0 mt-0.5">
                <i className="ri-check-line text-sm text-white"></i>
              </div>
              <p className="text-base text-gray-700 flex-1">
                <span className="font-semibold">글자가 선명하게</span> 보이도록 촬영
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 flex items-center justify-center bg-blue-500 rounded-full flex-shrink-0 mt-0.5">
                <i className="ri-check-line text-sm text-white"></i>
              </div>
              <p className="text-base text-gray-700 flex-1">
                <span className="font-semibold">빛 반사가 적게</span> 촬영
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 flex items-center justify-center bg-blue-500 rounded-full flex-shrink-0 mt-0.5">
                <i className="ri-check-line text-sm text-white"></i>
              </div>
              <p className="text-base text-gray-700 flex-1">
                <span className="font-semibold">처방전 전체가</span> 화면에 들어오도록
              </p>
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {cameraError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <p className="text-red-700 text-sm">{cameraError}</p>
          </div>
        )}

        {/* 촬영/선택 버튼 */}
        <div className="space-y-4">
          {/* 카메라 촬영 버튼 */}
          <button
            onClick={handleCameraClick}
            disabled={isUploading}
            className="w-full h-20 bg-blue-600 text-white rounded-2xl font-bold text-xl shadow-lg hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
          >
            <i className="ri-camera-line text-3xl"></i>
            <span>카메라로 촬영하기</span>
          </button>

          {/* 숨겨진 카메라 input (모바일용) */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraInput}
            className="hidden"
          />

          {/* 앨범 선택 버튼 */}
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              id="file-upload"
              disabled={isUploading}
            />
            <label
              htmlFor="file-upload"
              className={`w-full h-20 bg-white border-2 border-blue-600 text-blue-600 rounded-2xl font-bold text-xl shadow-sm hover:bg-blue-50 active:scale-[0.98] transition-all flex items-center justify-center space-x-3 cursor-pointer ${isUploading ? 'opacity-50' : ''}`}
            >
              <i className="ri-image-line text-3xl"></i>
              <span>{isUploading ? '업로드 중...' : '앨범에서 선택하기'}</span>
            </label>
          </div>
        </div>
      </div>

      {/* 카메라 모달 (데스크톱용) */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* 카메라 헤더 */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={stopCamera}
                className="w-12 h-12 flex items-center justify-center bg-white/20 rounded-full text-white"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
              <span className="text-white font-semibold">처방전 촬영</span>
              <div className="w-12"></div>
            </div>
          </div>

          {/* 비디오 미리보기 */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="flex-1 object-cover"
          />

          {/* 촬영 가이드 오버레이 */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[85%] h-[60%] border-2 border-white/50 rounded-2xl">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full">
                <span className="text-white text-sm">처방전을 이 영역에 맞춰주세요</span>
              </div>
            </div>
          </div>

          {/* 촬영 버튼 */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-8">
            <div className="flex items-center justify-center">
              <button
                onClick={capturePhoto}
                className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              >
                <div className="w-16 h-16 bg-white border-4 border-gray-300 rounded-full"></div>
              </button>
            </div>
          </div>

          {/* 숨겨진 캔버스 (캡처용) */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* 이미지 미리보기 모달 */}
      {showPreviewModal && capturedImage && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* 헤더 */}
          <div className="bg-black p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={handleRetake}
                className="text-white font-semibold"
              >
                다시 촬영
              </button>
              <span className="text-white font-semibold">미리보기</span>
              <div className="w-16"></div>
            </div>
          </div>

          {/* 이미지 미리보기 */}
          <div className="flex-1 flex items-center justify-center p-4 bg-black">
            <img
              src={capturedImage}
              alt="촬영된 처방전"
              className="max-w-full max-h-full object-contain rounded-xl"
            />
          </div>

          {/* 하단 버튼 */}
          <div className="bg-black p-6 space-y-3">
            <button
              onClick={handleSubmitImage}
              disabled={isUploading}
              className="w-full h-16 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isUploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>분석 중...</span>
                </>
              ) : (
                <>
                  <i className="ri-check-line text-xl"></i>
                  <span>이 사진으로 분석하기</span>
                </>
              )}
            </button>
            <button
              onClick={handleRetake}
              disabled={isUploading}
              className="w-full h-16 bg-white/10 text-white rounded-2xl font-bold text-lg hover:bg-white/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              다시 촬영하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
