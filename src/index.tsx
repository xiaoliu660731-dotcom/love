import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
// 1. 引入 Bmob SDK (确保你已运行 npm install hydrogen-js-sdk)
import Bmob from "hydrogen-js-sdk";
import { 
  Heart, BookOpen, Smile,
  Plus, Trash2, 
  Settings, Loader2, DollarSign, CheckSquare
} from 'lucide-react';
import './index.css';

// =================================================================
// 🔑 Bmob 配置区域 (务必确认这里没有空格，也没有填错)
// =================================================================
const BMOB_SECRET_KEY = "e7380f4b2947ad26";
const BMOB_API_KEY = "1234567890123456";

// 初始化 Bmob (放在组件外面，防止重复初始化)
try {
  // @ts-ignore
  Bmob.initialize(BMOB_SECRET_KEY, BMOB_API_KEY);
  console.log("Bmob 初始化尝试完成");
} catch (err) {
  console.error("Bmob 初始化失败:", err);
}

// ------------------------------------------------------------------
// 类型定义
// ------------------------------------------------------------------
interface DiaryEntry {
  objectId: string;
  text: string;
  mood: string;
  author: 'boy' | 'girl'; 
  createdAt: string;
  secretCode: string;
}

interface AccountingEntry {
  objectId: string;
  description: string;
  amount: string | number;
  author: 'boy' | 'girl';
  category: string;
  createdAt: string;
  secretCode: string;
}

interface PlanTask {
  objectId: string;
  description: string;
  completed: string | boolean; // Bmob 返回字符串 "true"/"false"
  author: 'boy' | 'girl';
  targetDate: string; // YYYY-MM-DD 格式
  createdAt: string;
  secretCode: string;
}

interface MoodEntry {
  objectId: string;
  mood: 'happy' | 'good' | 'normal' | 'sad' | 'angry';
  moodValue: string | number; // Bmob 返回字符串
  note: string;
  author: 'boy' | 'girl';
  recordDate: string; // YYYY-MM-DD 格式
  recordTime?: string; // HH:mm:ss 格式
  createdAt: string;
  secretCode: string;
  photoBase64?: string; // 可选的照片Base64数据
}

interface PhotoEntry {
  objectId: string;
  photoUrl: string;
  photoBase64?: string;
  caption: string;
  author: 'boy' | 'girl';
  uploadDate: string; // YYYY-MM-DD 格式
  createdAt: string;
  secretCode: string;
}

// ------------------------------------------------------------------
// 主应用组件
// ------------------------------------------------------------------

// 全局数据缓存
const dataCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 30000; // 30秒缓存有效期

