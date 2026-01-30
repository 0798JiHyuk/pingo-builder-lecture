// server.js - PINGO 메인 백엔드 서버
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

// 무료 재고 확인 시스템 임포트
// const { HybridStockChecker } = require('./free-stock-checker');

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pingo');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('✅ MongoDB connected');
});

// ==================== 데이터 모델 ====================

// 사용자 스키마
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: String,
  points: { type: Number, default: 0 },
  reportCount: { type: Number, default: 0 },
  accuracy: { type: Number, default: 100 },
  level: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now }
});

// 재고 제보 스키마
const StockReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  menuId: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu', required: true },
  quantity: { type: Number, required: true },
  photo: String,
  location: {
    latitude: Number,
    longitude: Number
  },
  verified: { type: Boolean, default: false },
  trustScore: { type: Number, default: 50 },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// 포인트 기록 스키마
const PointHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  reason: { type: String, required: true },
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'StockReport' },
  createdAt: { type: Date, default: Date.now }
});

// 메뉴 스키마
const MenuSchema = new mongoose.Schema({
  name: String,
  emoji: String,
  color: String,
  isActive: { type: Boolean, default: true }
});

// 매장 스키마
const StoreSchema = new mongoose.Schema({
  name: String,
  address: String,
  phoneNumber: String,
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]
  },
  isActive: { type: Boolean, default: true }
});

// 크롤링 데이터 스키마
const CrawledDataSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  menuId: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu', required: true },
  source: String, // e.g., 'naver_place', 'instagram'
  hasStock: Boolean,
  confidence: Number,
  crawledAt: { type: Date, default: Date.now }
});


const User = mongoose.model('User', UserSchema);
const StockReport = mongoose.model('StockReport', StockReportSchema);
const PointHistory = mongoose.model('PointHistory', PointHistorySchema);
const Menu = mongoose.model('Menu', MenuSchema);
const Store = mongoose.model('Store', StoreSchema);
const CrawledData = mongoose.model('CrawledData', CrawledDataSchema);

// ==================== 파일 업로드 설정 ====================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// ==================== 하이브리드 체커 초기화 ====================

// const hybridChecker = new HybridStockChecker({ StockReport, CrawledData });

// ==================== API 라우트 ====================

