
const API_URL = 'http://localhost:5000/api';

// Helper for GET requests
const get = async (endpoint) => {
  const response = await fetch(`${API_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'API call failed');
  }
  return result.data;
};

// 1. 메뉴 조회
export const getMenus = () => get('/menus');

// 2. 특정 메뉴의 재고 있는 매장 목록 조회
export const getStoresForMenu = (menuId) => get(`/menus/${menuId}/stores`);

// 3. 사용자 재고 제보
export const reportStock = async (reportData) => {
  const formData = new FormData();
  // FormData에 파일과 다른 데이터를 추가합니다.
  if (reportData.photo) {
    formData.append('photo', reportData.photo);
  }
  formData.append('userId', reportData.userId);
  formData.append('storeId', reportData.storeId);
  formData.append('menuId', reportData.menuId);
  formData.append('quantity', reportData.quantity);


  const response = await fetch(`${API_URL}/user/report-stock`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'API call failed');
  }
  return result;
};


// 4. 사용자 포인트 조회
export const getUserPoints = (userId) => get(`/user/${userId}/points`);