function getFromCache(key: string) {
  const cached = dataCache[key];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setInCache(key: string, data: any) {
  dataCache[key] = { data, timestamp: Date.now() };
}

function App() {
  const [secretCode, setSecretCode] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [identity, setIdentity] = useState<'boy' | 'girl'>('boy');
  const [currentView, setCurrentView] = useState<'home' | 'diary' | 'plan' | 'accounting' | 'gallery'>('home');
  const [boyName, setBoyName] = useState('男生');
  const [girlName, setGirlName] = useState('女生');
  const [boyAvatar, setBoyAvatar] = useState('');
  const [girlAvatar, setGirlAvatar] = useState('');
  const [anniversaryDate, setAnniversaryDate] = useState('2025-07-04');
  const [showAnniversaryModal, setShowAnniversaryModal] = useState(false);

  // 检查本地存储
  useEffect(() => {
    const savedCode = localStorage.getItem('couple_secret_code');
    const savedIdentity = localStorage.getItem('couple_identity');
    const savedUsername = localStorage.getItem('couple_username');
    const savedBoyName = localStorage.getItem('couple_boy_name');
    const savedGirlName = localStorage.getItem('couple_girl_name');
    const savedBoyAvatar = localStorage.getItem('couple_boy_avatar');
    const savedGirlAvatar = localStorage.getItem('couple_girl_avatar');
    const savedAnniversaryDate = localStorage.getItem('couple_anniversary_date');
    
    if (savedCode && savedIdentity) {
      setSecretCode(savedCode);
      setIdentity(savedIdentity as any);
      if (savedUsername) setUsername(savedUsername);
      if (savedBoyName) setBoyName(savedBoyName);
      if (savedGirlName) setGirlName(savedGirlName);
      if (savedBoyAvatar) setBoyAvatar(savedBoyAvatar);
      if (savedGirlAvatar) setGirlAvatar(savedGirlAvatar);
      if (savedAnniversaryDate) setAnniversaryDate(savedAnniversaryDate);
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (code: string, username: string, id: 'boy' | 'girl') => {
    if (!code.trim() || !username.trim()) return;
    
    // 检查是否已有保存的登录信息
    const savedCode = localStorage.getItem('couple_secret_code');
    const savedBoyName = localStorage.getItem('couple_boy_name');
    const savedGirlName = localStorage.getItem('couple_girl_name');
    
    if (savedCode) {
      // 已有历史登录，需要严格验证
      if (code !== savedCode) {
        alert('❌ 暗号错误，请重新输入');
        return;
      }
      
      // 暗号正确后，验证名字 - 只在已设置的角色名字存在时才验证
      if (id === 'boy') {
        if (savedBoyName && username !== savedBoyName) {
          alert('❌ 男生名字错误，请重新输入');
          return;
        }
      } else {
        if (savedGirlName && username !== savedGirlName) {
          alert('❌ 女生名字错误，请重新输入');
          return;
        }
      }
      
      // 如果该角色的名字还没保存过，就保存
      if (id === 'boy' && !savedBoyName) {
        localStorage.setItem('couple_boy_name', username);
      } else if (id === 'girl' && !savedGirlName) {
        localStorage.setItem('couple_girl_name', username);
      }
    } else {
      // 第一次登录，保存信息
      localStorage.setItem('couple_secret_code', code);
      if (id === 'boy') {
        localStorage.setItem('couple_boy_name', username);
      } else {
        localStorage.setItem('couple_girl_name', username);
      }
    }
    
    // 验证通过，执行登录
    localStorage.setItem('couple_username', username);
    localStorage.setItem('couple_identity', id);
    
    // 更新状态
    setSecretCode(code);
    setUsername(username);
    setIdentity(id);
    
    // 更新名字状态
    if (id === 'boy') {
      setBoyName(username);
    } else {
      setGirlName(username);
    }
    
    setIsLoggedIn(true);

    // 尝试简单的 Bmob 连接测试，验证 Key 是否有效
    // @ts-ignore
    const query = Bmob.Query("GameScore"); // 查一个不存在的表也没关系，主要看是否联通
    query.find().then(() => {
      console.log("Bmob 连接成功");
    }).catch((err: any) => {
      console.error("Bmob 连接警告:", err);
      // 如果报错，这里不阻断登录，但在控制台打印
      if(err.code === 20004) {
          alert("连接成功，但请去Bmob后台创建 Diary 和 BucketList 两个表，否则无法存数据！");
      }
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('couple_secret_code');
    localStorage.removeItem('couple_identity');
    setIsLoggedIn(false);
    setSecretCode('');
    setCurrentView('home');
  };

  if (!isLoggedIn) {
    return <Onboarding onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans text-gray-800 max-w-md mx-auto shadow-2xl overflow-hidden relative pt-6" style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <div className="bg-white px-4 py-3 shadow-sm z-10 flex justify-between items-center">
        <h1 className="text-xl font-bold text-pink-500 flex items-center gap-2">
          <Heart className="fill-pink-500 text-pink-500" size={20} />
          LoveSpace
        </h1>
        <div className="flex items-center gap-3">
          <div className="text-xs px-2 py-1 bg-pink-100 text-pink-600 rounded-full flex items-center gap-1">
             {identity === 'boy' ? '👦' : '👧'} <span className="font-bold">{username}</span>
          </div>
          <button 
            onClick={() => setShowAnniversaryModal(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="设置"
          >
            <Settings size={20} className="text-gray-600 hover:text-gray-800" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20 scrollbar-hide">
        {currentView === 'home' && <HomeView key="home" secretCode={secretCode} identity={identity} boyName={boyName} girlName={girlName} boyAvatar={boyAvatar} girlAvatar={girlAvatar} setBoyAvatar={setBoyAvatar} setGirlAvatar={setGirlAvatar} anniversaryDate={anniversaryDate} />}
        {currentView === 'diary' && <DiaryView key="diary" secretCode={secretCode} identity={identity} />}
        {currentView === 'plan' && <PlanView key="plan" secretCode={secretCode} identity={identity} boyName={boyName} girlName={girlName} />}
        {currentView === 'accounting' && <AccountingView key="accounting" secretCode={secretCode} identity={identity} boyName={boyName} girlName={girlName} />}
        {currentView === 'gallery' && <GalleryView key="gallery" secretCode={secretCode} identity={identity} />}
      </div>

      <div className="absolute bottom-0 w-full bg-white border-t border-gray-100 z-20">
        <div className="flex justify-around py-1 pb-4 px-1 overflow-x-auto scrollbar-hide">
          <NavBtn icon={Heart} label="首页" active={currentView === 'home'} onClick={() => setCurrentView('home')} />
          <NavBtn icon={BookOpen} label="日记" active={currentView === 'diary'} onClick={() => setCurrentView('diary')} />
          <NavBtn icon={CheckSquare} label="计划" active={currentView === 'plan'} onClick={() => setCurrentView('plan')} />
          <NavBtn icon={DollarSign} label="记账" active={currentView === 'accounting'} onClick={() => setCurrentView('accounting')} />
          <NavBtn icon={BookOpen} label="相册" active={currentView === 'gallery'} onClick={() => setCurrentView('gallery')} />
        </div>
      </div>

      {/* 纪念日修改模态框 */}
      {showAnniversaryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4">修改恋爱纪念日</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">选择纪念日期</label>
                <input
                  type="date"
                  value={anniversaryDate}
                  onChange={(e) => setAnniversaryDate(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="bg-pink-50 rounded-lg p-3 border border-pink-200">
                <p className="text-xs text-pink-600 font-semibold mb-1">预览</p>
                <p className="text-lg font-bold text-pink-700">💑 恋爱纪念日 {anniversaryDate.replace(/-/g, '.')}</p>
                <p className="text-xs text-pink-600 mt-2">
                  相爱 {Math.ceil(Math.abs(new Date().getTime() - new Date(anniversaryDate).getTime()) / (1000 * 60 * 60 * 24))} 天
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAnniversaryModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('couple_anniversary_date', anniversaryDate);
                  setShowAnniversaryModal(false);
                  alert('✅ 纪念日已修改！');
                }}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-rose-600 transition-all"
              >
                保存
              </button>
            </div>

            {/* 退出登录按钮 */}
            <button
              onClick={() => {
                if (window.confirm('确定要退出登录吗？')) {
                  setShowAnniversaryModal(false);
                  handleLogout();
                }
              }}
              className="w-full mt-4 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-colors border border-red-200"
            >
              退出登录
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// 子视图组件
// ------------------------------------------------------------------

function Onboarding({ onLogin }: { onLogin: (code: string, username: string, id: 'boy' | 'girl') => void }) {
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'boy' | 'girl'>('boy');
  const [errorMsg, setErrorMsg] = useState('');
  
  const handleSubmit = () => {
    setErrorMsg('');
    
    if (!code.trim()) {
      setErrorMsg('❌ 请输入暗号');
      return;
    }
    
    if (!username.trim()) {
      setErrorMsg('❌ 请输入用户名');
      return;
    }
    
    // 简单登录：直接保存信息并登录
    const savedCode = localStorage.getItem('couple_secret_code');
    const savedBoyName = localStorage.getItem('couple_boy_name');
    const savedGirlName = localStorage.getItem('couple_girl_name');
    
    if (!savedCode) {
      // 第一次登录，保存信息
      localStorage.setItem('couple_secret_code', code);
      if (role === 'boy') {
        localStorage.setItem('couple_boy_name', username);
      } else {
        localStorage.setItem('couple_girl_name', username);
      }
    } else {
      // 已有账户，验证暗号
      if (code !== savedCode) {
        setErrorMsg('❌ 暗号错误，请重新输入');
        return;
      }
      
      // 验证名字（如果该角色已保存过）
      if (role === 'boy' && savedBoyName && username !== savedBoyName) {
        setErrorMsg('❌ 男生名字错误');
        return;
      }
      if (role === 'girl' && savedGirlName && username !== savedGirlName) {
        setErrorMsg('❌ 女生名字错误');
        return;
      }
      
      // 如果该角色名字还未保存，保存它
      if (role === 'boy' && !savedBoyName) {
        localStorage.setItem('couple_boy_name', username);
      }
      if (role === 'girl' && !savedGirlName) {
        localStorage.setItem('couple_girl_name', username);
      }
    }
    
    // 保存登录信息并登录
    localStorage.setItem('couple_username', username);
    localStorage.setItem('couple_identity', role);
    onLogin(code, username, role);
  };
  
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-pink-100 to-white px-6 text-center max-w-md mx-auto pt-6" style={{ minHeight: '100vh' }}>
      <div className="bg-white p-4 rounded-full shadow-lg mb-6 animate-bounce">
        <Heart size={48} className="text-pink-500 fill-pink-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">💕 我们的专属空间</h1>
      <p className="text-gray-500 mb-8 text-sm">登录你们的专属空间</p>
      
      <div className="w-full space-y-4 bg-white p-6 rounded-2xl shadow-sm">
        <div>
          <label className="block text-left text-xs font-semibold text-gray-400 mb-1">用户名</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => {
              setUsername(e.target.value);
              setErrorMsg('');
            }} 
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500" 
          />
        </div>
        
        <div>
          <label className="block text-left text-xs font-semibold text-gray-400 mb-1">暗号</label>
          <input 
            type="text" 
            value={code} 
            onChange={(e) => {
              setCode(e.target.value);
              setErrorMsg('');
            }} 
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500" 
          />
        </div>
        
        <div>
          <label className="block text-left text-xs font-semibold text-gray-400 mb-2">身份</label>
          <div className="flex gap-4">
            <button onClick={() => {
              setRole('boy');
              setErrorMsg('');
            }} className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${role === 'boy' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-gray-100 text-gray-400'}`}>👦 男生</button>
            <button onClick={() => {
              setRole('girl');
              setErrorMsg('');
            }} className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${role === 'girl' ? 'bg-pink-50 border-pink-500 text-pink-600' : 'border-gray-100 text-gray-400'}`}>👧 女生</button>
          </div>
        </div>
        
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-xs">
            {errorMsg}
          </div>
        )}
        
        <button onClick={handleSubmit} disabled={!code || !username} className="w-full py-3 bg-pink-500 text-white rounded-xl font-semibold shadow-md active:scale-95 transition-transform disabled:opacity-50">
          登录
        </button>
      </div>
    </div>
  );
}

function HomeView({ secretCode, identity, boyName, girlName, boyAvatar, girlAvatar, setBoyAvatar, setGirlAvatar, anniversaryDate }: { secretCode: string, identity: string, boyName: string, girlName: string, boyAvatar: string, girlAvatar: string, setBoyAvatar: (avatar: string) => void, setGirlAvatar: (avatar: string) => void, anniversaryDate: string }) {
  const timeoutsRef = React.useRef<NodeJS.Timeout[]>([]);
  const diffDays = useMemo(() => {
    const startDate = new Date(anniversaryDate);
    return Math.ceil(Math.abs(new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  }, [anniversaryDate]);
  
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [selectedMood, setSelectedMood] = useState<'happy' | 'good' | 'normal' | 'sad' | 'angry'>('good');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 图片上传相关状态
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  // 弹窗状态
  const [showMoodsModal, setShowMoodsModal] = useState<'record' | 'list' | 'gallery'>('record');
  
  // 照片墙状态
  const [galleryPhotos, setGalleryPhotos] = useState<PhotoEntry[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const moodEmojis = {
    happy: { emoji: '😄', label: '开心', color: 'bg-yellow-100 border-yellow-300' },
    good: { emoji: '😊', label: '不错', color: 'bg-green-100 border-green-300' },
    normal: { emoji: '😐', label: '一般', color: 'bg-blue-100 border-blue-300' },
    sad: { emoji: '😔', label: '难过', color: 'bg-purple-100 border-purple-300' },
    angry: { emoji: '😠', label: '生气', color: 'bg-red-100 border-red-300' }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // 更激进的分辨率限制
          const maxSize = 600;
          if (width > maxSize || height > maxSize) {
            const scale = Math.min(maxSize / width, maxSize / height);
            width = width * scale;
            height = height * scale;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
          }
          
          // 更激进的质量压缩策略
          let quality = 0.5; // 初始质量降至50%
          let compressedData = canvas.toDataURL('image/jpeg', quality);
          
          // 目标大小为35KB (Bmob限制约43KB，留出余量)
          const targetSize = 40000;
          while (compressedData.length > targetSize && quality > 0.1) {
            quality -= 0.05;
            compressedData = canvas.toDataURL('image/jpeg', quality);
          }
          
          const base64 = compressedData.split(',')[1] || '';
          const estimatedSize = Math.ceil(base64.length * 0.75);
          
          // 如果还是太大就再降分辨率
          if (estimatedSize > targetSize) {
            reject(new Error(`图片过大(${(estimatedSize / 1024).toFixed(1)}KB)，请选择更小的图片或低分辨率照片`));
            return;
          }
          
          resolve(base64);
        };
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = e.target?.result as string;
      };
      
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  };

  const fetchMoods = useCallback(() => {
    const cacheKey = `moods_${secretCode}`;
    const cached = getFromCache(cacheKey);
    if (cached) {
      setMoods(cached);
      return;
    }
    
    // @ts-ignore
    const query = Bmob.Query("MoodEntry");
    query.equalTo("secretCode", "==", secretCode);
    query.order("-createdAt");
    query.find().then((res: any) => {
      if (Array.isArray(res)) {
        setMoods(res as MoodEntry[]);
        setInCache(cacheKey, res);
      }
    }).catch(() => {});
  }, [secretCode]);

  useEffect(() => {
    let isMounted = true;
    const loadMoods = () => {
      if (isMounted) {
        fetchMoods();
      }
    };
    
    const fetchGalleryPhotos = () => {
      if (!isMounted) return;
      const cacheKey = `photos_${secretCode}`;
      const cached = getFromCache(cacheKey);
      if (cached) {
        setGalleryPhotos(cached);
        return;
      }
      
      // @ts-ignore
      const query = Bmob.Query("PhotoEntry");
      query.equalTo("secretCode", "==", secretCode);
      query.order("-uploadDate");
      query.find().then((res: any) => {
        if (isMounted && Array.isArray(res)) {
          setGalleryPhotos(res as PhotoEntry[]);
          setInCache(cacheKey, res);
        }
      }).catch(() => {});
    };
    
    loadMoods();
    fetchGalleryPhotos();
    const timer = setInterval(loadMoods, 60000);
    const photoTimer = setInterval(fetchGalleryPhotos, 60000);
    
    return () => {
      isMounted = false;
      clearInterval(timer);
      clearInterval(photoTimer);
      // 清理所有 timeout
      if (timeoutsRef.current) {
        timeoutsRef.current.forEach(timeout => {
          if (timeout) clearTimeout(timeout);
        });
        timeoutsRef.current = [];
      }
    };
  }, [secretCode, fetchMoods]);

  const handleRecordMood = async () => {
    setLoading(true);
    const moodValues = { happy: "5", good: "4", normal: "3", sad: "2", angry: "1" };
    const recordDate = new Date().toISOString().split('T')[0];
    const recordTime = new Date().toLocaleTimeString('zh-CN');

    try {
      let photoBase64 = '';
      if (photoFile) {
        try {
          photoBase64 = await compressImage(photoFile);
        } catch (compressError) {
          alert("图片处理失败: " + String(compressError));
          setLoading(false);
          return;
        }
      }

      // @ts-ignore
      const query = Bmob.Query("MoodEntry");
      const data: any = {
        mood: selectedMood,
        moodValue: moodValues[selectedMood],
        note: note,
        author: identity,
        recordDate: recordDate,
        recordTime: recordTime,
        secretCode: secretCode
      };

      if (photoBase64) {
        data.photoBase64 = photoBase64;
      }

      query.save(data).then(() => {
        // 如果有图片，同时上传到相册
        if (photoBase64) {
          try {
            // @ts-ignore
            const photoQuery = Bmob.Query("PhotoEntry");
            photoQuery.save({
              photoBase64: photoBase64,
              caption: note || `${moodEmojis[selectedMood].label}时刻`,
              author: identity,
              uploadDate: recordDate,
              secretCode: secretCode
            }).catch((err: any) => {
              console.error("照片保存到相册失败:", err);
            });
          } catch (photoErr) {
            console.error("照片保存到相册失败:", photoErr);
          }
        }
        
        setNote('');
        setPhotoFile(null);
        setPhotoPreview(null);
        setLoading(false);
        
        const newMoodEntry: MoodEntry = {
          objectId: Date.now().toString(),
          mood: selectedMood,
          moodValue: moodValues[selectedMood],
          note: note,
          author: identity as 'boy' | 'girl',
          recordDate: recordDate,
          createdAt: recordDate + ' ' + recordTime,
          secretCode: secretCode
        };
        
        setMoods(prev => [newMoodEntry, ...prev]);
        const timeout = setTimeout(() => {
          fetchMoods();
        }, 500);
        timeoutsRef.current.push(timeout);
      }).catch((err: any) => {
        console.error(err);
        alert("记录失败: " + JSON.stringify(err));
        if(err.code === 20004) {
          alert("请去Bmob后台创建 MoodEntry 表!");
        }
        if(err.code === 10007) {
          alert("数据太大，已为您自动压缩。如果仍然失败，请选择分辨率更低的图片");
        }
        setLoading(false);
      });
    } catch (error) {
      console.error("图片处理失败:", error);
      alert("图片处理失败: " + String(error));
      setLoading(false);
    }
  };

  const handleDeleteMood = (id: string) => {
    if (!window.confirm('确定要删除此心情记录吗?')) return;
    // @ts-ignore
    const query = Bmob.Query("MoodEntry");
    query.get(id).then((res: any) => {
      res.destroy().then(() => {
        setMoods(prev => prev.filter(m => m.objectId !== id));
        fetchMoods();
      }).catch((err: any) => {
        alert("删除失败: " + JSON.stringify(err));
      });
    }).catch((err: any) => {
      alert("获取心情记录失败: " + JSON.stringify(err));
    });
  };

  return (
    <div className="h-full flex flex-col p-3 gap-3">
      {/* 纪念日卡片 - 固定在顶部 */}
      <div className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-300 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden flex-shrink-0 hover:shadow-2xl transition-shadow group">
        {/* 背景装饰 */}
        <div className="absolute top-3 right-4 text-3xl opacity-15 animate-pulse">💕</div>
        <div className="absolute bottom-3 left-4 text-2xl opacity-15">💕</div>
        
        <div className="relative z-10">
          {/* 头像和名字部分 */}
          <div className="flex justify-between items-center mb-4 px-2">
            {/* 男生头像 */}
            <div className="text-center flex-1">
              <div 
                className={`w-16 h-16 rounded-full mx-auto mb-2 bg-white/30 flex items-center justify-center text-2xl overflow-hidden border-2 border-white/50 transition-all ${identity === 'boy' ? 'cursor-pointer hover:border-white hover:scale-105' : 'cursor-not-allowed opacity-80'}`}
                onClick={() => {
                  if (identity !== 'boy') {
                    alert('只能修改自己的头像哦！');
                    return;
                  }
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e: any) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const avatar = event.target?.result as string;
                      setBoyAvatar(avatar);
                      localStorage.setItem('couple_boy_avatar', avatar);
                    };
                    reader.readAsDataURL(file);
                  };
                  input.click();
                }}
                title={identity === 'boy' ? '点击上传头像' : '只有男生可以修改'}
              >
                {boyAvatar ? <img src={boyAvatar} alt="boy" className="w-full h-full object-cover" /> : '👦'}
              </div>
              <p className="text-white font-bold text-sm">{boyName}</p>
            </div>
            
            {/* 中间内容 */}
            <div className="text-center flex-1 border-l border-r border-white/30 px-3">
              <p className="text-white/80 text-xs font-light mb-1">相爱</p>
              <div className="flex items-baseline justify-center gap-1.5">
                <p className="text-4xl font-black text-white">{diffDays}</p>
                <p className="text-sm font-bold text-white/90">天</p>
              </div>
            </div>
            
            {/* 女生头像 */}
            <div className="text-center flex-1">
              <div 
                className={`w-16 h-16 rounded-full mx-auto mb-2 bg-white/30 flex items-center justify-center text-2xl overflow-hidden border-2 border-white/50 transition-all ${identity === 'girl' ? 'cursor-pointer hover:border-white hover:scale-105' : 'cursor-not-allowed opacity-80'}`}
                onClick={() => {
                  if (identity !== 'girl') {
                    alert('只能修改自己的头像哦！');
                    return;
                  }
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e: any) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const avatar = event.target?.result as string;
                      setGirlAvatar(avatar);
                      localStorage.setItem('couple_girl_avatar', avatar);
                    };
                    reader.readAsDataURL(file);
                  };
                  input.click();
                }}
                title={identity === 'girl' ? '点击上传头像' : '只有女生可以修改'}
              >
                {girlAvatar ? <img src={girlAvatar} alt="girl" className="w-full h-full object-cover" /> : '👧'}
              </div>
              <p className="text-white font-bold text-sm">{girlName}</p>
            </div>
          </div>
          
          {/* 分隔线 */}
          <div className="h-0.5 bg-white/40 my-3"></div>
          
          {/* 恋爱纪念日 */}
          <div className="text-center">
            <p className="text-white/80 text-xs font-light">💑 恋爱纪念日 {anniversaryDate.replace(/-/g, '.')}</p>
          </div>
        </div>
      </div>

      {/* 选项卡按钮 - 在纪念日下方 */}
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => setShowMoodsModal('record')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            showMoodsModal === 'record'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
              : 'bg-white border-2 border-orange-300 text-orange-600 hover:bg-orange-50'
          }`}
        >
          💭 当下时刻
        </button>
        <button
          onClick={() => setShowMoodsModal('list')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            showMoodsModal === 'list'
              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
              : 'bg-white border-2 border-pink-300 text-pink-600 hover:bg-pink-50'
          }`}
        >
          ✨ 最近时刻
        </button>
        {galleryPhotos.length > 0 && (
          <button
            onClick={() => setShowMoodsModal('gallery')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              showMoodsModal === 'gallery'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md'
                : 'bg-white border-2 border-purple-300 text-purple-600 hover:bg-purple-50'
            }`}
          >
            🖼️ 故事墙
          </button>
        )}
      </div>

      {/* 内容区域 - 三个卡片框 */}
      {showMoodsModal === 'record' ? (
        // 当下时刻内容区
        <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl shadow-md border-2 border-orange-200">
          <div className="px-4 py-2 border-b-2 border-orange-200 flex-shrink-0">
            <p className="text-lg font-bold text-orange-600">💭 当下时刻</p>
          </div>
          
          <div className="flex-1 flex flex-col overflow-hidden p-3 space-y-2.5">
            {/* 心情选择 */}
            <div>
              <p className="text-sm text-gray-600 font-semibold mb-2">现在心情？</p>
              <div className="grid grid-cols-5 gap-1.5">
                {(Object.keys(moodEmojis) as Array<keyof typeof moodEmojis>).map(mood => (
                  <button
                    key={mood}
                    onClick={() => setSelectedMood(mood)}
                    className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg border-2 transition-all active:scale-95 ${
                      selectedMood === mood 
                        ? `${moodEmojis[mood].color} border-current scale-105 shadow-md` 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <span className="text-xl">{moodEmojis[mood].emoji}</span>
                    <span className="text-[6px] mt-0.5 text-gray-600 font-medium">{moodEmojis[mood].label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 备注输入框 */}
            <div className="flex-1 flex flex-col min-h-0">
              <p className="text-sm text-gray-600 font-semibold mb-1.5">想说点什么？</p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="分享想法..."
                className="flex-1 p-2.5 border-2 border-orange-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none bg-white"
              />
            </div>

            {/* 图片和按钮行 */}
            <div className="flex gap-2 flex-shrink-0">
              {/* 图片预览或上传 */}
              {photoPreview ? (
                <div className="relative flex-1 h-16">
                  <img src={photoPreview} alt="预览" className="w-full h-full object-cover rounded-lg border-2 border-orange-300 shadow-md" />
                  <button
                    onClick={() => {
                      setPhotoFile(null);
                      setPhotoPreview(null);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full text-xs hover:bg-red-600 transition-colors shadow-md"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="flex-1 py-3 bg-white text-gray-700 rounded-lg font-semibold hover:bg-orange-50 transition-colors flex flex-col items-center justify-center gap-1 text-xs cursor-pointer border-2 border-dashed border-orange-300">
                  <span className="text-lg">📸</span>
                  <span>添加照片</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
              )}

              {/* 记录按钮 */}
              <button
                onClick={handleRecordMood}
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-bold hover:from-orange-600 hover:to-amber-600 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 text-sm shadow-md flex-shrink-0"
              >
                {loading && <Loader2 className="animate-spin" size={14} />}
                <span>💕 {loading ? '记录中' : '记录'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : showMoodsModal === 'list' ? (
        // 最近时刻内容区
        <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl shadow-md border-2 border-pink-200">
          <div className="p-4 border-b-2 border-pink-200 flex-shrink-0">
            <p className="text-lg font-bold text-pink-600">✨ 最近时刻</p>
            <p className="text-xs text-pink-500 mt-1">💕 共有 {moods.length} 条记录</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {moods.length === 0 ? (
              <div className="text-center py-8 text-gray-400 flex flex-col items-center justify-center h-full">
                <Smile size={48} className="mb-3 opacity-30" />
                <p className="text-base font-semibold">暂无时刻记录</p>
                <p className="text-sm mt-2">开始记录你们的故事吧</p>
              </div>
            ) : (
              moods.map(mood => (
                <div key={mood.objectId} className={`p-3 rounded-xl border-2 ${moodEmojis[mood.mood].color} hover:shadow-md transition-all bg-white`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <span className="text-3xl flex-shrink-0">{moodEmojis[mood.mood].emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-gray-800">{mood.author === 'boy' ? '👦 他' : '👧 她'}</p>
                          <p className="text-xs text-gray-500">{mood.recordDate}</p>
                          {mood.recordTime && <p className="text-xs text-gray-500">{mood.recordTime}</p>}
                        </div>
                        {mood.note && <p className="text-sm text-gray-700 mt-1.5 leading-relaxed">{mood.note}</p>}
                        {mood.photoBase64 && (
                          <div className="mt-2">
                            <img src={`data:image/jpeg;base64,${mood.photoBase64}`} alt="时刻" className="w-full h-36 object-cover rounded-lg border border-gray-200" />
                          </div>
                        )}
                      </div>
                    </div>
                    {mood.author === identity && (
                      <button
                        onClick={() => handleDeleteMood(mood.objectId)}
                        className="p-1.5 text-gray-300 hover:text-red-500 active:text-red-600 transition-colors flex-shrink-0 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        // 故事墙内容区
        <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-md border-2 border-purple-200">
          <div className="p-4 border-b-2 border-purple-200 flex-shrink-0">
            <p className="text-lg font-bold text-purple-600">🖼️ 故事墙</p>
            <p className="text-xs text-purple-500 mt-1">📸 共有 {galleryPhotos.length} 张照片</p>
          </div>
          
          <div className="flex-1 flex flex-col overflow-hidden">
            {galleryPhotos.length === 0 ? (
              <div className="flex-1 text-center py-8 text-gray-400 flex flex-col items-center justify-center">
                <span className="text-6xl mb-3 opacity-30">🖼️</span>
                <p className="text-base font-semibold">暂无照片</p>
                <p className="text-sm mt-2">在当下时刻添加照片吧</p>
              </div>
            ) : (
              <>
                {/* 大照片展示区 + 描述 */}
                <div className="flex-1 p-4 flex flex-col items-center justify-start overflow-hidden">
                  <div className="relative rounded-xl overflow-hidden shadow-lg bg-gray-900 flex items-center justify-center flex-1" style={{ aspectRatio: '3/4', maxHeight: '100%', width: 'auto', maxWidth: '100%' }}>
                    <img
                      src={`data:image/jpeg;base64,${galleryPhotos[currentPhotoIndex]?.photoBase64}`}
                      alt={`照片 ${currentPhotoIndex + 1}`}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-3 right-3 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {currentPhotoIndex + 1}/{galleryPhotos.length}
                    </div>
                  </div>

                  {/* 描述显示在照片下面 */}
                  {galleryPhotos[currentPhotoIndex]?.caption && (
                    <div className="w-full mt-2 px-2">
                      <p className="text-xs text-gray-600 text-center leading-relaxed line-clamp-2">{galleryPhotos[currentPhotoIndex].caption}</p>
                    </div>
                  )}
                </div>


              </>
            )}
          </div>
        </div>
      )}


    </div>
  );
}

// 日记视图
function DiaryView({ secretCode, identity }: { secretCode: string, identity: string }) {
  const loveQuotes = [
    "浩瀚星河的轨迹，终将徐徐驶向你的晴空。",
    "愿我如浩海般深沉，护徐晴一世无忧安乐。",
    "在浩渺无边的人海里，只为徐徐遇见晴天。",
    "刘住时光的脚步，许你往后余生晴空万里。",
    "徐徐清风拂过心田，便是刘浩最爱的晴天。",
    "所有的浩劫余生，都是为了遇见最美的徐晴。",
    "往后岁月浩浩荡荡，我的爱只给徐晴一人。",
    "徐徐流淌的时光中，刘浩只想守着晴天到白头。",
    "你是浩大世界里，我唯一想徐徐图之的晴朗。",
    "哪怕世界浩瀚无边，刘浩的眼中也只有徐晴。",
    "用一生的浩气长存，换你岁岁年年雨过徐晴。",
    "想和你徐徐老去，在浩瀚宇宙里共度每一个晴雨。",
    "刘在心底的名字，是浩宇间最温柔的那抹晴空。",
    "从浩渊直至天际，徐晴是刘浩永恒不变的航向。",
    "爱意如浩海奔流，只为徐徐汇入你的眼眸。",
    "此生刘浩的心跳，只随徐晴的笑容而起伏。",
    "无论前路多么浩渺，有徐晴的地方就是归途。",
    "许你一场浩大的婚礼，在这个徐徐展开的晴天。",
    "你的名字叫徐晴，是我浩大生命里唯一的光。",
    "所有的怦然心动，都是刘浩对徐晴的蓄谋已久。",
    "浩渺天地之间，唯愿与徐晴共看云卷云舒。",
    "把爱写进浩瀚诗篇，每一句结尾都是徐晴。",
    "若爱意浩瀚如海，徐晴便是海面不落的晴阳。",
    "愿与你徐徐同行，看遍这浩浩红尘的晴雨风雪。",
    "刘下一生的承诺，给那个叫徐晴的璀璨星辰。",
    "所谓岁月静好，不过是刘浩与徐晴的朝夕相伴。",
    "在这浩大的宇宙中，徐晴是刘浩唯一的万有引力。",
    "不管风雨如何浩大，刘浩都会为你撑起一片晴空。",
    "徐徐展开的余生画卷，要和刘浩一起画满晴天。",
    "浩气长存的誓言，只为徐徐守护这份晴朗的爱。"
  ];
  
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [newText, setNewText] = useState('');
  const [isWriting, setIsWriting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedDate, setExpandedDate] = useState<string | null>(null); // 用于全屏展示
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // 使用 useCallback 创建稳定的数据加载函数
  const fetchPhotosData = useCallback(() => {
    const cacheKey = `photos_${secretCode}`;
    const cached = getFromCache(cacheKey);
    if (cached) {
      setPhotos(cached);
      return;
    }
    
    // @ts-ignore
    const query = Bmob.Query("PhotoEntry");
    query.equalTo("secretCode", "==", secretCode);
    query.order("-uploadDate");
    query.find().then((res: any) => {
      if (Array.isArray(res)) {
        setPhotos(res as PhotoEntry[]);
        setInCache(cacheKey, res);
      }
    }).catch(() => {});
  }, [secretCode]);

  const fetchDiariesData = useCallback(() => {
    const cacheKey = `diaries_${secretCode}`;
    const cached = getFromCache(cacheKey);
    if (cached) {
      setEntries(cached);
      return;
    }
    
    // @ts-ignore
    const query = Bmob.Query("Diary");
    query.equalTo("secretCode", "==", secretCode);
    query.order("-createdAt");
    query.find().then((res: any) => {
      if (Array.isArray(res)) {
        setEntries(res as DiaryEntry[]);
        setInCache(cacheKey, res);
      }
    }).catch((err: any) => {
      if (err.code !== 20004) {
         console.error("日记获取失败:", err);
      }
    });
  }, [secretCode]);

  useEffect(() => {
    fetchPhotosData();
    fetchDiariesData();
    
    const photoTimer = setInterval(fetchPhotosData, 30000);
    const diaryTimer = setInterval(fetchDiariesData, 30000);

    return () => {
      clearInterval(photoTimer);
      clearInterval(diaryTimer);
    };
  }, [fetchPhotosData, fetchDiariesData]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // 更激进的分辨率限制
          const maxSize = 600;
          if (width > maxSize || height > maxSize) {
            const scale = Math.min(maxSize / width, maxSize / height);
            width = width * scale;
            height = height * scale;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
          }
          
          // 更激进的质量压缩策略
          let quality = 0.5; // 初始质量降至50%
          let compressedData = canvas.toDataURL('image/jpeg', quality);
          
          // 目标大小为35KB (Bmob限制约43KB，留出余量)
          const targetSize = 35000;
          while (compressedData.length > targetSize && quality > 0.1) {
            quality -= 0.05;
            compressedData = canvas.toDataURL('image/jpeg', quality);
          }
          
          const base64 = compressedData.split(',')[1] || '';
          const estimatedSize = Math.ceil(base64.length * 0.75);
          
          // 如果还是太大就提示
          if (estimatedSize > targetSize) {
            reject(new Error(`图片过大(${(estimatedSize / 1024).toFixed(1)}KB)，请选择更小的图片或低分辨率照片`));
            return;
          }
          
          resolve(base64);
        };
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = e.target?.result as string;
      };
      
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  };

  const handleUploadPhoto = async () => {
    if (!photoFile) return;
    if (!photoCaption.trim()) {
      alert("请输入照片描述");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const base64 = await compressImage(photoFile);
      
      // @ts-ignore
      const query = Bmob.Query("PhotoEntry");
      query.set("photoBase64", base64);
      query.set("caption", photoCaption);
      query.set("author", identity);
      query.set("uploadDate", selectedDate);
      query.set("secretCode", secretCode);

      query.save().then(() => {
        setPhotoFile(null);
        setPhotoPreview(null);
        setPhotoCaption('');
        setIsUploadingPhoto(false);
        alert("照片上传成功！");
        fetchPhotosData();
      }).catch((err: any) => {
        console.error(err);
        alert("上传失败: " + JSON.stringify(err));
        if(err.code === 20004) {
          alert("请去Bmob后台创建 PhotoEntry 表！");
        }
        if(err.code === 10007) {
          alert("数据太大，已为您自动压缩。如果仍然失败，请选择分辨率更低的图片");
        }
        setIsUploadingPhoto(false);
      });
    } catch (error) {
      console.error("图片压缩失败:", error);
      alert("图片处理失败: " + String(error));
      setIsUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = (id: string) => {
    if (!window.confirm('确定要删除这张照片吗?')) return;
    // @ts-ignore
    const query = Bmob.Query("PhotoEntry");
    query.destroy(id).then(() => {
      fetchPhotosData();
    }).catch((err: any) => {
      alert("删除失败: " + JSON.stringify(err));
    });
  };

  const handleSubmit = () => {
    if (!newText.trim()) return;
    setLoading(true);
    
    // @ts-ignore
    const query = Bmob.Query("Diary");
    query.set("text", newText);
    query.set("mood", "happy");
    query.set("author", identity);
    query.set("secretCode", secretCode);
    
    query.save().then(() => {
      console.log("日记发布成功，重新获取数据...");
      setNewText('');
      setIsWriting(false);
      setLoading(false);
      const today = new Date().toISOString().split('T')[0];
      console.log("设置选中日期为:", today);
      setSelectedDate(today);
      // 稍微延迟一下再刷新，确保数据已保存
      setTimeout(() => {
        fetchDiariesData();
      }, 500);
    }).catch((err: any) => {
      console.error("发布错误:", err);
      alert("发布失败: " + JSON.stringify(err));
      setLoading(false);
    });
  };

  const handleDelete = (id: string) => {
    if(!window.confirm('确定要删除这条日记吗?')) return;
    // @ts-ignore
    const query = Bmob.Query("Diary");
    query.destroy(id).then(() => {
      fetchDiariesData();
    }).catch((err: any) => {
      alert("删除失败: " + JSON.stringify(err));
    });
  }

  // 获取选中日期的日记 (暂时未使用)
  // const selectedDayEntries = entries.filter(entry => {
  //   const entryDate = entry.createdAt.split(' ')[0]; // Bmob 格式: "2026-01-04 20:52:07"
  //   console.log("比较日期:", { entryDate, selectedDate, match: entryDate === selectedDate });
  //   return entryDate === selectedDate;
  // });

  // 获取选中日期的照片 (暂时未使用)
  // const selectedDayPhotos = photos.filter(photo => {
  //   const photoDate = photo.uploadDate || photo.createdAt.split(' ')[0];
  //   return photoDate === selectedDate;
  // });

  // 根据日期获取日记作者信息
  const getEntriesByDate = (dateStr: string) => {
    return entries.filter(entry => entry.createdAt.split(' ')[0] === dateStr);
  };

  // 获取日期的颜色状态
  const getDateColorStatus = (dateStr: string) => {
    const dayEntries = getEntriesByDate(dateStr);
    if (dayEntries.length === 0) return 'empty'; // 灰色 - 都没写
    
    const hasBoy = dayEntries.some(e => e.author === 'boy');
    const hasGirl = dayEntries.some(e => e.author === 'girl');
    
    if (hasBoy && hasGirl) return 'both'; // 粉红色 + 爱心 - 都写了
    if (hasBoy) return 'boy'; // 浅绿色 - 只有男生
    if (hasGirl) return 'girl'; // 黄色 - 只有女生
    
    return 'empty';
  };

  // 获取日历数据
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthDays = [];
  const firstDay = getFirstDayOfMonth(currentDate);
  const daysInMonth = getDaysInMonth(currentDate);

  for (let i = 0; i < firstDay; i++) {
    monthDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    monthDays.push(i);
  }

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  const getDateString = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  // 全屏日记详情模态框
  const expandedEntries = expandedDate ? entries.filter(entry => entry.createdAt.split(' ')[0] === expandedDate) : [];
  const expandedPhotos = expandedDate ? photos.filter(photo => (photo.uploadDate || photo.createdAt.split(' ')[0]) === expandedDate) : [];

  if (expandedDate) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl h-5/6 sm:h-auto sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
          {/* 顶部关闭按钮和日期 */}
          <div className="bg-gradient-to-r from-pink-500 to-pink-400 px-6 py-4 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-white">{expandedDate}</h3>
              <p className="text-xs text-pink-100">{expandedEntries.length} 篇日记 · {expandedPhotos.length} 张照片</p>
            </div>
            <button
              onClick={() => setExpandedDate(null)}
              className="text-white hover:bg-pink-600 p-2 rounded-full transition-colors"
            >
              ✕
            </button>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* 日记列表 */}
            {expandedEntries.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <BookOpen size={48} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">这天还没有日记</p>
              </div>
            ) : (
              <div className="space-y-4">
                {expandedEntries.map(entry => (
                  <div
                    key={entry.objectId}
                    className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-bold text-pink-600">
                        {entry.author === 'boy' ? '👦 他' : '👧 她'}
                      </span>
                      <button
                        onClick={() => handleDelete(entry.objectId)}
                        className="text-gray-300 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap break-words">{entry.text}</p>
                    <p className="text-xs text-gray-400 mt-2">{entry.createdAt}</p>
                  </div>
                ))}
              </div>
            )}

            {/* 照片列表 */}
            {expandedPhotos.length > 0 && (
              <div>
                <h4 className="font-bold text-gray-800 mb-3 text-sm">📸 照片 ({expandedPhotos.length})</h4>
                <div className="grid grid-cols-2 gap-3">
                  {expandedPhotos.map(photo => (
                    <div key={photo.objectId} className="relative group">
                      <div className="bg-gray-100 rounded-xl overflow-hidden">
                        {photo.photoUrl && (
                          <img src={photo.photoUrl} alt={photo.caption} className="w-full h-48 object-cover" />
                        )}
                        {photo.photoBase64 && !photo.photoUrl && (
                          <img src={`data:image/jpeg;base64,${photo.photoBase64}`} alt={photo.caption} className="w-full h-48 object-cover" />
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="bg-black/80 text-white px-3 py-1 rounded-lg text-xs text-center">
                          {photo.author === 'boy' ? '👦 他' : '👧 她'}
                        </div>
                      </div>
                      {photo.author === identity && (
                        <button
                          onClick={() => handleDeletePhoto(photo.objectId)}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                      <p className="text-xs text-gray-600 mt-2 line-clamp-2">{photo.caption}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 底部关闭按钮 */}
          <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
            <button
              onClick={() => setExpandedDate(null)}
              className="w-full py-3 bg-pink-500 text-white font-medium rounded-xl hover:bg-pink-600 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full relative flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">我们的日记</h2>
        <button onClick={() => setIsWriting(!isWriting)} className="bg-pink-500 text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 shadow-md hover:bg-pink-600 transition-colors"><Plus size={16} /> 写日记</button>
      </div>
      
      {isWriting && (
        <div className="mb-4 bg-gradient-to-br from-pink-50 to-white p-4 rounded-2xl shadow-lg border border-pink-100 animate-in fade-in slide-in-from-top-2">
          <p className="text-xs text-gray-500 mb-2">写日记给 {identity === 'boy' ? '👧 她' : '👦 他'}</p>
          <textarea 
            value={newText} 
            onChange={(e) => setNewText(e.target.value)} 
            placeholder="今天发生了什么，想对TA说的话..."
            className="w-full h-28 p-3 bg-white rounded-xl mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none border border-pink-100" 
          />

          {/* 日记弹窗中的照片上传 */}
          <div className="mb-3 bg-white rounded-xl p-3 border border-gray-100">
            <p className="text-xs text-gray-600 font-semibold mb-2">📸 添加照片（可选）</p>
            {photoPreview ? (
              <div className="mb-2">
                <img src={photoPreview} alt="预览" className="w-full h-32 object-cover rounded-lg mb-2" />
                <input
                  type="text"
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  placeholder="照片描述..."
                  className="w-full p-2 text-sm border border-gray-200 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
                <div className="flex gap-2">
                  <button onClick={() => {
                    setPhotoPreview(null);
                    setPhotoFile(null);
                  }} className="flex-1 px-2 py-1 text-gray-600 text-xs hover:bg-gray-100 rounded-lg font-medium">
                    取消照片
                  </button>
                  <button onClick={handleUploadPhoto} disabled={isUploadingPhoto} className="flex-1 px-2 py-1 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-1">
                    {isUploadingPhoto && <Loader2 className="animate-spin" size={12} />}
                    上传照片
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex items-center justify-center w-full p-2 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-pink-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <span className="text-xs text-gray-600">点击选择照片</span>
              </label>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => {
              setIsWriting(false);
              setPhotoPreview(null);
              setPhotoFile(null);
              setPhotoCaption('');
            }} className="px-4 py-2 text-gray-500 text-sm hover:bg-gray-100 rounded-lg font-medium">取消</button>
            <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 hover:bg-pink-600 disabled:opacity-50 transition-colors">
              {loading && <Loader2 className="animate-spin" size={14} />}
              保存并发布
            </button>
          </div>
        </div>
      )}

      {/* 日历部分 - 个性化设计 */}
      <div className="bg-gradient-to-br from-white via-pink-50 to-purple-50 rounded-3xl shadow-lg border-2 border-pink-100 p-5 mb-4">
        {/* 月份导航 */}
        <div className="flex justify-between items-center mb-6 px-2">
          <button 
            onClick={prevMonth} 
            className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 text-white flex items-center justify-center hover:shadow-lg transition-all hover:scale-110 font-bold"
          >
            ‹
          </button>
          <div className="text-center flex-1">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              {currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}
            </h3>
            <p className="text-xs text-gray-400 mt-1">记录我们的每一天</p>
          </div>
          <button 
            onClick={nextMonth}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-pink-500 text-white flex items-center justify-center hover:shadow-lg transition-all hover:scale-110 font-bold"
          >
            ›
          </button>
        </div>

        {/* 星期标头 */}
        <div className="grid grid-cols-7 gap-2 mb-3">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-bold text-gray-500 py-2 uppercase tracking-wide">{day}</div>
          ))}
        </div>

        {/* 日历网格 */}
        <div className="grid grid-cols-7 gap-2">
          {monthDays.map((day, idx) => {
            const dateStr = day ? getDateString(day) : null;
            const colorStatus = day ? getDateColorStatus(dateStr!) : null;
            const isSelected = day && dateStr === selectedDate;
            const today = isToday(day!);

            let bgColor = 'bg-white/50';
            let textColor = 'text-gray-600';
            let borderStyle = 'border-2 border-gray-100';
            let shadowStyle = '';
            let emoji = '';

            if (day) {
              if (isSelected) {
                bgColor = 'bg-gradient-to-br from-pink-500 to-purple-500';
                textColor = 'text-white';
                borderStyle = 'border-2 border-pink-600';
                shadowStyle = 'shadow-lg';
              } else if (today) {
                bgColor = 'bg-gradient-to-br from-pink-200 to-pink-100';
                borderStyle = 'border-2 border-pink-400';
                textColor = 'text-gray-800 font-bold';
                shadowStyle = 'shadow-md';
              } else {
                switch (colorStatus) {
                  case 'empty':
                    bgColor = 'bg-gray-50';
                    borderStyle = 'border-2 border-gray-200';
                    textColor = 'text-gray-400';
                    break;
                  case 'boy':
                    bgColor = 'bg-gradient-to-br from-blue-100 to-blue-50';
                    borderStyle = 'border-2 border-blue-300';
                    textColor = 'text-gray-800';
                    emoji = '👦';
                    break;
                  case 'girl':
                    bgColor = 'bg-gradient-to-br from-yellow-100 to-yellow-50';
                    borderStyle = 'border-2 border-yellow-300';
                    textColor = 'text-gray-800';
                    emoji = '👧';
                    break;
                  case 'both':
                    bgColor = 'bg-gradient-to-br from-pink-150 to-purple-100';
                    borderStyle = 'border-2 border-pink-400';
                    textColor = 'text-gray-800 font-bold';
                    emoji = '💑';
                    break;
                }
              }
            }

            return (
              <button
                key={idx}
                onClick={() => day && setExpandedDate(getDateString(day))}
                className={`aspect-square text-sm rounded-2xl font-semibold transition-all duration-200 ${
                  !day ? 'bg-transparent' : `${bgColor} ${textColor} hover:shadow-lg hover:scale-105 ${borderStyle} ${shadowStyle}`
                }`}
              >
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="leading-tight">{day}</div>
                  {emoji && <div className="text-xs mt-0.5">{emoji}</div>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 爱情文案区域 - 个性化 */}
      <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 rounded-3xl shadow-lg border-2 border-pink-300 p-6 mb-4 overflow-hidden relative">
        <div className="absolute top-0 right-0 opacity-10 text-6xl">💕</div>
        <div className="absolute bottom-0 left-0 opacity-10 text-6xl">💕</div>
        <div className="text-center relative z-10">
          <p className="text-sm text-white font-bold mb-3 tracking-widest">💝 每日情话</p>
          <p className="text-base text-white leading-relaxed italic font-medium drop-shadow-md">
            {loveQuotes[new Date().getDate() % 30]}
          </p>
        </div>
      </div>
    </div>
  );
}

function PlanView({ secretCode, identity, boyName, girlName }: { secretCode: string, identity: string, boyName: string, girlName: string }) {
  const [tasks, setTasks] = useState<PlanTask[]>([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow' | 'stats'>('today');
  const [refresh, setRefresh] = useState(0); // 用于触发重新加载
  const [modalType, setModalType] = useState<'completed' | 'incomplete' | 'boy' | 'girl' | 'dayBoy' | 'dayGirl' | 'calendar' | null>(null); // 模态窗口类型
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null); // 日历中选中的日期
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null); // 选中的日期

  const today = new Date();
  const todayDate = today.toISOString().split('T')[0];
  const tomorrowDate = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  useEffect(() => {
    let isMounted = true;
    
    const loadTasks = () => {
      if (!isMounted) return;
      // @ts-ignore
      const query = Bmob.Query("PlanTask");
      query.equalTo("secretCode", "==", secretCode);
      query.order("-createdAt");
      query.find().then((res: any) => {
        console.log("获取到计划任务:", res);
        if (isMounted && Array.isArray(res)) {
          res.forEach((task: any) => {
            console.log("任务详情:", {
              description: task.description,
              completed: task.completed,
              author: task.author,
              targetDate: task.targetDate,
              secretCode: task.secretCode,
              createdAt: task.createdAt
            });
          });
          setTasks(res as PlanTask[]);
        }
      }).catch((err: any) => {
        if (err.code !== 20004) {
          console.error("计划数据获取失败:", err);
        }
      });
    };
    
    loadTasks();
    // 改为10秒轮询，降低频率避免冲突
    const timer = setInterval(loadTasks, 10000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [secretCode, refresh]);

  const handleAddTask = (targetDate: string) => {
    if (!newTask.trim()) return;
    setLoading(true);
    console.log("开始添加计划任务:", { description: newTask, author: identity, targetDate, secretCode });

    // @ts-ignore
    const query = Bmob.Query("PlanTask");
    query.set("description", newTask);
    // @ts-ignore
    query.set("completed", false);
    query.set("author", identity);
    query.set("targetDate", targetDate);
    query.set("secretCode", secretCode);

    query.save().then(() => {
      console.log("计划任务保存成功");
      setNewTask('');
      setLoading(false);
      setRefresh(prev => prev + 1); // 触发重新加载
    }).catch((err: any) => {
      console.error("计划任务保存失败:", err);
      alert("添加失败: " + JSON.stringify(err));
      if(err.code === 20004) {
          alert("请确保已在Bmob后台创建 PlanTask 表，并包含以下字段：\n- description (字符串)\n- completed (布尔)\n- author (字符串)\n- targetDate (字符串)\n- secretCode (字符串)");
      }
      setLoading(false);
    });
  };

  const handleToggleComplete = (task: PlanTask) => {
    // @ts-ignore
    const query = Bmob.Query("PlanTask");
    
    try {
      const currentCompleted = task.completed === "true" || task.completed === true;
      
      // 立即更新本地状态，让用户有即时反馈
      setTasks(prevTasks => prevTasks.map(t => 
        t.objectId === task.objectId 
          ? { ...t, completed: !currentCompleted }
          : t
      ));
      
      // @ts-ignore
      query.update(task.objectId, {
        completed: !currentCompleted
      }).then(() => {
        console.log("任务更新成功");
        // 成功后短暂延迟再刷新，确保服务器数据已同步
        setTimeout(() => {
          setRefresh(prev => prev + 1);
        }, 500);
      }).catch((err: any) => {
        console.error('Error toggling task:', err);
        // 出错时恢复原状态
        setTasks(prevTasks => prevTasks.map(t => 
          t.objectId === task.objectId 
            ? { ...t, completed: currentCompleted }
            : t
        ));
        alert('更新失败: ' + JSON.stringify(err));
      });
    } catch (err) {
      console.error('Error in handleToggleComplete:', err);
    }
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('确定要删除此计划吗?')) return;
    // @ts-ignore
    const query = Bmob.Query("PlanTask");
    query.destroy(id).then(() => {
      setRefresh(prev => prev + 1); // 触发重新加载
    }).catch((err: any) => {
      alert("删除失败: " + JSON.stringify(err));
    });
  };

  // 按日期和作者分组任务
  const todayTasks = tasks.filter(t => t.targetDate === todayDate);
  const tomorrowTasks = tasks.filter(t => t.targetDate === tomorrowDate);

  const getTodayTasksByAuthor = (author: 'boy' | 'girl') => todayTasks.filter(t => t.author === author);
  const getTomorrowTasksByAuthor = (author: 'boy' | 'girl') => tomorrowTasks.filter(t => t.author === author);

  const todayCompletedBoy = getTodayTasksByAuthor('boy').filter(t => t.completed === "true" || t.completed === true).length;
  const todayTotalBoy = getTodayTasksByAuthor('boy').length;
  const todayCompletedGirl = getTodayTasksByAuthor('girl').filter(t => t.completed === "true" || t.completed === true).length;
  const todayTotalGirl = getTodayTasksByAuthor('girl').length;

  // 计算完成率 - 本周
  const weekStart = new Date(today);
  const dayOfWeek = today.getDay();
  // 计算本周周日的日期（如果今天是周日，则为今天；否则往前推到周日）
  // 注意：这样weekStart会是本周的周日，然后i=0-6对应日一到六再到日
  weekStart.setDate(today.getDate() - dayOfWeek);
  
  // 如果需要周一开始的周，可以用下面的逻辑
  // const weekStart = new Date(today);
  // const dayOfWeek = today.getDay();
  // weekStart.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  
  const getWeekData = () => {
    const data = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayTasks = tasks.filter(t => t.targetDate === dateStr);
      const completed = dayTasks.filter(t => t.completed === "true" || t.completed === true).length;
      const total = dayTasks.length;
      
      // 按作者分类
      const boyTasks = dayTasks.filter(t => t.author === 'boy');
      const boyCompleted = boyTasks.filter(t => t.completed === "true" || t.completed === true).length;
      const girlTasks = dayTasks.filter(t => t.author === 'girl');
      const girlCompleted = girlTasks.filter(t => t.completed === "true" || t.completed === true).length;
      
      const month = date.getMonth() + 1;
      const dayOfMonth = date.getDate();
      
      data.push({
        dateStr,
        date: ['日', '一', '二', '三', '四', '五', '六'][i],
        dateDisplay: `${month}-${String(dayOfMonth).padStart(2, '0')}`,
        completed,
        total,
        rate: total > 0 ? Math.round((completed / total) * 100) : 0,
        boyCompleted,
        boyTotal: boyTasks.length,
        girlCompleted,
        girlTotal: girlTasks.length
      });
    }
    return data;
  };

  const weekData = getWeekData();

  // 计算总体完成率
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed === "true" || t.completed === true).length;
  const overallRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="p-4 h-full relative flex flex-col">
      {/* 标签页切换 */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button 
          onClick={() => setActiveTab('today')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors whitespace-nowrap min-w-fit ${
            activeTab === 'today' 
              ? 'bg-pink-500 text-white shadow-md' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          今日总结
        </button>
        <button 
          onClick={() => setActiveTab('tomorrow')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors whitespace-nowrap min-w-fit ${
            activeTab === 'tomorrow' 
              ? 'bg-blue-500 text-white shadow-md' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          明日待办
        </button>
        <button 
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors whitespace-nowrap min-w-fit ${
            activeTab === 'stats' 
              ? 'bg-purple-500 text-white shadow-md' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📊 统计
        </button>
      </div>

      {/* 今日总结 */}
      {activeTab === 'today' && (
        <div className="flex-1 flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-800 mb-3">今天的事项</h3>
            
            {/* 统计卡片 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 border border-blue-200">
                <p className="text-xs text-blue-600 font-semibold">👦 {boyName}的进度</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">{todayCompletedBoy}/{todayTotalBoy}</p>
              </div>
              <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-3 border border-pink-200">
                <p className="text-xs text-pink-600 font-semibold">👧 {girlName}的进度</p>
                <p className="text-2xl font-bold text-pink-700 mt-1">{todayCompletedGirl}/{todayTotalGirl}</p>
              </div>
            </div>

            {/* 添加新任务 */}
            <div className="mb-4">
              <label className="text-xs text-gray-600 font-semibold block mb-2">添加今天的事项</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTask(todayDate)}
                  placeholder="例如: 完成项目文档"
                  className="flex-1 p-2 bg-white rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
                <button 
                  onClick={() => handleAddTask(todayDate)} 
                  disabled={loading}
                  className="px-3 py-2 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600 disabled:opacity-50 transition-colors flex items-center gap-1"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* 任务列表 */}
          <div className="flex-1 overflow-y-auto space-y-3 pb-4">
            {todayTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <CheckSquare size={40} className="mx-auto mb-2 opacity-20" />
                <p>今天没有计划任务</p>
              </div>
            ) : (
              <>
                {/* 男生任务 */}
                {getTodayTasksByAuthor('boy').length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">👦 {boyName}的任务</p>
                    <div className="space-y-2">
                      {getTodayTasksByAuthor('boy').map(task => (
                        <div 
                          key={task.objectId}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all group ${
                            task.completed 
                              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 shadow-sm' 
                              : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-300 shadow-md hover:shadow-lg'
                          }`}
                        >
                          <button
                            onClick={() => handleToggleComplete(task)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer font-bold ${
                              task.completed 
                                ? 'bg-green-500 border-green-500 text-white shadow-md' 
                                : 'border-blue-400 text-blue-400 hover:border-blue-600 hover:bg-blue-100 hover:scale-110 hover:shadow-md'
                            }`}
                          >
                            {task.completed ? '✓' : ''}
                          </button>
                          <span className={`text-sm flex-1 font-medium transition-all ${
                            task.completed 
                              ? 'line-through text-gray-500 opacity-60' 
                              : 'text-gray-800'
                          }`}>
                            {task.description}
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(task.objectId);
                            }}
                            className={`opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity p-1 ${
                              task.completed ? 'opacity-30' : ''
                            }`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 女生任务 */}
                {getTodayTasksByAuthor('girl').length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">👧 {girlName}的任务</p>
                    <div className="space-y-2">
                      {getTodayTasksByAuthor('girl').map(task => (
                        <div 
                          key={task.objectId}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all group ${
                            task.completed 
                              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 shadow-sm' 
                              : 'bg-gradient-to-r from-pink-50 to-rose-50 border-pink-300 shadow-md hover:shadow-lg'
                          }`}
                        >
                          <button
                            onClick={() => handleToggleComplete(task)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer font-bold ${
                              task.completed 
                                ? 'bg-green-500 border-green-500 text-white shadow-md' 
                                : 'border-pink-400 text-pink-400 hover:border-pink-600 hover:bg-pink-100 hover:scale-110 hover:shadow-md'
                            }`}
                          >
                            {task.completed ? '✓' : ''}
                          </button>
                          <span className={`text-sm flex-1 font-medium transition-all ${
                            task.completed 
                              ? 'line-through text-gray-500 opacity-60' 
                              : 'text-gray-800'
                          }`}>
                            {task.description}
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(task.objectId);
                            }}
                            className={`opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity p-1 ${
                              task.completed ? 'opacity-30' : ''
                            }`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 明日待办 */}
      {activeTab === 'tomorrow' && (
        <div className="flex-1 flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-800 mb-3">明天的计划</h3>
            
            {/* 添加新任务 */}
            <div className="mb-4">
              <label className="text-xs text-gray-600 font-semibold block mb-2">添加明天的事项</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTask(tomorrowDate)}
                  placeholder="例如: 准备会议资料"
                  className="flex-1 p-2 bg-white rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <button 
                  onClick={() => handleAddTask(tomorrowDate)} 
                  disabled={loading}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center gap-1"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-700 font-semibold">💡 提示</p>
              <p className="text-xs text-blue-600 mt-1">明天的计划只能查看，不能标记完成。明天时在"今日总结"中标记完成。</p>
            </div>
          </div>

          {/* 任务列表 */}
          <div className="flex-1 overflow-y-auto space-y-3 pb-4">
            {tomorrowTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <CheckSquare size={40} className="mx-auto mb-2 opacity-20" />
                <p>明天没有计划任务</p>
              </div>
            ) : (
              <>
                {/* 男生任务 */}
                {getTomorrowTasksByAuthor('boy').length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">👦 {boyName}的计划</p>
                    <div className="space-y-2">
                      {getTomorrowTasksByAuthor('boy').map(task => (
                        <div 
                          key={task.objectId}
                          className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200 group"
                        >
                          <div className="w-5 h-5 rounded-full border-2 border-blue-400 flex-shrink-0"></div>
                          <span className="text-sm text-gray-800 flex-1">{task.description}</span>
                          <button 
                            onClick={() => handleDelete(task.objectId)}
                            className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 女生任务 */}
                {getTomorrowTasksByAuthor('girl').length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">👧 {girlName}的计划</p>
                    <div className="space-y-2">
                      {getTomorrowTasksByAuthor('girl').map(task => (
                        <div 
                          key={task.objectId}
                          className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg border border-pink-200 group"
                        >
                          <div className="w-5 h-5 rounded-full border-2 border-pink-400 flex-shrink-0"></div>
                          <span className="text-sm text-gray-800 flex-1">{task.description}</span>
                          <button 
                            onClick={() => handleDelete(task.objectId)}
                            className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 统计标签页 */}
      {activeTab === 'stats' && (
        <div className="flex-1 overflow-y-auto pb-20 p-3">
          {/* 本周完成率统计卡片 */}
          <div className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 rounded-3xl shadow-xl p-5 text-white mb-4">
            <p className="text-sm opacity-90 font-semibold mb-3">本周任务统计</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/20 backdrop-blur rounded-2xl p-3 text-center">
                <p className="text-xs opacity-80 mb-1">👦 他</p>
                <p className="text-xl font-bold">{weekData.reduce((sum, d) => sum + (d.boyCompleted || 0), 0)}/{weekData.reduce((sum, d) => sum + (d.boyTotal || 0), 0)}</p>
                <p className="text-xs opacity-60 mt-1">已完成</p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-2xl p-3 text-center border-2 border-white/30">
                <p className="text-xs opacity-80 mb-1">总体</p>
                <p className="text-2xl font-bold">{overallRate}%</p>
                <p className="text-xs opacity-60 mt-1">完成率</p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-2xl p-3 text-center">
                <p className="text-xs opacity-80 mb-1">👧 她</p>
                <p className="text-xl font-bold">{weekData.reduce((sum, d) => sum + (d.girlCompleted || 0), 0)}/{weekData.reduce((sum, d) => sum + (d.girlTotal || 0), 0)}</p>
                <p className="text-xs opacity-60 mt-1">已完成</p>
              </div>
            </div>
          </div>

          {/* 本月统计 */}
          <div className="bg-white rounded-2xl p-4 border-2 border-gray-100 mb-4">
            <p className="text-sm font-bold text-gray-700 mb-3">📊 本月概览</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setModalType('calendar')}
                className="bg-blue-50 rounded-xl p-3 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all cursor-pointer"
              >
                <p className="text-xs text-blue-600 font-semibold">总任务数</p>
                <p className="text-2xl font-bold text-blue-700 mt-2">{totalTasks}</p>
              </button>
              <button 
                onClick={() => setModalType('completed')}
                className="bg-green-50 rounded-xl p-3 border border-green-200 hover:bg-green-100 hover:border-green-300 transition-all cursor-pointer"
              >
                <p className="text-xs text-green-600 font-semibold">已完成</p>
                <p className="text-2xl font-bold text-green-700 mt-2">{completedTasks}</p>
              </button>
              <button 
                onClick={() => setModalType('incomplete')}
                className="bg-purple-50 rounded-xl p-3 border border-purple-200 hover:bg-purple-100 hover:border-purple-300 transition-all cursor-pointer"
              >
                <p className="text-xs text-purple-600 font-semibold">未完成</p>
                <p className="text-2xl font-bold text-purple-700 mt-2">{totalTasks - completedTasks}</p>
              </button>
              <div className="bg-orange-50 rounded-xl p-3 border border-orange-200 text-center">
                <p className="text-xs text-orange-600 font-semibold">完成率</p>
                <p className="text-2xl font-bold text-orange-700 mt-2">{overallRate}%</p>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 mb-2">
            本周：{weekStart.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })} ~ {new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-3">📅 本周每日统计</h3>
          <div className="space-y-2 pb-4">
            {weekData.map((day, idx) => {
              const boyRate = day.boyTotal > 0 ? Math.round((day.boyCompleted / day.boyTotal) * 100) : 0;
              const girlRate = day.girlTotal > 0 ? Math.round((day.girlCompleted / day.girlTotal) * 100) : 0;
              return (
                <div key={idx} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-800">星期{day.date} {day.dateDisplay}</p>
                    </div>
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center flex-col cursor-pointer hover:from-pink-200 hover:to-purple-200 transition-colors">
                      <p className="font-bold text-pink-700 text-lg">{day.rate}%</p>
                      <p className="text-xs text-purple-600">{day.completed}/{day.total}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => {
                        setSelectedDayDate(day.dateStr);
                        setModalType('dayBoy');
                      }}
                      className="bg-blue-50 rounded-lg p-2 text-center border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all cursor-pointer"
                    >
                      <p className="text-xs text-blue-600">👦 {boyName}</p>
                      <p className="text-sm font-bold text-blue-700">{day.boyCompleted}/{day.boyTotal}</p>
                      <p className="text-xs text-blue-500 mt-0.5">{boyRate}%</p>
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedDayDate(day.dateStr);
                        setModalType('dayGirl');
                      }}
                      className="bg-pink-50 rounded-lg p-2 text-center border border-pink-200 hover:bg-pink-100 hover:border-pink-300 transition-all cursor-pointer"
                    >
                      <p className="text-xs text-pink-600">👧 {girlName}</p>
                      <p className="text-sm font-bold text-pink-700">{day.girlCompleted}/{day.girlTotal}</p>
                      <p className="text-xs text-pink-500 mt-0.5">{girlRate}%</p>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 日历模态窗口 */}
          {modalType === 'calendar' && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-4/5 overflow-y-auto shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">📅 任务日历</h2>
                  <button 
                    onClick={() => {
                      setModalType(null);
                      setSelectedCalendarDate(null);
                    }}
                    className="text-2xl text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {selectedCalendarDate ? (
                  // 显示选中日期的任务
                  <div>
                    <button
                      onClick={() => setSelectedCalendarDate(null)}
                      className="mb-4 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      ← 返回日历
                    </button>
                    <h3 className="text-lg font-bold text-gray-800 mb-3">
                      {selectedCalendarDate}的任务
                    </h3>
                    <div className="space-y-2">
                      {tasks.filter(t => t.targetDate === selectedCalendarDate).length === 0 ? (
                        <p className="text-center text-gray-400 py-4">当日无任务</p>
                      ) : (
                        tasks.filter(t => t.targetDate === selectedCalendarDate).map(task => (
                          <div key={task.objectId} className={`p-3 rounded-lg border-2 ${
                            task.completed ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
                          }`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-sm font-semibold ${
                                    task.completed ? 'text-green-700 line-through' : 'text-blue-700'
                                  }`}>
                                    {task.description}
                                  </span>
                                  <span className="text-xs px-2 py-1 rounded-full bg-gray-200">
                                    {task.author === 'boy' ? boyName : girlName}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {task.completed ? '✅ 已完成' : '⏳ 未完成'}
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  handleToggleComplete(task);
                                  setRefresh(prev => prev + 1);
                                }}
                                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                  task.completed
                                    ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                                }`}
                              >
                                {task.completed ? '取消' : '完成'}
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  // 显示日历
                  <div>
                    {(() => {
                      const today = new Date();
                      const year = today.getFullYear();
                      const month = today.getMonth();
                      const daysInMonth = new Date(year, month + 1, 0).getDate();
                      const firstDay = new Date(year, month, 1).getDay();
                      
                      // 计算每天的任务数
                      const taskCountByDate: { [key: string]: number } = {};
                      tasks.forEach(task => {
                        if (!taskCountByDate[task.targetDate]) {
                          taskCountByDate[task.targetDate] = 0;
                        }
                        taskCountByDate[task.targetDate]++;
                      });
                      
                      const days = [];
                      for (let i = 0; i < firstDay; i++) {
                        days.push(null);
                      }
                      for (let i = 1; i <= daysInMonth; i++) {
                        days.push(i);
                      }
                      
                      return (
                        <div>
                          <h3 className="text-center font-bold text-gray-800 mb-4">
                            {year}年{month + 1}月
                          </h3>
                          
                          {/* 星期行 */}
                          <div className="grid grid-cols-7 gap-2 mb-2">
                            {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                              <div key={day} className="text-center font-semibold text-xs text-gray-600">
                                {day}
                              </div>
                            ))}
                          </div>
                          
                          {/* 日期行 */}
                          <div className="grid grid-cols-7 gap-2">
                            {days.map((day, idx) => {
                              if (day === null) {
                                return <div key={`empty-${idx}`} className="p-2"></div>;
                              }
                              
                              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                              const taskCount = taskCountByDate[dateStr] || 0;
                              const isToday = dateStr === new Date().toISOString().split('T')[0];
                              
                              return (
                                <button
                                  key={day}
                                  onClick={() => setSelectedCalendarDate(dateStr)}
                                  className={`p-2 rounded-lg border-2 transition-all text-center ${
                                    isToday
                                      ? 'bg-pink-100 border-pink-300 font-bold'
                                      : taskCount > 0
                                      ? 'bg-blue-50 border-blue-300 hover:bg-blue-100'
                                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                  }`}
                                >
                                  <div className="text-sm font-semibold text-gray-800">{day}</div>
                                  {taskCount > 0 && (
                                    <div className="text-xs font-bold text-blue-600 mt-1">
                                      {taskCount}个
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 任务详情模态窗口 */}
          {modalType && modalType !== 'calendar' && (
            <div className="fixed inset-0 bg-black/50 flex items-end z-50">
              <div className="bg-white w-full rounded-t-3xl max-h-2/3 overflow-y-auto flex flex-col">
                <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between rounded-t-3xl">
                  <h2 className="text-lg font-bold">
                    {modalType === 'completed' && '✅ 已完成的任务'}
                    {modalType === 'incomplete' && '📝 未完成的任务'}
                    {modalType === 'boy' && `👦 ${boyName}的任务`}
                    {modalType === 'girl' && `👧 ${girlName}的任务`}
                    {modalType === 'dayBoy' && `👦 ${selectedDayDate} ${boyName}的任务`}
                    {modalType === 'dayGirl' && `👧 ${selectedDayDate} ${girlName}的任务`}
                  </h2>
                  <button 
                    onClick={() => setModalType(null)}
                    className="text-2xl text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex-1 p-4 space-y-2">
                  {(() => {
                    let filteredTasks: PlanTask[] = [];
                    if (modalType === 'completed') {
                      filteredTasks = tasks.filter(t => t.completed === "true" || t.completed === true);
                    } else if (modalType === 'incomplete') {
                      filteredTasks = tasks.filter(t => t.completed !== "true" && t.completed !== true);
                    } else if (modalType === 'boy') {
                      filteredTasks = tasks.filter(t => t.author === 'boy');
                    } else if (modalType === 'girl') {
                      filteredTasks = tasks.filter(t => t.author === 'girl');
                    } else if (modalType === 'dayBoy' && selectedDayDate) {
                      filteredTasks = tasks.filter(t => t.targetDate === selectedDayDate && t.author === 'boy');
                    } else if (modalType === 'dayGirl' && selectedDayDate) {
                      filteredTasks = tasks.filter(t => t.targetDate === selectedDayDate && t.author === 'girl');
                    }

                    if (filteredTasks.length === 0) {
                      return (
                        <div className="text-center py-8 text-gray-400">
                          <p>没有相关任务</p>
                        </div>
                      );
                    }

                    return filteredTasks.map(task => (
                      <div 
                        key={task.objectId}
                        className={`p-3 rounded-lg border-2 ${
                          task.completed 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-sm font-semibold ${
                                task.completed ? 'text-green-700 line-through' : 'text-blue-700'
                              }`}>
                                {task.description}
                              </span>
                              <span className="text-xs px-2 py-1 rounded-full bg-gray-200">
                                {task.author === 'boy' ? '👦 他' : '👧 她'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">
                              📅 {task.targetDate}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {task.completed ? '✅ 已完成' : '⏳ 未完成'}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              handleToggleComplete(task);
                              setRefresh(prev => prev + 1);
                            }}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                              task.completed
                                ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                          >
                            {task.completed ? '取消' : '完成'}
                          </button>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CalendarStats({ entries, selectedDate, setSelectedDate, boyName, girlName }: { entries: AccountingEntry[], selectedDate: string | null, setSelectedDate: (date: string | null) => void, boyName: string, girlName: string }) {
  // 按日期分组统计
  const dateStats = entries.reduce((acc: any, entry) => {
    const dateStr = entry.createdAt.split(' ')[0];
    if (!acc[dateStr]) {
      acc[dateStr] = { boy: 0, girl: 0, entries: [] };
    }
    const amount = parseFloat(String(entry.amount));
    if (entry.author === 'boy') {
      acc[dateStr].boy += amount;
    } else {
      acc[dateStr].girl += amount;
    }
    acc[dateStr].entries.push(entry);
    return acc;
  }, {});

  // 日历状态
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 1));
  
  // 获取当月的日期数组
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days: (number | null)[] = Array(firstDay).fill(null);
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // 获取选中日期的消费列表
  const selectedEntries = selectedDate ? dateStats[selectedDate]?.entries || [] : [];
  const selectedStat = selectedDate ? dateStats[selectedDate] : null;

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number | null) => {
    if (day === null) return;
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(selectedDate === dateStr ? null : dateStr);
  };

  const getDateString = (day: number) => {
    return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // 计算本月总消费
  const monthStats = Object.values(dateStats).reduce((acc: { boy: number; girl: number }, stat: any) => ({
    boy: acc.boy + stat.boy,
    girl: acc.girl + stat.girl,
  }), { boy: 0, girl: 0 });

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-y-auto pb-20 p-3">
      {/* 本月统计卡片 */}
      <div className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-3xl shadow-xl p-5 text-white">
        <p className="text-sm opacity-90 font-semibold mb-3">本月消费统计</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/20 backdrop-blur rounded-2xl p-3 text-center">
            <p className="text-xs opacity-80 mb-1">👦 他</p>
            <p className="text-xl font-bold">¥{monthStats.boy.toFixed(2)}</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-2xl p-3 text-center border-2 border-white/30">
            <p className="text-xs opacity-80 mb-1">合计</p>
            <p className="text-2xl font-bold">{(monthStats.boy + monthStats.girl).toFixed(2)}</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-2xl p-3 text-center">
            <p className="text-xs opacity-80 mb-1">👧 她</p>
            <p className="text-xl font-bold">¥{monthStats.girl.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* 日历容器 */}
      <div className="bg-gradient-to-br from-white via-blue-50 to-pink-50 rounded-3xl shadow-xl p-5 border border-white">
        {/* 月份导航 */}
        <div className="flex items-center justify-between mb-6 px-2">
          <button
            onClick={handlePrevMonth}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 text-white flex items-center justify-center hover:shadow-lg transition-all hover:scale-110 font-bold text-lg"
          >
            ‹
          </button>
          <div className="text-center flex-1 mx-4">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-pink-600 bg-clip-text text-transparent">
              {currentDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
            </h3>
          </div>
          <button
            onClick={handleNextMonth}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-500 text-white flex items-center justify-center hover:shadow-lg transition-all hover:scale-110 font-bold text-lg"
          >
            ›
          </button>
        </div>

        {/* 星期行 */}
        <div className="grid grid-cols-7 gap-2 mb-3">
          {['日', '一', '二', '三', '四', '五', '六'].map(day => (
            <div key={day} className="text-center text-xs font-bold text-gray-400 py-2 uppercase tracking-wide">
              {day}
            </div>
          ))}
        </div>

        {/* 日期网格 */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dateStr = getDateString(day);
            const stat = dateStats[dateStr];
            const isSelected = selectedDate === dateStr;
            const hasData = !!stat;

            return (
              <button
                key={dateStr}
                onClick={() => handleDateClick(day)}
                className={`aspect-square rounded-2xl transition-all duration-200 flex flex-col items-center justify-center text-sm font-semibold hover:shadow-lg border-2 ${
                  isSelected
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white border-purple-600 shadow-lg scale-105'
                    : hasData
                    ? 'bg-white border-purple-300 text-gray-800 hover:shadow-md hover:border-purple-400'
                    : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'
                }`}
              >
                <div className="leading-tight text-base font-bold">{day}</div>
                {hasData && (
                  <div className="w-full text-center mt-0.5 space-y-0.5">
                    {stat.boy > 0 && (
                      <div className={`text-[9px] font-bold leading-none ${isSelected ? 'text-white' : 'text-blue-600'}`}>
                        👦¥{stat.boy.toFixed(1)}
                      </div>
                    )}
                    {stat.girl > 0 && (
                      <div className={`text-[9px] font-bold leading-none ${isSelected ? 'text-white' : 'text-pink-600'}`}>
                        👧¥{stat.girl.toFixed(1)}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 日期详情弹窗（Modal） */}
      {selectedDate && selectedStat && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50">
          <div className="w-full max-w-md bg-gradient-to-br from-white to-purple-50 rounded-t-3xl border-t-2 border-purple-200 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom">
            {/* 标题栏 */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-white rounded-t-3xl p-5 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">
                  {new Date(selectedDate).toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                <p className="text-xs opacity-80 mt-1">共 {selectedEntries.length} 笔消费</p>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* 统计卡片 - 上方 */}
              <div className="space-y-3">
                {/* 总计 */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 text-white shadow-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold">当日总计</span>
                    <span className="text-3xl font-bold">¥{(selectedStat.boy + selectedStat.girl).toFixed(2)}</span>
                  </div>
                </div>

                {/* 性别分类 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl p-4 text-white shadow-md">
                    <p className="text-xs opacity-90 font-semibold mb-2">👦 {boyName}的消费</p>
                    <p className="text-2xl font-bold">¥{selectedStat.boy.toFixed(2)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-pink-400 to-pink-500 rounded-2xl p-4 text-white shadow-md">
                    <p className="text-xs opacity-90 font-semibold mb-2">👧 {girlName}的消费</p>
                    <p className="text-2xl font-bold">¥{selectedStat.girl.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="border-t-2 border-gray-200"></div>

              {/* 消费清单 - 下方 */}
              <div>
                <h4 className="text-lg font-bold text-gray-800 mb-3">消费详情</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                  {selectedEntries.length > 0 ? (
                    selectedEntries.map((entry: AccountingEntry) => (
                      <div key={entry.objectId} className={`p-3 rounded-xl transition-all ${entry.author === 'boy' ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-400' : 'bg-gradient-to-r from-pink-50 to-pink-100 border-l-4 border-pink-400'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{entry.author === 'boy' ? '👦' : '👧'}</span>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            entry.author === 'boy' ? 'bg-blue-300 text-blue-800' : 'bg-pink-300 text-pink-800'
                          }`}>
                            {entry.category}
                          </span>
                          <span className="text-sm font-medium text-gray-700 flex-1 truncate">{entry.description}</span>
                          <span className={`text-sm font-bold tabular-nums ${entry.author === 'boy' ? 'text-blue-600' : 'text-pink-600'}`}>
                            ¥{parseFloat(String(entry.amount)).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 ml-8">{entry.createdAt.split(' ')[1]}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-400 py-4">暂无消费记录</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 空状态 */}
      {Object.keys(dateStats).length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <DollarSign size={56} className="text-gray-200 mb-4" />
          <p className="text-gray-400 font-semibold">暂无记账数据</p>
          <p className="text-sm text-gray-300 mt-2">开始记账，统计数据将在这里显示</p>
        </div>
      )}
    </div>
  );
}

function AccountingView({ secretCode, identity, boyName, girlName }: { secretCode: string, identity: string, boyName: string, girlName: string }) {
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [allEntries, setAllEntries] = useState<AccountingEntry[]>([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('食物');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accountingTab, setAccountingTab] = useState<'list' | 'stats'>('list');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const categories = ['食物', '交通', '娱乐', '购物', '其他'];

  const fetchEntries = useCallback(() => {
    // @ts-ignore
    const query = Bmob.Query("Accounting");
    query.equalTo("secretCode", "==", secretCode);
    query.order("-createdAt");
    query.find().then((res: any) => {
      if (Array.isArray(res)) {
        // 保存所有数据用于统计
        setAllEntries(res as AccountingEntry[]);
        
        // 在客户端过滤只显示今日的记账
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayEntries = res.filter((entry: any) => {
          const entryDate = new Date(entry.createdAt);
          return entryDate >= today && entryDate < tomorrow;
        });
        
        setEntries(todayEntries as AccountingEntry[]);
      }
    }).catch((err: any) => {
      if (err.code !== 20004) {
        console.error("记账数据获取失败:", err);
      }
    });
  }, [secretCode]);

  useEffect(() => {
    let isMounted = true;
    const loadEntries = () => {
      if (isMounted) {
        fetchEntries();
      }
    };
    loadEntries();
    const timer = setInterval(loadEntries, 5000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [secretCode, fetchEntries]);

  const handleAdd = () => {
    if (!description.trim() || !amount.trim()) {
      alert("请填写完整的信息");
      return;
    }
    setLoading(true);
    console.log("开始保存记账...", { description, amount, category, identity, secretCode });

    // @ts-ignore
    const query = Bmob.Query("Accounting");
    query.set("description", description);
    query.set("amount", parseFloat(amount).toString());
    query.set("category", category);
    query.set("author", identity);
    query.set("secretCode", secretCode);

    query.save().then(() => {
      console.log("记账保存成功");
      setDescription('');
      setAmount('');
      setCategory('食物');
      setIsAdding(false);
      setLoading(false);
      fetchEntries();
    }).catch((err: any) => {
      console.error("记账保存失败:", err);
      alert("添加失败: " + JSON.stringify(err));
      if(err.code === 20004) {
          alert("请去Bmob后台创建 Accounting 表！");
      }
      setLoading(false);
    });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('确定要删除这条记账吗?')) return;
    // @ts-ignore
    const query = Bmob.Query("Accounting");
    query.destroy(id).then(() => {
      fetchEntries();
    }).catch((err: any) => {
      alert("删除失败: " + JSON.stringify(err));
    });
  };

  // 计算今日消费统计数据
  const todayBoyExpense = entries
    .filter(e => e.author === 'boy')
    .reduce((sum, e) => sum + parseFloat(String(e.amount)), 0);
  
  const todayGirlExpense = entries
    .filter(e => e.author === 'girl')
    .reduce((sum, e) => sum + parseFloat(String(e.amount)), 0);
  
  const todayTotalExpense = todayBoyExpense + todayGirlExpense;
  const todayDifference = Math.abs(todayBoyExpense - todayGirlExpense);
  const todayWhoOwes = todayBoyExpense > todayGirlExpense ? 'girl' : 'boy';

  return (
    <div className="p-4 h-full relative flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">记账</h2>
        <button onClick={() => setIsAdding(!isAdding)} className="bg-pink-500 text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 shadow-md hover:bg-pink-600 transition-colors">
          <Plus size={16} /> 记一笔
        </button>
      </div>

      {/* 标签页切换 */}
      <div className="flex gap-2 mb-4">
        <button 
          onClick={() => setAccountingTab('list')}
          className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
            accountingTab === 'list' 
              ? 'bg-pink-500 text-white shadow-md' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📝 今日
        </button>
        <button 
          onClick={() => setAccountingTab('stats')}
          className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
            accountingTab === 'stats' 
              ? 'bg-purple-500 text-white shadow-md' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📅 统计
        </button>
      </div>



      {/* 记录标签页 */}
      {accountingTab === 'list' && (
        <div className="flex-1 flex flex-col">
          {/* 新增表单 - 仅在isAdding时显示 */}
          {isAdding && (
            <div className="mb-4 bg-gradient-to-br from-pink-50 to-white p-4 rounded-2xl shadow-lg border border-pink-100 animate-in fade-in">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-600 font-semibold block mb-1">项目描述</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="例如: 电影票"
                    className="w-full p-2 bg-white rounded-lg border border-pink-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-semibold block mb-1">金额 (元)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full p-2 bg-white rounded-lg border border-pink-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-semibold block mb-1">分类</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 bg-white rounded-lg border border-pink-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-500 text-sm hover:bg-gray-100 rounded-lg font-medium">取消</button>
                  <button onClick={handleAdd} disabled={loading} className="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 hover:bg-pink-600 disabled:opacity-50 transition-colors">
                    {loading && <Loader2 className="animate-spin" size={14} />}
                    保存
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 今日消费统计卡片 */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200">
              <p className="text-xs text-blue-600 font-semibold mb-1">👦 他今日消费</p>
              <p className="text-2xl font-bold text-blue-700">¥{todayBoyExpense.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-4 border border-pink-200">
              <p className="text-xs text-pink-600 font-semibold mb-1">👧 她今日消费</p>
              <p className="text-2xl font-bold text-pink-700">¥{todayGirlExpense.toFixed(2)}</p>
            </div>
          </div>

          {/* 今日总计与欠款 */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 text-white shadow-lg mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold">今日总消费</span>
              <span className="text-2xl font-bold">¥{todayTotalExpense.toFixed(2)}</span>
            </div>
            {todayDifference > 0 && (
              <div className="text-xs text-white/80 bg-white/20 rounded-lg px-2 py-1 inline-block">
                {todayWhoOwes === 'boy' ? '👦 他' : '👧 她'} 需要给另一方 ¥{todayDifference.toFixed(2)}
              </div>
            )}
          </div>
        {/* 记账列表 */}
          <div className="flex-1 overflow-y-auto pb-20">
            {entries.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <DollarSign size={40} className="mx-auto mb-2 opacity-20" />
                <p>还没有记账记录</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 男生的记账 */}
                {entries.filter(e => e.author === 'boy').length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">👦</div>
                      <p className="text-sm font-bold text-blue-700">{boyName}的消费</p>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                        ¥{entries.filter(e => e.author === 'boy').reduce((sum, e) => sum + parseFloat(String(e.amount)), 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {entries.filter(e => e.author === 'boy').map(entry => (
                        <div key={entry.objectId} className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border-2 border-blue-200 hover:shadow-sm transition-shadow group">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg shrink-0 bg-blue-100">
                            👦
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-blue-200 px-2 py-0.5 rounded text-blue-800 font-medium">{entry.category}</span>
                              <p className="text-sm font-medium text-gray-800 truncate">{entry.description}</p>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{entry.createdAt.split(' ')[0]}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-blue-700">¥{parseFloat(String(entry.amount)).toFixed(2)}</p>
                          </div>
                          <button 
                            onClick={() => handleDelete(entry.objectId)}
                            className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity p-1.5 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={14} className="text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 女生的记账 */}
                {entries.filter(e => e.author === 'girl').length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center text-white text-sm font-bold">👧</div>
                      <p className="text-sm font-bold text-pink-700">{girlName}的消费</p>
                      <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-semibold">
                        ¥{entries.filter(e => e.author === 'girl').reduce((sum, e) => sum + parseFloat(String(e.amount)), 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {entries.filter(e => e.author === 'girl').map(entry => (
                        <div key={entry.objectId} className="flex items-center gap-3 p-3 bg-pink-50 rounded-xl border-2 border-pink-200 hover:shadow-sm transition-shadow group">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg shrink-0 bg-pink-100">
                            👧
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-pink-200 px-2 py-0.5 rounded text-pink-800 font-medium">{entry.category}</span>
                              <p className="text-sm font-medium text-gray-800 truncate">{entry.description}</p>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{entry.createdAt.split(' ')[0]}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-pink-700">¥{parseFloat(String(entry.amount)).toFixed(2)}</p>
                          </div>
                          <button 
                            onClick={() => handleDelete(entry.objectId)}
                            className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity p-1.5 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={14} className="text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 统计标签页 */}
      {accountingTab === 'stats' && (
        <CalendarStats entries={allEntries} selectedDate={selectedDate} setSelectedDate={setSelectedDate} boyName={boyName} girlName={girlName} />
      )}
    </div>
  );
}

function GalleryView({ secretCode, identity }: { secretCode: string, identity: string }) {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);

  const fetchPhotos = useCallback(() => {
    // @ts-ignore
    const query = Bmob.Query("PhotoEntry");
    query.equalTo("secretCode", "==", secretCode);
    query.order("-uploadDate");
    query.find().then((res: any) => {
      if (Array.isArray(res)) setPhotos(res as PhotoEntry[]);
    }).catch((err: any) => {
      if (err.code !== 20004) {
        console.error("相册数据获取失败:", err);
      }
    });
  }, [secretCode]);

  useEffect(() => {
    let isMounted = true;
    const loadPhotos = () => {
      if (isMounted) {
        fetchPhotos();
      }
    };
    loadPhotos();
    const timer = setInterval(loadPhotos, 5000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [secretCode, fetchPhotos]);

  const handleDeletePhoto = (id: string) => {
    if (!window.confirm('确定要删除这张照片吗?')) return;
    // @ts-ignore
    const query = Bmob.Query("PhotoEntry");
    query.destroy(id).then(() => {
      fetchPhotos();
    }).catch((err: any) => {
      alert("删除失败: " + JSON.stringify(err));
    });
  };

  // 按日期分组照片
  const photosByDate: { [key: string]: PhotoEntry[] } = {};
  photos.forEach(photo => {
    const date = photo.uploadDate || photo.createdAt.split(' ')[0];
    if (!photosByDate[date]) {
      photosByDate[date] = [];
    }
    photosByDate[date].push(photo);
  });

  const sortedDates = Object.keys(photosByDate).sort().reverse();

  return (
    <div className="p-4 h-full flex flex-col">
      <h2 className="text-lg font-bold text-gray-800 mb-4">相册</h2>

      {photos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
          <BookOpen size={48} className="mb-2 opacity-20" />
          <p className="text-sm">还没有上传任何照片</p>
          <p className="text-xs mt-1 text-gray-300">在日记功能中添加照片吧</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pb-4">
          <div className="space-y-6">
            {sortedDates.map(date => (
              <div key={date}>
                <h3 className="text-sm font-bold text-gray-600 mb-3 sticky top-0 bg-white/80 backdrop-blur py-2">📅 {date}</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {photosByDate[date].map(photo => (
                    <div 
                      key={photo.objectId}
                      className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group relative"
                    >
                      {photo.photoUrl && (
                        <img 
                          src={photo.photoUrl} 
                          alt={photo.caption || '照片'} 
                          className="w-full h-40 object-cover"
                        />
                      )}
                      {photo.photoBase64 && !photo.photoUrl && (
                        <img 
                          src={`data:image/jpeg;base64,${photo.photoBase64}`} 
                          alt={photo.caption || '照片'} 
                          className="w-full h-40 object-cover"
                        />
                      )}
                      
                      <div className="p-2 bg-white">
                        <p className="text-xs text-gray-700 line-clamp-2">{photo.caption || '无描述'}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-gray-500">{photo.author === 'boy' ? '👦' : '👧'}</span>
                          {photo.author === identity && (
                            <button
                              onClick={() => handleDeletePhoto(photo.objectId)}
                              className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                            >
                              <Trash2 size={12} className="text-red-500" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NavBtn({ icon: Icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg transition-all active:scale-95 min-w-fit ${active ? 'bg-pink-100 text-pink-500' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
      <Icon size={20} className={active ? 'fill-current' : ''} strokeWidth={active ? 2.5 : 2} />
      <span className="text-[9px] font-semibold">{label}</span>
    </button>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <App />
);