// 1. 메뉴 조회
app.get('/api/menus', async (req, res) => {
  try {
    const menus = await Menu.find({ isActive: true });
    res.json({ success: true, data: menus });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. 크라우드소싱으로 매장 조회
app.get('/api/menus/:menuId/stores', async (req, res) => {
  try {
    const { menuId } = req.params;
    const stores = await Store.find({ isActive: true });
    
    const storesWithStock = await Promise.all(stores.map(async (store) => {
      const crowdData = await getCrowdsourcedData(store._id, menuId);
      
      return {
        id: store._id,
        name: store.name,
        address: store.address,
        phone: store.phoneNumber,
        stock: crowdData.quantity || 0,
        lat: store.location.coordinates[1],
        lng: store.location.coordinates[0],
        lastReported: crowdData.lastReported,
        reporterCount: crowdData.reporterCount,
        confidence: crowdData.confidence,
        reportedBy: crowdData.reportedBy,
        hasPhoto: crowdData.hasPhoto
      };
    }));
    
    const availableStores = storesWithStock.filter(s => s.stock > 0);
    
    res.json({ success: true, data: availableStores });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. 사용자 재고 제보
app.post('/api/user/report-stock', upload.single('photo'), async (req, res) => {
  try {
    const { userId, storeId, menuId, quantity, latitude, longitude } = req.body;
    
    let user = await User.findById(userId);
    if (!user) {
      user = new User({ 
        _id: new mongoose.Types.ObjectId(userId),
        username: `user_${Date.now()}`, 
        points: 0 
      });
      await user.save();
    }
    
    const report = new StockReport({
      userId: user._id,
      storeId,
      menuId,
      quantity: parseInt(quantity),
      photo: req.file ? req.file.path : null,
      location: {
        latitude: parseFloat(latitude) || 0,
        longitude: parseFloat(longitude) || 0
      }
    });
    
    report.trustScore = await calculateTrustScore(report);
    await report.save();
    
    const points = req.file ? 20 : 10;
    user.points += points;
    user.reportCount += 1;
    await user.save();
    
    await new PointHistory({
      userId: user._id,
      amount: points,
      reason: req.file ? '사진 포함 재고 제보' : '재고 제보',
      reportId: report._id
    }).save();
    
    res.json({ 
      success: true, 
      message: '제보 감사합니다!',
      points: points,
      totalPoints: user.points,
      data: report
    });
    
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. 사용자 포인트 조회
app.get('/api/user/:userId/points', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      // Create a new user if not found
      const newUser = new User({
        _id: new mongoose.Types.ObjectId(req.params.userId),
        username: `user_${Date.now()}`,
        points: 0,
        reportCount: 0,
        level: 1,
        accuracy: 100
      });
      await newUser.save();
      return res.json({ 
        success: true, 
        points: newUser.points,
        reportCount: newUser.reportCount,
        level: newUser.level,
        accuracy: newUser.accuracy
      });
    }
    
    res.json({ 
      success: true, 
      points: user.points,
      reportCount: user.reportCount,
      level: user.level,
      accuracy: user.accuracy
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. 크라우드소싱 재고 정보 조회
app.get('/api/crowdsourced/stock/:storeId/:menuId', async (req, res) => {
  try {
    const { storeId, menuId } = req.params;
    const data = await getCrowdsourcedData(storeId, menuId);
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. 하이브리드 재고 확인
/*
app.post('/api/free/check-stock', async (req, res) => {
  try {
    const { storeId, menuId } = req.body;
    
    const store = await Store.findById(storeId);
    const menu = await Menu.findById(menuId);
    
    if (!store || !menu) {
      return res.status(404).json({ success: false, error: 'Store or Menu not found' });
    }
    
    const result = await hybridChecker.checkStock(store, menu);
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
*/

// 7. 제보 투표
app.post('/api/report/:reportId/vote', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { vote } = req.body; // 'up' or 'down'
    
    const report = await StockReport.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    
    if (vote === 'up') {
      report.upvotes += 1;
      report.trustScore = Math.min(report.trustScore + 5, 100);
    } else {
      report.downvotes += 1;
      report.trustScore = Math.max(report.trustScore - 10, 0);
    }
    
    await report.save();
    
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. 리더보드
app.get('/api/leaderboard', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const topUsers = await User.find()
      .sort({ points: -1 })
      .limit(parseInt(limit))
      .select('username points reportCount level');
    
    res.json({ success: true, data: topUsers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== 헬퍼 함수 ====================

async function getCrowdsourcedData(storeId, menuId) {
  const oneHourAgo = new Date(Date.now() - 3600000);
  
  const reports = await StockReport.find({
    storeId,
    menuId,
    createdAt: { $gte: oneHourAgo }
  })
  .populate('userId', 'username')
  .sort({ createdAt: -1 });
  
  if (reports.length === 0) {
    return {
      quantity: null,
      confidence: 0,
      reporterCount: 0,
      lastReported: null,
      reportedBy: null,
      hasPhoto: false
    };
  }
  
  const totalWeight = reports.reduce((sum, r) => sum + r.trustScore, 0);
  const weightedSum = reports.reduce((sum, r) => sum + (r.quantity * r.trustScore), 0);
  const avgQuantity = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  
  const avgTrustScore = totalWeight / reports.length;
  const confidence = Math.min(avgTrustScore + (reports.length * 5), 100);
  
  return {
    quantity: avgQuantity,
    confidence: Math.round(confidence),
    reporterCount: reports.length,
    lastReported: getTimeAgo(reports[0].createdAt),
    reportedBy: reports[0].userId?.username || '익명',
    hasPhoto: reports.some(r => r.photo !== null)
  };
}

async function calculateTrustScore(report) {
  let score = 50;
  
  if (report.location && report.location.latitude) {
    const store = await Store.findById(report.storeId);
    if (store && store.location) {
      const distance = calculateDistance(
        report.location.latitude,
        report.location.longitude,
        store.location.coordinates[1],
        store.location.coordinates[0]
      );
      
      if (distance < 100) score += 20;
      else if (distance < 500) score += 10;
    }
  }
  
  if (report.photo) {
    score += 20;
  }
  
  const user = await User.findById(report.userId);
  if (user && user.accuracy > 80) {
    score += 10;
  }
  
  return Math.min(score, 100);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return `${seconds}초 전`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`;
  return `${Math.floor(seconds / 86400)}일 전`;
}

// ==================== 서버 시작 ====================

app.listen(PORT, () => {
  console.log(`🚀 PINGO Server running on port ${PORT}`);
  // console.log(`🆓 Free stock checking enabled`);
});

// ==================== 초기 데이터 시드 ====================

async function seedDatabase() {
  try {
    await User.deleteMany({});
    await Store.deleteMany({});
    await Menu.deleteMany({});
    await StockReport.deleteMany({});
    
    const menuCount = await Menu.countDocuments();
    if (menuCount > 0) {
      console.log('✅ Database already seeded');
      return;
    }

    const createdMenus = await Menu.create([
      { name: '두바이 쫀득쿠키', emoji: '🍪', color: '#BC5F3F', isActive: true },
      { name: '마라탕후루', emoji: '🍓', color: '#E85D75', isActive: true },
      { name: '꾸덕 티라미수', emoji: '🍰', color: '#8B6F47', isActive: true }
    ]);
    
    const createdStores = await Store.create([
      { 
        name: '강남 디저트39', 
        address: '서울 강남구', 
        phoneNumber: '02-1234-5678', 
        location: { coordinates: [127.05, 37.5] },
        isActive: true
      },
      { 
        name: '홍대 스위트팩토리', 
        address: '서울 마포구', 
        phoneNumber: '02-2345-6789', 
        location: { coordinates: [126.92, 37.55] },
        isActive: true
      },
      { 
        name: '잠실 쿠키하우스', 
        address: '서울 송파구', 
        phoneNumber: '02-3456-7890', 
        location: { coordinates: [127.1, 37.51] },
        isActive: true
      },
      { 
        name: '신촌 달콤베이커리', 
        address: '서울 서대문구', 
        phoneNumber: '02-4567-8901', 
        location: { coordinates: [126.94, 37.56] },
        isActive: true
      }
    ]);
    
    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Seed error:', error);
  }
}

setTimeout(seedDatabase, 2000);
