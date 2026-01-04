import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
// 1. 引入 Bmob SDK (确保你已运行 npm install hydrogen-js-sdk)
import Bmob from "hydrogen-js-sdk";
import { 
  Heart, BookOpen, Smile,
  CheckCircle, Plus, Trash2, 
  Settings, Lock, Loader2, DollarSign, CheckSquare
} from 'lucide-react';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
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
  createdAt: string;
  secretCode: string;
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

function App() {
  const [secretCode, setSecretCode] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [identity, setIdentity] = useState<'boy' | 'girl'>('boy');
  const [currentView, setCurrentView] = useState<'home' | 'diary' | 'plan' | 'accounting' | 'mood' | 'gallery'>('home');

  // 检查本地存储
  useEffect(() => {
    const savedCode = localStorage.getItem('couple_secret_code');
    const savedIdentity = localStorage.getItem('couple_identity');
    if (savedCode && savedIdentity) {
      setSecretCode(savedCode);
      setIdentity(savedIdentity as any);
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (code: string, id: 'boy' | 'girl') => {
    if (!code.trim()) return;
    
    // 简单的本地校验通过，存入本地
    localStorage.setItem('couple_secret_code', code);
    localStorage.setItem('couple_identity', id);
    setSecretCode(code);
    setIdentity(id);
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
    <div className="flex flex-col h-screen bg-gray-50 font-sans text-gray-800 max-w-md mx-auto shadow-2xl overflow-hidden relative" style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <div className="bg-white px-4 py-3 shadow-sm z-10 flex justify-between items-center">
        <h1 className="text-xl font-bold text-pink-500 flex items-center gap-2">
          <Heart className="fill-pink-500 text-pink-500" size={20} />
          LoveSpace
        </h1>
        <div className="flex items-center gap-3">
          <div className="text-xs px-2 py-1 bg-pink-100 text-pink-600 rounded-full flex items-center gap-1">
             {identity === 'boy' ? '👦' : '👧'} <span className="font-bold">{secretCode}</span>
          </div>
          <button 
            onClick={() => {
              if (window.confirm('确定要退出登录吗？')) {
                handleLogout();
              }
            }}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="设置 & 退出"
          >
            <Settings size={20} className="text-gray-600 hover:text-gray-800" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20 scrollbar-hide">
        {currentView === 'home' && <HomeView key="home" />}
        {currentView === 'diary' && <DiaryView key="diary" secretCode={secretCode} identity={identity} />}
        {currentView === 'plan' && <PlanView key="plan" secretCode={secretCode} identity={identity} />}
        {currentView === 'accounting' && <AccountingView key="accounting" secretCode={secretCode} identity={identity} />}
        {currentView === 'mood' && <MoodView key="mood" secretCode={secretCode} identity={identity} />}
        {currentView === 'gallery' && <GalleryView key="gallery" secretCode={secretCode} identity={identity} />}
      </div>

      <div className="absolute bottom-0 w-full bg-white border-t border-gray-100 z-20">
        <div className="flex justify-around py-1 pb-4 px-1 overflow-x-auto scrollbar-hide">
          <NavBtn icon={Heart} label="首页" active={currentView === 'home'} onClick={() => setCurrentView('home')} />
          <NavBtn icon={BookOpen} label="日记" active={currentView === 'diary'} onClick={() => setCurrentView('diary')} />
          <NavBtn icon={CheckSquare} label="计划" active={currentView === 'plan'} onClick={() => setCurrentView('plan')} />
          <NavBtn icon={DollarSign} label="记账" active={currentView === 'accounting'} onClick={() => setCurrentView('accounting')} />
          <NavBtn icon={Smile} label="心情" active={currentView === 'mood'} onClick={() => setCurrentView('mood')} />
          <NavBtn icon={BookOpen} label="相册" active={currentView === 'gallery'} onClick={() => setCurrentView('gallery')} />
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// 子视图组件
// ------------------------------------------------------------------

function Onboarding({ onLogin }: { onLogin: (code: string, id: 'boy' | 'girl') => void }) {
  const [code, setCode] = useState('');
  const [role, setRole] = useState<'boy' | 'girl'>('boy');
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-pink-100 to-white px-6 text-center max-w-md mx-auto" style={{ minHeight: '100vh' }}>
      <div className="bg-white p-4 rounded-full shadow-lg mb-6 animate-bounce">
        <Heart size={48} className="text-pink-500 fill-pink-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">欢迎来到我们的专属空间</h1>
      <p className="text-gray-500 mb-8 text-sm">请输入只有我们知道的暗号</p>
      <div className="w-full space-y-4 bg-white p-6 rounded-2xl shadow-sm">
        <div>
          <label className="block text-left text-xs font-semibold text-gray-400 mb-1">暗号 (房间号)</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={16} />
            <input 
              type="text" 
              value={code} 
              placeholder="例如: 5201314"
              onChange={(e) => setCode(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500" 
            />
          </div>
        </div>
        <div>
          <label className="block text-left text-xs font-semibold text-gray-400 mb-2">我是...</label>
          <div className="flex gap-4">
            <button onClick={() => setRole('boy')} className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 ${role === 'boy' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-gray-100 text-gray-400'}`}>👦 男生</button>
            <button onClick={() => setRole('girl')} className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 ${role === 'girl' ? 'bg-pink-50 border-pink-500 text-pink-600' : 'border-gray-100 text-gray-400'}`}>👧 女生</button>
          </div>
        </div>
        <button onClick={() => onLogin(code, role)} disabled={!code} className="w-full py-3 bg-pink-500 text-white rounded-xl font-semibold shadow-md active:scale-95 transition-transform disabled:opacity-50">开启</button>
      </div>
    </div>
  );
}

function HomeView() {
  const startDate = new Date('2025-07-04'); 
  const diffDays = Math.ceil(Math.abs(new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [tasks, setTasks] = useState<PlanTask[]>([]);
  const [accountingEntries, setAccountingEntries] = useState<AccountingEntry[]>([]);
  const [moods, setMoodEntries] = useState<MoodEntry[]>([]);

  useEffect(() => {
    let isMounted = true;
    // 获取所有数据用于首页展示（不需要 secretCode，因为这是登录后的首页）
    try {
      // @ts-ignore
      const diaryQuery = Bmob.Query("Diary");
      if (diaryQuery) {
        diaryQuery.order("-createdAt");
        diaryQuery.find().then((res: any) => {
          if (isMounted && Array.isArray(res) && res.length > 0) {
            setEntries(res.slice(0, 3) as DiaryEntry[]);
          }
        }).catch((err: any) => {
          console.log("日记加载失败:", err);
        });
      }

      // @ts-ignore
      const planQuery = Bmob.Query("PlanTask");
      if (planQuery) {
        planQuery.order("-createdAt");
        planQuery.find().then((res: any) => {
          if (isMounted && Array.isArray(res) && res.length > 0) {
            setTasks(res.slice(0, 5) as PlanTask[]);
          }
        }).catch((err: any) => {
          console.log("任务加载失败:", err);
        });
      }

      // @ts-ignore
      const accountingQuery = Bmob.Query("Accounting");
      if (accountingQuery) {
        accountingQuery.find().then((res: any) => {
          if (isMounted && Array.isArray(res) && res.length > 0) {
            setAccountingEntries(res.slice(0, 5) as AccountingEntry[]);
          }
        }).catch((err: any) => {
          console.log("记账加载失败:", err);
        });
      }

      // @ts-ignore
      const moodQuery = Bmob.Query("MoodEntry");
      if (moodQuery) {
        moodQuery.order("-createdAt");
        moodQuery.find().then((res: any) => {
          if (isMounted && Array.isArray(res) && res.length > 0) {
            setMoodEntries(res.slice(0, 2) as MoodEntry[]);
          }
        }).catch((err: any) => {
          console.log("心情加载失败:", err);
        });
      }
    } catch (err) {
      console.error("HomeView 数据加载错误:", err);
    }
    return () => {
      isMounted = false;
    };
  }, []);

  // 计算统计数据
  const todayTasks = tasks.filter(t => t.targetDate === new Date().toISOString().split('T')[0]);
  const todayCompletedTasks = todayTasks.filter(t => t.completed === "true" || t.completed === true);
  const thisMonthExpense = accountingEntries.filter(e => {
    const entryDate = e.createdAt.split(' ')[0];
    const thisMonth = new Date().toISOString().slice(0, 7);
    return entryDate.slice(0, 7) === thisMonth;
  }).reduce((sum, e) => sum + parseFloat(String(e.amount)), 0);

  const moodEmojis: Record<string, string> = {
    happy: '😄', good: '😊', normal: '😐', sad: '😔', angry: '😠'
  };

  const recentMood = moods.length > 0 ? moods[0] : null;

  return (
    <div className="p-4 space-y-4 pb-4">
      {/* 纪念日卡片 */}
      <div className="bg-gradient-to-r from-pink-400 via-pink-500 to-red-400 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden transition-all hover:shadow-2xl">
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white opacity-10 rounded-full"></div>
        <div className="absolute -left-8 top-4 w-24 h-24 bg-white opacity-10 rounded-full"></div>
        <div className="relative z-10">
          <p className="text-pink-100 text-sm mb-1 font-medium">💕 我们已经相爱了</p>
          <h2 className="text-6xl font-black mb-2">{diffDays}</h2>
          <p className="text-pink-100 text-xs">天 • Since 2025.07.04</p>
        </div>
      </div>

      {/* 快捷操作卡片 */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-3 border border-blue-200 hover:shadow-md transition-shadow">
          <p className="text-2xl mb-1">📝</p>
          <p className="text-xs font-bold text-blue-900">{entries.length}</p>
          <p className="text-xs text-blue-700">篇日记</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-3 border border-green-200 hover:shadow-md transition-shadow">
          <p className="text-2xl mb-1">✅</p>
          <p className="text-xs font-bold text-green-900">{todayCompletedTasks.length}/{todayTasks.length}</p>
          <p className="text-xs text-green-700">今天任务</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-3 border border-purple-200 hover:shadow-md transition-shadow">
          <p className="text-2xl mb-1">💰</p>
          <p className="text-xs font-bold text-purple-900">¥{thisMonthExpense.toFixed(0)}</p>
          <p className="text-xs text-purple-700">本月消费</p>
        </div>
      </div>

      {/* 最新心情 */}
      {recentMood && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{moodEmojis[recentMood.mood] || '😊'}</div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-800">{recentMood.author === 'boy' ? '👦 他' : '👧 她'}的心情</p>
              <p className="text-xs text-gray-500">{recentMood.recordDate}</p>
              {recentMood.note && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{recentMood.note}</p>}
            </div>
          </div>
        </div>
      )}

      {/* 最近日记 */}
      {entries.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-800 mb-2 text-sm flex items-center gap-2">
            <BookOpen size={16} className="text-pink-500" />
            最近的日记
          </h3>
          <div className="space-y-2">
            {entries.slice(0, 2).map(entry => (
              <div key={entry.objectId} className={`p-3 rounded-xl border transition-all ${entry.author === 'boy' ? 'bg-blue-50 border-blue-200' : 'bg-pink-50 border-pink-200'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-600">{entry.author === 'boy' ? '👦' : '👧'} {entry.createdAt.split(' ')[0]}</p>
                    <p className="text-sm text-gray-800 mt-1 line-clamp-2">{entry.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 待办任务 */}
      {todayTasks.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-800 mb-2 text-sm flex items-center gap-2">
            <CheckSquare size={16} className="text-green-500" />
            今天的计划 ({todayCompletedTasks.length}/{todayTasks.length})
          </h3>
          <div className="space-y-1">
            {todayTasks.slice(0, 3).map(task => {
              const isCompleted = task.completed === "true" || task.completed === true;
              return (
                <div key={task.objectId} className={`flex items-center gap-2 p-2 rounded-lg text-xs ${isCompleted ? 'bg-gray-100 text-gray-400' : 'bg-white border border-gray-100'}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}></div>
                  <span className={isCompleted ? 'line-through' : ''}>{task.description}</span>
                  <span className="ml-auto flex-shrink-0 text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">
                    {task.author === 'boy' ? '👦' : '👧'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 本月消费摘要 */}
      {accountingEntries.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-800 mb-2 text-sm flex items-center gap-2">
            <DollarSign size={16} className="text-yellow-500" />
            本月消费摘要
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 border border-blue-200">
              <p className="text-xs text-blue-600">👦 他花了</p>
              <p className="text-lg font-bold text-blue-700">¥{accountingEntries.filter(e => e.author === 'boy' && e.createdAt.split(' ')[0].slice(0, 7) === new Date().toISOString().slice(0, 7)).reduce((sum, e) => sum + parseFloat(String(e.amount)), 0).toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-3 border border-pink-200">
              <p className="text-xs text-pink-600">👧 她花了</p>
              <p className="text-lg font-bold text-pink-700">¥{accountingEntries.filter(e => e.author === 'girl' && e.createdAt.split(' ')[0].slice(0, 7) === new Date().toISOString().slice(0, 7)).reduce((sum, e) => sum + parseFloat(String(e.amount)), 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* 温馨提示 */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200">
        <p className="text-xs text-amber-900 font-semibold mb-1">💡 温馨提示</p>
        <p className="text-xs text-amber-800 leading-relaxed">
          {todayTasks.length === 0 
            ? "今天还没有计划呢，去计划一下吧！"
            : todayCompletedTasks.length === todayTasks.length
            ? "太棒了！今天的计划都完成了 🎉"
            : `还有 ${todayTasks.length - todayCompletedTasks.length} 个计划待完成，加油！💪`
          }
        </p>
      </div>
    </div>
  );
}

function DiaryView({ secretCode, identity }: { secretCode: string, identity: string }) {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [newText, setNewText] = useState('');
  const [isWriting, setIsWriting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedDate, setExpandedDate] = useState<string | null>(null); // 用于全屏展示
  const [refresh, setRefresh] = useState(0); // 用于触发重新加载
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchPhotosData = () => {
      if (!isMounted) return;
      // @ts-ignore
      const query = Bmob.Query("PhotoEntry");
      query.equalTo("secretCode", "==", secretCode);
      query.order("-uploadDate");
      query.find().then((res: any) => {
        if (isMounted && Array.isArray(res)) setPhotos(res as PhotoEntry[]);
      }).catch(() => {});
    };

    fetchPhotosData();
    const photoTimer = setInterval(fetchPhotosData, 5000);
    
    const fetchDiariesData = () => {
      if (!isMounted) return;
      // @ts-ignore
      const query = Bmob.Query("Diary");
      query.equalTo("secretCode", "==", secretCode);
      query.order("-createdAt");
      query.find().then((res: any) => {
        if (isMounted && Array.isArray(res)) {
          console.log("获取到日记数据:", res);
          res.forEach((entry: any) => {
            console.log("日记条目:", {
              text: entry.text,
              author: entry.author,
              createdAt: entry.createdAt,
              createdAtType: typeof entry.createdAt
            });
          });
          setEntries(res as DiaryEntry[]);
        }
      }).catch((err: any) => {
        if (err.code !== 20004) {
           console.error("日记获取失败:", err);
        }
      });
    };

    fetchDiariesData();
    const diaryTimer = setInterval(fetchDiariesData, 5000);

    return () => {
      isMounted = false;
      clearInterval(photoTimer);
      clearInterval(diaryTimer);
    };
  }, [secretCode, refresh]);

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
          
          // 计算压缩尺寸（最大边长限制为 800px）
          const maxSize = 800;
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
          
          // 使用较低的质量进行压缩（0.6 = 60% 质量）
          let quality = 0.7;
          let compressedData = canvas.toDataURL('image/jpeg', quality);
          
          // 如果压缩后的数据还是太大，继续降低质量
          while (compressedData.length > 50000 && quality > 0.2) {
            quality -= 0.1;
            compressedData = canvas.toDataURL('image/jpeg', quality);
          }
          
          resolve(compressedData.split(',')[1] || '');
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
      
      // 检查压缩后的大小
      const estimatedSize = Math.ceil(base64.length * 0.75); // Base64 转换后的实际大小
      console.log(`压缩后图片大小: ${(estimatedSize / 1024).toFixed(2)} KB`);
      
      if (estimatedSize > 50000) {
        alert("图片仍然太大，请选择更小的图片或使用低分辨率图片");
        setIsUploadingPhoto(false);
        return;
      }
      
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
        setRefresh(prev => prev + 1);
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
      setRefresh(prev => prev + 1);
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
        setRefresh(prev => prev + 1);
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
      setRefresh(prev => prev + 1);
    }).catch((err: any) => {
      alert("删除失败: " + JSON.stringify(err));
    });
  }

  // 获取选中日期的日记
  const selectedDayEntries = entries.filter(entry => {
    const entryDate = entry.createdAt.split(' ')[0]; // Bmob 格式: "2026-01-04 20:52:07"
    console.log("比较日期:", { entryDate, selectedDate, match: entryDate === selectedDate });
    return entryDate === selectedDate;
  });

  // 获取选中日期的照片
  const selectedDayPhotos = photos.filter(photo => {
    const photoDate = photo.uploadDate || photo.createdAt.split(' ')[0];
    return photoDate === selectedDate;
  });

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

  // 获取有日记的日期列表
  const daysWithEntries = new Set(entries.map(entry => entry.createdAt.split(' ')[0]));

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
    return date.toISOString().split('T')[0];
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
        <div className="bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl h-5/6 sm:h-auto sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 sm:zoom-in-95">
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
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsWriting(false)} className="px-4 py-2 text-gray-500 text-sm hover:bg-gray-100 rounded-lg font-medium">取消</button>
            <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 hover:bg-pink-600 disabled:opacity-50 transition-colors">
              {loading && <Loader2 className="animate-spin" size={14} />}
              保存并发布
            </button>
          </div>
        </div>
      )}

      {/* 照片上传 */}
      {selectedDate === new Date().toISOString().split('T')[0] && (
        <div className="mb-4 bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-xs text-gray-600 font-semibold mb-3">📸 为今天添加照片</p>
          
          {photoPreview ? (
            <div className="mb-3">
              <img src={photoPreview} alt="预览" className="w-full h-40 object-cover rounded-lg mb-2" />
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
                }} className="flex-1 px-3 py-2 text-gray-600 text-sm hover:bg-gray-100 rounded-lg font-medium">
                  取消
                </button>
                <button onClick={handleUploadPhoto} disabled={isUploadingPhoto} className="flex-1 px-3 py-2 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600 disabled:opacity-50 flex items-center justify-center gap-1">
                  {isUploadingPhoto && <Loader2 className="animate-spin" size={14} />}
                  上传
                </button>
              </div>
            </div>
          ) : (
            <label className="flex items-center justify-center w-full p-3 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-pink-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <span className="text-sm text-gray-600">点击选择照片</span>
            </label>
          )}
        </div>
      )}


      {/* 日历部分 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex justify-between items-center mb-4">
          <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-lg text-gray-600">&lt;</button>
          <h3 className="font-bold text-gray-800">{currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}</h3>
          <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-lg text-gray-600">&gt;</button>
        </div>

        {/* 星期标头 */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">{day}</div>
          ))}
        </div>

        {/* 日历网格 */}
        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((day, idx) => {
            const dateStr = day ? getDateString(day) : null;
            const colorStatus = day ? getDateColorStatus(dateStr!) : null;
            const isSelected = day && dateStr === selectedDate;
            const today = isToday(day!);

            let bgColor = 'bg-transparent';
            let textColor = 'text-gray-600';
            let borderStyle = '';
            let showHeart = false;

            if (day) {
              if (isSelected) {
                bgColor = 'bg-pink-500';
                textColor = 'text-white';
              } else if (today) {
                bgColor = 'bg-pink-100';
                borderStyle = 'border-2 border-pink-300';
                textColor = 'text-gray-800';
              } else {
                switch (colorStatus) {
                  case 'empty':
                    bgColor = 'bg-gray-100';
                    textColor = 'text-gray-400';
                    break;
                  case 'boy':
                    bgColor = 'bg-green-100';
                    textColor = 'text-gray-800';
                    break;
                  case 'girl':
                    bgColor = 'bg-yellow-100';
                    textColor = 'text-gray-800';
                    break;
                  case 'both':
                    bgColor = 'bg-pink-100';
                    textColor = 'text-gray-800';
                    showHeart = true;
                    break;
                }
              }
            }

            return (
              <button
                key={idx}
                onClick={() => day && setExpandedDate(getDateString(day))}
                className={`aspect-square text-xs rounded-lg font-medium transition-all relative ${
                  !day ? 'bg-transparent' : `${bgColor} ${textColor} hover:shadow-sm ${borderStyle}`
                }`}
              >
                {day}
                {showHeart && !isSelected && !today && (
                  <div className="absolute top-0.5 right-0.5 text-pink-500 text-xs">♥</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 日记列表 */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="mb-3">
          <p className="text-xs text-gray-500 font-semibold">
            {selectedDate} 的日记 {selectedDayEntries.length > 0 && `(${selectedDayEntries.length})`}
          </p>
        </div>

        {selectedDayEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            <BookOpen size={40} className="mx-auto mb-2 opacity-20" />
            <p>这天还没有日记</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDayEntries.map(entry => (
              <div key={entry.objectId} className={`flex gap-3 animate-in fade-in ${entry.author === identity ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 border-2 border-white shadow-sm ${entry.author === 'boy' ? 'bg-blue-100' : 'bg-pink-100'}`}>
                  {entry.author === 'boy' ? '👦' : '👧'}
                </div>
                <div className={`p-4 rounded-2xl text-sm relative shadow-sm max-w-[80%] ${entry.author === identity ? 'bg-pink-500 text-white rounded-tr-none' : 'bg-white text-gray-700 rounded-tl-none border border-gray-100'}`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{entry.text}</p>
                  <div className={`flex items-center justify-between mt-2 ${entry.author === identity ? 'text-pink-100' : 'text-gray-400'}`}>
                    <span className="text-[10px]">
                      {new Date(entry.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {entry.author === identity && (
                      <button onClick={() => handleDelete(entry.objectId)} className="opacity-60 hover:opacity-100 transition-opacity">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 照片列表 */}
      {selectedDayPhotos.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 font-semibold mb-3">📷 照片 ({selectedDayPhotos.length})</p>
          <div className="grid grid-cols-3 gap-2 pb-20">
            {selectedDayPhotos.map(photo => (
              <div key={photo.objectId} className="relative group">
                {photo.photoUrl ? (
                  <img src={photo.photoUrl} alt={photo.caption} className="w-full h-24 object-cover rounded-lg" />
                ) : photo.photoBase64 ? (
                  <img src={`data:image/jpeg;base64,${photo.photoBase64}`} alt={photo.caption} className="w-full h-24 object-cover rounded-lg" />
                ) : null}
                {photo.author === identity && (
                  <button
                    onClick={() => handleDeletePhoto(photo.objectId)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-red-500 text-white rounded"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 py-0.5 truncate rounded-b-lg">
                    {photo.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PlanView({ secretCode, identity }: { secretCode: string, identity: string }) {
  const [tasks, setTasks] = useState<PlanTask[]>([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow' | 'stats'>('today');
  const [refresh, setRefresh] = useState(0); // 用于触发重新加载

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
          alert("计划数据获取失败: " + JSON.stringify(err));
        }
      });
    };
    
    loadTasks();
    const timer = setInterval(loadTasks, 5000);
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
    query.set("completed", "false");
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
    query.get(task.objectId).then((res: any) => {
      const currentCompleted = res.get("completed") === "true" || res.get("completed") === true;
      res.set("completed", currentCompleted ? "false" : "true");
      res.save().then(() => setRefresh(prev => prev + 1)); // 触发重新加载
    });
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
  weekStart.setDate(today.getDate() - today.getDay());
  
  const getWeekData = () => {
    const data = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayTasks = tasks.filter(t => t.targetDate === dateStr);
      const completed = dayTasks.filter(t => t.completed === "true" || t.completed === true).length;
      const total = dayTasks.length;
      data.push({
        date: ['日', '一', '二', '三', '四', '五', '六'][i],
        completed,
        total,
        rate: total > 0 ? Math.round((completed / total) * 100) : 0
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
                <p className="text-xs text-blue-600 font-semibold">👦 他的进度</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">{todayCompletedBoy}/{todayTotalBoy}</p>
              </div>
              <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-3 border border-pink-200">
                <p className="text-xs text-pink-600 font-semibold">👧 她的进度</p>
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
                    <p className="text-xs font-semibold text-gray-500 mb-2">👦 他的任务</p>
                    <div className="space-y-2">
                      {getTodayTasksByAuthor('boy').map(task => (
                        <div 
                          key={task.objectId}
                          onClick={() => handleToggleComplete(task)}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer group ${
                            task.completed 
                              ? 'bg-gray-50 border-gray-200 opacity-60' 
                              : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            task.completed 
                              ? 'bg-green-500 border-green-500' 
                              : 'border-blue-400'
                          }`}>
                            {task.completed && <CheckCircle size={16} className="text-white" />}
                          </div>
                          <span className={`text-sm flex-1 ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                            {task.description}
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(task.objectId);
                            }}
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
                {getTodayTasksByAuthor('girl').length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">👧 她的任务</p>
                    <div className="space-y-2">
                      {getTodayTasksByAuthor('girl').map(task => (
                        <div 
                          key={task.objectId}
                          onClick={() => handleToggleComplete(task)}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer group ${
                            task.completed 
                              ? 'bg-gray-50 border-gray-200 opacity-60' 
                              : 'bg-pink-50 border-pink-200 hover:bg-pink-100'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            task.completed 
                              ? 'bg-green-500 border-green-500' 
                              : 'border-pink-400'
                          }`}>
                            {task.completed && <CheckCircle size={16} className="text-white" />}
                          </div>
                          <span className={`text-sm flex-1 ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                            {task.description}
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(task.objectId);
                            }}
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
                    <p className="text-xs font-semibold text-gray-500 mb-2">👦 他的计划</p>
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
                    <p className="text-xs font-semibold text-gray-500 mb-2">👧 她的计划</p>
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
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <p className="text-xs text-blue-600 font-semibold">总任务完成率</p>
              <p className="text-3xl font-bold text-blue-700 mt-2">{overallRate}%</p>
              <p className="text-xs text-blue-600 mt-1">{completedTasks}/{totalTasks}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <p className="text-xs text-green-600 font-semibold">本周任务</p>
              <p className="text-3xl font-bold text-green-700 mt-2">{weekData.reduce((sum, d) => sum + d.completed, 0)}/{weekData.reduce((sum, d) => sum + d.total, 0)}</p>
              <p className="text-xs text-green-600 mt-1">已完成</p>
            </div>
          </div>

          <h3 className="text-lg font-bold text-gray-800 mb-3">本周完成趋势</h3>
          {weekData.some(d => d.total > 0) ? (
            <div className="bg-white rounded-xl p-4 mb-4">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={weekData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" label={{ value: '完成数', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: '完成率(%)', angle: 90, position: 'insideRight' }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="completed" stroke="#3b82f6" name="已完成" />
                  <Line yAxisId="right" type="monotone" dataKey="rate" stroke="#10b981" name="完成率" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">本周暂无任务</div>
          )}

          <h3 className="text-lg font-bold text-gray-800 mb-3 mt-4">本周每日统计</h3>
          <div className="space-y-2 pb-4">
            {weekData.map((day, idx) => (
              <div key={idx} className="bg-white rounded-lg p-3 flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">星期{day.date}</p>
                  <p className="text-xs text-gray-500">{day.completed}/{day.total} 完成</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                  <p className="font-bold text-blue-700">{day.rate}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AccountingView({ secretCode, identity }: { secretCode: string, identity: string }) {
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('食物');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accountingTab, setAccountingTab] = useState<'list' | 'stats'>('list');

  const categories = ['食物', '交通', '娱乐', '购物', '其他'];

  const fetchEntries = useCallback(() => {
    // @ts-ignore
    const query = Bmob.Query("Accounting");
    query.equalTo("secretCode", "==", secretCode);
    query.order("-createdAt");
    query.find().then((res: any) => {
      if (Array.isArray(res)) {
        setEntries(res as AccountingEntry[]);
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

  // 计算统计数据
  const boyTotal = entries
    .filter(e => e.author === 'boy')
    .reduce((sum, e) => sum + parseFloat(String(e.amount)), 0);
  
  const girlTotal = entries
    .filter(e => e.author === 'girl')
    .reduce((sum, e) => sum + parseFloat(String(e.amount)), 0);
  
  const totalExpense = boyTotal + girlTotal;
  const difference = Math.abs(boyTotal - girlTotal);
  const whoOwes = boyTotal > girlTotal ? 'girl' : 'boy';

  // 按分类统计消费
  const expenseByCategory = entries.reduce((acc: any, entry) => {
    const cat = entry.category;
    const amount = parseFloat(String(entry.amount));
    const existing = acc.find((item: any) => item.name === cat);
    if (existing) {
      existing.value += amount;
    } else {
      acc.push({ name: cat, value: amount });
    }
    return acc;
  }, []);

  // 按人统计总消费
  const expenseByAuthor = [
    { name: '👦 他', value: boyTotal },
    { name: '👧 她', value: girlTotal }
  ];

  const COLORS = ['#ec4899', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'];

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
          📝 记录
        </button>
        <button 
          onClick={() => setAccountingTab('stats')}
          className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
            accountingTab === 'stats' 
              ? 'bg-purple-500 text-white shadow-md' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          💰 统计
        </button>
      </div>

      {/* 记录标签页 */}
      {accountingTab === 'list' && (
        <>
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

          {/* 统计卡片 */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200">
              <p className="text-xs text-blue-600 font-semibold mb-1">👦 他花了</p>
              <p className="text-2xl font-bold text-blue-700">¥{boyTotal.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-4 border border-pink-200">
              <p className="text-xs text-pink-600 font-semibold mb-1">👧 她花了</p>
              <p className="text-2xl font-bold text-pink-700">¥{girlTotal.toFixed(2)}</p>
            </div>
          </div>

          {/* 总计与欠款 */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 text-white shadow-lg mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold">总消费</span>
              <span className="text-2xl font-bold">¥{totalExpense.toFixed(2)}</span>
            </div>
            {difference > 0 && (
              <div className="text-xs text-white/80 bg-white/20 rounded-lg px-2 py-1 inline-block">
                {whoOwes === 'boy' ? '👦 他' : '👧 她'} 需要给另一方 ¥{difference.toFixed(2)}
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
              <div className="space-y-2">
                {entries.map(entry => (
                  <div key={entry.objectId} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition-shadow group">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${entry.author === 'boy' ? 'bg-blue-100' : 'bg-pink-100'}`}>
                      {entry.author === 'boy' ? '👦' : '👧'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{entry.category}</span>
                        <p className="text-sm font-medium text-gray-800 truncate">{entry.description}</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{entry.createdAt.split(' ')[0]}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-800">¥{parseFloat(String(entry.amount)).toFixed(2)}</p>
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
            )}
          </div>
        </>
      )}

      {/* 统计标签页 */}
      {accountingTab === 'stats' && (
        <div className="flex-1 overflow-y-auto">
          <h3 className="text-lg font-bold text-gray-800 mb-4">消费分类统计</h3>
          {expenseByCategory.length > 0 ? (
            <div className="bg-white rounded-xl p-4 mb-4">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ¥${value.toFixed(2)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseByCategory.map((entry: any, index: number) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `¥${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">暂无消费数据</div>
          )}

          <h3 className="text-lg font-bold text-gray-800 mb-3 mt-6">人均消费对比</h3>
          {expenseByAuthor.some(e => e.value > 0) ? (
            <div className="bg-white rounded-xl p-4 pb-20">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={expenseByAuthor}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `¥${value.toFixed(2)}`} />
                  <Bar dataKey="value" fill="#ec4899" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 pb-20">暂无消费数据</div>
          )}
        </div>
      )}
    </div>
  );
}

// 心情追踪视图
function MoodView({ secretCode, identity }: { secretCode: string, identity: string }) {
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [selectedMood, setSelectedMood] = useState<'happy' | 'good' | 'normal' | 'sad' | 'angry'>('good');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const moodEmojis = {
    happy: { emoji: '😄', label: '开心', color: 'bg-yellow-100 border-yellow-300' },
    good: { emoji: '😊', label: '不错', color: 'bg-green-100 border-green-300' },
    normal: { emoji: '😐', label: '一般', color: 'bg-blue-100 border-blue-300' },
    sad: { emoji: '😔', label: '难过', color: 'bg-purple-100 border-purple-300' },
    angry: { emoji: '😠', label: '生气', color: 'bg-red-100 border-red-300' }
  };

  const fetchMoods = useCallback(() => {
    // @ts-ignore
    const query = Bmob.Query("MoodEntry");
    query.equalTo("secretCode", "==", secretCode);
    query.order("-createdAt");
    query.find().then((res: any) => {
      if (Array.isArray(res)) setMoods(res as MoodEntry[]);
    }).catch(() => {});
  }, [secretCode]);

  useEffect(() => {
    let isMounted = true;
    const loadMoods = () => {
      if (isMounted) {
        fetchMoods();
      }
    };
    loadMoods();
    const timer = setInterval(loadMoods, 5000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [secretCode, fetchMoods]);

  const handleRecordMood = () => {
    setLoading(true);
    const moodValues = { happy: "5", good: "4", normal: "3", sad: "2", angry: "1" };

    // @ts-ignore
    const query = Bmob.Query("MoodEntry");
    query.set("mood", selectedMood);
    query.set("moodValue", moodValues[selectedMood]);
    query.set("note", note);
    query.set("author", identity);
    query.set("recordDate", new Date().toISOString().split('T')[0]);
    query.set("secretCode", secretCode);

    query.save().then(() => {
      setNote('');
      setLoading(false);
      fetchMoods();
    }).catch((err: any) => {
      console.error(err);
      alert("记录失败: " + JSON.stringify(err));
      if(err.code === 20004) {
        alert("请去Bmob后台创建 MoodEntry 表！");
      }
      setLoading(false);
    });
  };

  const handleDeleteMood = (id: string) => {
    if (!window.confirm('确定要删除此心情记录吗?')) return;
    // @ts-ignore
    const query = Bmob.Query("MoodEntry");
    query.destroy(id).then(() => {
      fetchMoods();
    }).catch((err: any) => {
      alert("删除失败: " + JSON.stringify(err));
    });
  };

  // 获取最近7天的心情数据用于图表
  const getMoodChartData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayMoods = moods.filter(m => m.recordDate === dateStr);
      const avgMood = dayMoods.length > 0 
        ? Math.round(dayMoods.reduce((sum, m) => sum + parseInt(String(m.moodValue)), 0) / dayMoods.length)
        : 0;
      data.push({
        date: dateStr.slice(5),
        mood: avgMood,
        count: dayMoods.length
      });
    }
    return data;
  };

  const today = new Date().toISOString().split('T')[0];
  const todayMoods = moods.filter(m => m.recordDate === today);

  return (
    <div className="p-4 h-full flex flex-col">
      <h2 className="text-lg font-bold text-gray-800 mb-4">心情记录</h2>

      {/* 心情选择 */}
      <div className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
        <p className="text-sm font-semibold text-gray-700 mb-3">今天的心情怎样？</p>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {(Object.keys(moodEmojis) as Array<keyof typeof moodEmojis>).map(mood => (
            <button
              key={mood}
              onClick={() => setSelectedMood(mood)}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                selectedMood === mood 
                  ? `${moodEmojis[mood].color} border-current scale-110` 
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <span className="text-2xl">{moodEmojis[mood].emoji}</span>
              <span className="text-xs mt-1 text-gray-700">{moodEmojis[mood].label}</span>
            </button>
          ))}
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="可以记下一些想说的话..."
          className="w-full p-2 border border-gray-200 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none h-16"
        />

        <button
          onClick={handleRecordMood}
          disabled={loading}
          className="w-full py-2 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="animate-spin" size={16} />}
          记录心情
        </button>
      </div>

      {/* 心情趋势图 */}
      <h3 className="text-sm font-bold text-gray-800 mb-3">最近7天心情变化</h3>
      <div className="bg-white rounded-xl p-3 mb-4">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={getMoodChartData()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 5]} />
            <Tooltip formatter={(value: any) => {
              const moods = ['', '生气', '难过', '一般', '不错', '开心'];
              return moods[value] || value;
            }} />
            <Line type="monotone" dataKey="mood" stroke="#ec4899" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 心情记录列表 */}
      <h3 className="text-sm font-bold text-gray-800 mb-3">心情记录</h3>
      <div className="flex-1 overflow-y-auto space-y-2">
        {moods.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            <Smile size={40} className="mx-auto mb-2 opacity-20" />
            <p>还没有心情记录</p>
          </div>
        ) : (
          moods.map(mood => (
            <div key={mood.objectId} className={`p-3 rounded-lg border-2 ${moodEmojis[mood.mood].color} group`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{moodEmojis[mood.mood].emoji}</span>
                    <div>
                      <p className="font-semibold text-gray-800">{mood.author === 'boy' ? '👦 他' : '👧 她'}</p>
                      <p className="text-xs text-gray-500">{mood.recordDate}</p>
                    </div>
                  </div>
                  {mood.note && <p className="text-sm text-gray-700 mt-2">{mood.note}</p>}
                </div>
                {mood.author === identity && (
                  <button
                    onClick={() => handleDeleteMood(mood.objectId)}
                    className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function GalleryView({ secretCode, identity }: { secretCode: string, identity: string }) {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [loading, setLoading] = useState(false);

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