// App.jsx - PINGO 프론트엔드 (이 파일 전체를 복사해서 붙여넣으세요!)

import React, { useState, useEffect } from 'react';
import { Camera, MapPin, ChevronRight, RefreshCw, Star, TrendingUp, Gift, Clock, Users } from 'lucide-react';

// 샘플 메뉴 데이터
const trendingMenus = [
  { id: 1, name: '두바이 쫀득쿠키', emoji: '🍪', color: '#BC5F3F' },
  { id: 2, name: '마라탕후루', emoji: '🍓', color: '#E85D75' },
  { id: 3, name: '꾸덕 티라미수', emoji: '🍰', color: '#8B6F47' },
];

// 샘플 매장 데이터 (크라우드소싱 정보 포함)
const sampleStores = [
  { 
    id: 1, 
    name: '강남 디저트39', 
    address: '서울 강남구', 
    stock: 12, 
    lat: 37.5, 
    lng: 127.05, 
    phone: '02-1234-5678',
    lastReported: '5분 전',
    reporterCount: 3,
    confidence: 95,
    reportedBy: '김민지님',
    hasPhoto: true
  },
  { 
    id: 2, 
    name: '홍대 스위트팩토리', 
    address: '서울 마포구', 
    stock: 8, 
    lat: 37.55, 
    lng: 126.92, 
    phone: '02-2345-6789',
    lastReported: '12분 전',
    reporterCount: 2,
    confidence: 85,
    reportedBy: '이준호님',
    hasPhoto: false
  },
  { 
    id: 3, 
    name: '잠실 쿠키하우스', 
    address: '서울 송파구', 
    stock: 15, 
    lat: 37.51, 
    lng: 127.1, 
    phone: '02-3456-7890',
    lastReported: '2분 전',
    reporterCount: 5,
    confidence: 98,
    reportedBy: '박서연님',
    hasPhoto: true
  },
  { 
    id: 4, 
    name: '신촌 달콤베이커리', 
    address: '서울 서대문구', 
    stock: 5, 
    lat: 37.56, 
    lng: 126.94, 
    phone: '02-4567-8901',
    lastReported: '25분 전',
    reporterCount: 1,
    confidence: 70,
    reportedBy: '최지우님',
    hasPhoto: true
  },
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('menu'); // 'menu' | 'map' | 'report'
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userPoints, setUserPoints] = useState(150); // 사용자 포인트
  const [showReportModal, setShowReportModal] = useState(false);

  // 재고 제보 폼
  const [reportForm, setReportForm] = useState({
    quantity: '',
    hasPhoto: false,
    photoPreview: null
  });

  const handleMenuSelect = (menu) => {
    setSelectedMenu(menu);
    setCurrentScreen('map');
  };

  const handleStoreClick = (store) => {
    setSelectedStore(store);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // 실제로는 API 호출
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const handleBack = () => {
    setSelectedStore(null);
    setShowReportModal(false);
    setCurrentScreen('menu');
    setSelectedMenu(null);
  };

  const handleReportClick = (store) => {
    setSelectedStore(store);
    setShowReportModal(true);
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReportForm({
          ...reportForm,
          hasPhoto: true,
          photoPreview: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitReport = () => {
    // 실제로는 API 호출
    const points = reportForm.hasPhoto ? 20 : 10;
    setUserPoints(userPoints + points);
    
    alert(`✅ 재고 제보 완료!\n🎁 ${points} 포인트 적립되었습니다!`);
    
    setShowReportModal(false);
    setReportForm({ quantity: '', hasPhoto: false, photoPreview: null });
  };

  // 메뉴 선택 화면
  if (currentScreen === 'menu') {
    return (
      <div className="h-screen bg-white flex flex-col">
        {/* 헤더 */}
        <div className="px-6 pt-12 pb-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">PINGO</h1>
            <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-full">
              <Gift size={18} style={{ color: '#BC5F3F' }} />
              <span className="font-bold" style={{ color: '#BC5F3F' }}>{userPoints}P</span>
            </div>
          </div>
          <p className="text-sm text-gray-500">실시간 재고 정보, 사용자가 만들어가요</p>
        </div>

        {/* 포인트 안내 배너 */}
        <div className="mx-6 mt-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-100">
          <div className="flex items-start gap-3">
            <div className="bg-white rounded-full p-2">
              <Camera size={20} style={{ color: '#BC5F3F' }} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">재고 제보하고 포인트 받기</h3>
              <p className="text-sm text-gray-600">방문한 매장의 재고를 알려주세요!</p>
              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                <span>📸 사진 첨부: +20P</span>
                <span>✏️ 기본 제보: +10P</span>
              </div>
            </div>
          </div>
        </div>

        {/* 메뉴 리스트 */}
        <div className="flex-1 px-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">지금 핫한 메뉴</h2>
          <div className="space-y-3">
            {trendingMenus.map((menu) => (
              <button
                key={menu.id}
                onClick={() => handleMenuSelect(menu)}
                className="w-full bg-gray-50 hover:bg-gray-100 rounded-2xl p-5 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{menu.emoji}</span>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">{menu.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <TrendingUp size={14} className="text-green-500" />
                      <p className="text-sm text-gray-500">실시간 제보 활성화</p>
                    </div>
                  </div>
                </div>
                <ChevronRight className="text-gray-400" size={24} />
              </button>
            ))}
          </div>
        </div>

        {/* 하단 통계 */}
        <div className="px-6 py-6 bg-gray-50 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="font-bold text-lg" style={{ color: '#BC5F3F' }}>1,234</div>
              <div className="text-gray-500 text-xs">총 제보</div>
            </div>
            <div>
              <div className="font-bold text-lg" style={{ color: '#BC5F3F' }}>89</div>
              <div className="text-gray-500 text-xs">활성 매장</div>
            </div>
            <div>
              <div className="font-bold text-lg" style={{ color: '#BC5F3F' }}>567</div>
              <div className="text-gray-500 text-xs">참여 유저</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 지도 화면
  return (
    <div className="h-screen bg-white flex flex-col">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white z-10">
        <button onClick={handleBack} className="text-gray-600 hover:text-gray-900">
          ← 뒤로
        </button>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{selectedMenu?.emoji}</span>
          <h2 className="font-semibold text-gray-900">{selectedMenu?.name}</h2>
        </div>
        <button 
          onClick={handleRefresh}
          className="p-2 hover:bg-gray-100 rounded-full transition-all"
          disabled={isRefreshing}
        >
          <RefreshCw 
            size={20} 
            className={`text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {/* 지도 영역 */}
      <div className="flex-1 relative bg-gray-100">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}></div>
        </div>

        {/* 매장 핀들 */}
        {sampleStores.map((store, index) => (
          <button
            key={store.id}
            onClick={() => handleStoreClick(store)}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110"
            style={{
              left: `${20 + index * 20}%`,
              top: `${30 + (index % 2) * 25}%`,
            }}
          >
            <div className="relative">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                style={{ backgroundColor: '#BC5F3F' }}
              >
                <MapPin className="text-white" size={24} />
              </div>
              <div className="absolute -top-1 -right-1 bg-white rounded-full px-2 py-0.5 shadow-md border-2" style={{ borderColor: '#BC5F3F' }}>
                <span className="text-xs font-bold" style={{ color: '#BC5F3F' }}>{store.stock}</span>
              </div>
              {/* 신뢰도 배지 */}
              {store.confidence > 90 && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <div className="bg-green-500 rounded-full p-1">
                    <Star size={10} className="text-white fill-white" />
                  </div>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* 재고 제보 모달 */}
      {showReportModal && selectedStore && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-end z-20">
          <div className="bg-white w-full rounded-t-3xl shadow-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">재고 제보하기</h3>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* 매장 정보 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-gray-900">{selectedStore.name}</p>
                <p className="text-sm text-gray-500">{selectedStore.address}</p>
              </div>

              {/* 재고 수량 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  현재 재고 수량 *
                </label>
                <input
                  type="number"
                  placeholder="예: 5"
                  value={reportForm.quantity}
                  onChange={(e) => setReportForm({...reportForm, quantity: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* 사진 첨부 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  사진 첨부 (+10 포인트)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-orange-400 transition-colors"
                >
                  <Camera size={20} className="text-gray-400" />
                  <span className="text-gray-600">
                    {reportForm.hasPhoto ? '사진 선택됨 ✓' : '사진 선택하기'}
                  </span>
                </label>
                {reportForm.photoPreview && (
                  <img src={reportForm.photoPreview} alt="Preview" className="mt-2 w-full h-40 object-cover rounded-xl" />
                )}
              </div>

              {/* 예상 포인트 */}
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">예상 적립 포인트</span>
                  <span className="text-xl font-bold" style={{ color: '#BC5F3F' }}>
                    +{reportForm.hasPhoto ? 20 : 10}P
                  </span>
                </div>
              </div>

              {/* 제출 버튼 */}
              <button
                onClick={handleSubmitReport}
                disabled={!reportForm.quantity}
                className="w-full py-4 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#BC5F3F' }}
              >
                제보하고 포인트 받기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 매장 상세 정보 */}
      {selectedStore && !showReportModal && (
        <div className="bg-white rounded-t-3xl shadow-2xl p-6 border-t border-gray-200 z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">{selectedStore.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{selectedStore.address}</p>
            </div>
            <button 
              onClick={() => setSelectedStore(null)}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            {/* 재고 정보 */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">현재 재고</span>
                <span className="text-2xl font-bold" style={{ color: '#BC5F3F' }}>
                  {selectedStore.stock}개
                </span>
              </div>
              
              {/* 제보 정보 */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock size={14} />
                  <span>{selectedStore.lastReported}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Users size={14} />
                  <span>{selectedStore.reporterCount}명 제보</span>
                </div>
                {selectedStore.hasPhoto && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <Camera size={14} />
                    <span>사진 있음</span>
                  </div>
                )}
              </div>

              {/* 신뢰도 */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">신뢰도</span>
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={12} 
                          className={i < Math.floor(selectedStore.confidence / 20) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-gray-700">{selectedStore.confidence}%</span>
                  </div>
                </div>
              </div>

              {/* 최근 제보자 */}
              <p className="text-xs text-gray-500 mt-2">
                최근 제보: {selectedStore.reportedBy}
              </p>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-2">
              <button 
                onClick={() => handleReportClick(selectedStore)}
                className="flex-1 text-white font-semibold py-3 rounded-xl transition-all hover:opacity-90"
                style={{ backgroundColor: '#BC5F3F' }}
              >
                📸 재고 제보하기
              </button>
              <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-all">
                📞 전화하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 매장 리스트 (매장 선택 안됐을 때) */}
      {!selectedStore && !showReportModal && (
        <div className="bg-white rounded-t-3xl shadow-2xl p-6 max-h-80 overflow-y-auto border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">재고 있는 매장 ({sampleStores.length})</h3>
            <button className="text-sm" style={{ color: '#BC5F3F' }}>
              최신순 ▼
            </button>
          </div>
          <div className="space-y-2">
            {sampleStores.map((store) => (
              <button
                key={store.id}
                onClick={() => handleStoreClick(store)}
                className="w-full bg-gray-50 hover:bg-gray-100 rounded-xl p-3 flex items-center justify-between transition-all"
              >
                <div className="text-left flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{store.name}</p>
                    {store.confidence > 90 && (
                      <Star size={14} className="text-yellow-400 fill-yellow-400" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{store.address}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400">{store.lastReported}</span>
                    <span className="text-xs text-gray-400">👥 {store.reporterCount}</span>
                  </div>
                </div>
                <span className="font-bold text-xl ml-3" style={{ color: '#BC5F3F' }}>{store.stock}개</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}