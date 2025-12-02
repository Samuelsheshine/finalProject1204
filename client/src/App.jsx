import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, Check, Edit2, RotateCw, X, BookOpen, ArrowLeft, Sparkles, Clock, Calendar, Calculator, Trash2, Send, Link as LinkIcon, ExternalLink, BarChart2, Cloud, Settings, PieChart } from 'lucide-react';

// --- 設定區 ---
const CATEGORIES = {
  EXAM: { id: 'exam', label: '考試', color: 'bg-red-500', border: 'border-l-4 border-red-500', text: 'text-red-700' },
  REPORT: { id: 'report', label: '報告', color: 'bg-green-500', border: 'border-l-4 border-green-500', text: 'text-green-700' },
  HOMEWORK: { id: 'homework', label: '作業', color: 'bg-purple-500', border: 'border-l-4 border-purple-500', text: 'text-purple-700' },
  CANCEL: { id: 'cancel', label: '停課', color: 'bg-yellow-400', border: 'border-l-4 border-yellow-400', text: 'text-yellow-700' },
  OTHER: { id: 'other', label: '其他', color: 'bg-blue-400', border: 'border-l-4 border-blue-400', text: 'text-blue-700' }
};

// GPA 對照表 (4.3制)
const scoreToPoint = (score) => {
    const s = parseInt(score);
    if (isNaN(s)) return 0;
    if (s >= 90) return 4.3;
    if (s >= 85) return 4.0;
    if (s >= 80) return 3.7;
    if (s >= 77) return 3.3;
    if (s >= 73) return 3.0;
    if (s >= 70) return 2.7;
    if (s >= 67) return 2.3;
    if (s >= 63) return 2.0;
    if (s >= 60) return 1.7;
    if (s >= 50) return 1.0;
    return 0;
};

// 輔助函式：取得本地 YYYY-MM-DD 字串
const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function StudyHubApp() {
  const [activeTab, setActiveTab] = useState('timetable'); 
  const [currentDate, setCurrentDate] = useState(new Date()); 
  
  // 學期設定
  const [semesterStart, setSemesterStart] = useState(new Date(new Date().getFullYear(), 8, 1)); // 預設 9/1
  const [semesterWeeks, setSemesterWeeks] = useState(18); // 預設 18 週，可改為 16
  
  // --- 資料庫同步狀態 ---
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); 
  const saveTimeoutRef = useRef(null);

  // --- 資料狀態 ---
  const [tasks, setTasks] = useState([
    { id: 1, date: getLocalDateString(new Date()), category: 'exam', subject: '範例:微積分', note: 'Ch1-3', completed: false },
  ]);

  const [grades, setGrades] = useState([
    { id: 1, date: getLocalDateString(new Date()), subject: '範例:計算機概論', score: '85', note: '期中考' },
  ]);

  const [timetable, setTimetable] = useState({
      "1-1": "微積分", "1-2": "微積分",
  });

  const [periodTimes, setPeriodTimes] = useState({
      '1': '08:10-09:00', '2': '09:10-10:00', '3': '10:20-11:10', '4': '11:20-12:10',
      '5': '12:20-13:10', '6': '13:20-14:10', '7': '14:20-15:10', '8': '15:30-16:20',
      '9': '16:30-17:20', '10': '17:30-18:20', 'A': '18:25-19:15', 'B':'19:20-20:10',
      'C': '20:15-21:05',
  });

  const [gpaCourses, setGpaCourses] = useState([]);
  const [links, setLinks] = useState([]);
  const [studyLogs, setStudyLogs] = useState([]);
  const [pomodoroSubjects, setPomodoroSubjects] = useState([]);
  
  // 新增：課程評分標準狀態 (key: subjectName, value: array of criteria)
  const [courseCriteria, setCourseCriteria] = useState({});

  // --- 資料庫整合邏輯 ---

  useEffect(() => {
    const fetchData = async () => {
      try {
        const savedData = localStorage.getItem('studyhub_data');
        if (savedData) {
          const data = JSON.parse(savedData);
          if (Object.keys(data).length > 0) {
            if (data.tasks) setTasks(data.tasks);
            if (data.grades) setGrades(data.grades);
            if (data.timetable) setTimetable(data.timetable);
            if (data.periodTimes) setPeriodTimes(data.periodTimes);
            if (data.gpaCourses) setGpaCourses(data.gpaCourses);
            if (data.links) setLinks(data.links);
            if (data.studyLogs) setStudyLogs(data.studyLogs);
            if (data.pomodoroSubjects) setPomodoroSubjects(data.pomodoroSubjects);
            if (data.currentDate) setCurrentDate(new Date(data.currentDate));
            if (data.semesterStart) setSemesterStart(new Date(data.semesterStart));
            if (data.semesterWeeks) setSemesterWeeks(data.semesterWeeks);
            if (data.courseCriteria) setCourseCriteria(data.courseCriteria);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsDataLoaded(true);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!isDataLoaded) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    setSaveStatus('saving');

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const payload = {
          tasks, grades, timetable, periodTimes, gpaCourses, links, studyLogs, pomodoroSubjects,
          currentDate: currentDate.toISOString(),
          semesterStart: semesterStart.toISOString(),
          semesterWeeks,
          courseCriteria
        };
        
        localStorage.setItem('studyhub_data', JSON.stringify(payload));
        await new Promise(r => setTimeout(r, 300));
        setSaveStatus('saved');
      } catch (e) {
        console.error("Save error:", e);
        setSaveStatus('error');
      }
    }, 1000);

    return () => clearTimeout(saveTimeoutRef.current);
  }, [tasks, grades, timetable, periodTimes, gpaCourses, links, studyLogs, pomodoroSubjects, currentDate, semesterStart, semesterWeeks, courseCriteria, isDataLoaded]);


  // --- 輔助函式 ---
  const getWeekNumber = (date) => {
    const diff = date - semesterStart;
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    // 如果日期在開學前，顯示第 0 週或負數
    const weekNum = Math.ceil(diff / oneWeek);
    return weekNum > 0 ? weekNum : 0;
  };

  const getWeekDays = (baseDate) => {
    const startOfWeek = new Date(baseDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); 
    startOfWeek.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
  const currentWeekNum = getWeekNumber(currentDate);

  // --- 新版網頁介面元件 ---

  const Sidebar = () => (
    <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col transition-all duration-300 z-20">
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <h1 className="text-xl font-black text-gray-800 flex items-center gap-2 tracking-tight">
          <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center">
            <span className="font-serif italic">S</span>
          </div>
          StudyHub
        </h1>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {[
            { id: 'timetable', label: '課表', icon: <RotateCw size={18}/> },
            { id: 'planner', label: '聯絡簿', icon: <BookOpen size={18}/> },
            { id: 'grades', label: '成績', icon: <Edit2 size={18}/> },
            { id: 'gpa', label: 'GPA', icon: <Calculator size={18}/> },
            { id: 'dashboard', label: '行事曆', icon: <Calendar size={18}/> },
            { id: 'ai', label: 'AI 助理', icon: <Sparkles size={18}/>, special: true },
            { id: 'pomodoro', label: '番茄鐘', icon: <Clock size={18}/> },
            { id: 'links', label: '常用連結', icon: <LinkIcon size={18}/> },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all
              ${activeTab === item.id 
                ? (item.special ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-black text-white shadow-md shadow-gray-200') 
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}
            `}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.special && <span className="ml-auto text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white">BETA</span>}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 border border-gray-100">
           <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
             U
           </div>
           <div>
             <div className="text-xs font-bold text-gray-900">User</div>
             <div className="text-[10px] text-gray-500">Student Account</div>
           </div>
        </div>
      </div>
    </aside>
  );

  const TopBar = () => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [tempStart, setTempStart] = useState(getLocalDateString(semesterStart));
    const [tempWeeks, setTempWeeks] = useState(semesterWeeks);

    const handleSaveSettings = () => {
        setSemesterStart(new Date(tempStart));
        setSemesterWeeks(parseInt(tempWeeks));
        setIsSettingsOpen(false);
    };

    const todayDateString = new Intl.DateTimeFormat('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    }).format(new Date());

    return (
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 z-10 sticky top-0">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-lg border border-gray-200/50">
                <button onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setDate(newDate.getDate() - 7);
                setCurrentDate(newDate);
                }} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-gray-500 transition-all">
                <ChevronLeft size={16} />
                </button>
                
                <div className="flex flex-col items-center px-3 min-w-[120px]">
                <span className="text-xs font-bold text-gray-800">
                    {weekDays[0].getMonth()+1}/{weekDays[0].getDate()} - {weekDays[6].getMonth()+1}/{weekDays[6].getDate()}
                </span>
                
                {currentWeekNum <= 0 && (
                    <span className="text-[10px] font-bold px-2 rounded-full mt-0.5 bg-gray-50 text-gray-500">
                        開學前
                    </span>
                )}
                {currentWeekNum > 0 && currentWeekNum <= semesterWeeks && (
                    <span className="text-[10px] font-bold px-2 rounded-full mt-0.5 bg-blue-50 text-blue-600">
                        學期第 {currentWeekNum} 週
                    </span>
                )}
                </div>

                <button onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setDate(newDate.getDate() + 7);
                setCurrentDate(newDate);
                }} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-gray-500 transition-all">
                <ChevronRight size={16} />
                </button>
            </div>
        </div>

        <div className="absolute left-1/2 transform -translate-x-1/2 font-bold text-gray-700 text-sm hidden md:block">
            {todayDateString}
        </div>

        <div className="flex items-center gap-4">
            <button 
                onClick={() => {
                    setTempStart(getLocalDateString(semesterStart));
                    setTempWeeks(semesterWeeks);
                    setIsSettingsOpen(true);
                }}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all"
                title="學期設定"
            >
                <Settings size={20} />
            </button>

            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border
                ${saveStatus === 'saving' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                saveStatus === 'saved' ? 'bg-green-50 text-green-600 border-green-100' : 
                saveStatus === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                <Cloud size={14} />
                <span>
                {saveStatus === 'saving' && '儲存中...'}
                {saveStatus === 'saved' && '已儲存'}
                {saveStatus === 'error' && '儲存失敗'}
                {saveStatus === 'idle' && '準備就緒'}
                </span>
            </div>
        </div>

        {isSettingsOpen && (
            <div className="fixed inset-0 bg-black/20 z-50 flex items-start justify-end p-4 animate-in fade-in">
                <div className="bg-white w-80 rounded-2xl p-5 shadow-2xl mt-16 border border-gray-200 mr-2">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2"><Settings size={16}/> 學期設定</h3>
                        <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1.5 block">學期開始日 (第一週週一)</label>
                            <input 
                                type="date" 
                                className="w-full border border-gray-300 rounded-xl p-2.5 text-sm outline-none focus:border-black transition-colors"
                                value={tempStart}
                                onChange={(e) => setTempStart(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1.5 block">學期總週數</label>
                            <div className="flex gap-2">
                                {[16, 18].map(w => (
                                    <button 
                                        key={w}
                                        onClick={() => setTempWeeks(w)}
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${parseInt(tempWeeks) === w ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
                                    >
                                        {w}週
                                    </button>
                                ))}
                                <input 
                                    type="number" 
                                    className="w-16 border border-gray-300 rounded-lg p-2 text-sm text-center outline-none focus:border-black"
                                    value={tempWeeks}
                                    onChange={(e) => setTempWeeks(e.target.value)}
                                    placeholder="自訂"
                                />
                            </div>
                        </div>
                        <div className="pt-2">
                            <button 
                                onClick={handleSaveSettings}
                                className="w-full bg-black text-white py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors"
                            >
                                儲存設定
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </header>
    );
  };

  // --- Views (Content Area) ---

  const LinksView = ({ links, setLinks }) => {
      const [isAdding, setIsAdding] = useState(false);
      const [newLink, setNewLink] = useState({ title: '', url: '' });

      const addLink = () => {
          if (newLink.title && newLink.url) {
              setLinks([...links, { id: Date.now(), ...newLink }]);
              setNewLink({ title: '', url: '' });
              setIsAdding(false);
          }
      };
      
      const confirmDelete = (id, title) => {
          if (window.confirm(`確定要刪除連結「${title}」嗎？`)) {
              setLinks(links.filter(l => l.id !== id));
          }
      };

      return (
          <div className="h-full">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {links.map(link => (
                      <div key={link.id} className="relative group h-40">
                          <button 
                              onClick={(e) => {
                                  e.stopPropagation();
                                  confirmDelete(link.id, link.title);
                              }}
                              className="absolute top-2 right-2 z-10 p-1.5 bg-white/90 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm opacity-0 group-hover:opacity-100"
                          >
                              <X size={14} />
                          </button>
                          
                          <a 
                              href={link.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center justify-center gap-3 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer no-underline text-gray-700 h-full"
                          >
                              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                                  <LinkIcon size={24} />
                              </div>
                              <span className="font-bold text-sm text-center line-clamp-1 w-full px-1">{link.title}</span>
                              <div className="flex items-center text-[10px] text-gray-400 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span>開啟</span> <ExternalLink size={10} />
                              </div>
                          </a>
                      </div>
                  ))}
                  
                  <button 
                    onClick={() => setIsAdding(true)}
                    className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-gray-600 hover:border-gray-400 hover:bg-gray-100 transition-all h-40"
                  >
                      <Plus size={24} />
                      <span className="text-xs font-bold">新增連結</span>
                  </button>
              </div>

              {isAdding && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
                      <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-xl">
                          <h3 className="font-bold text-lg mb-4 text-gray-800">新增連結</h3>
                          <input placeholder="名稱" className="w-full border border-gray-300 rounded-xl p-3 mb-3 text-sm focus:border-black outline-none" value={newLink.title} onChange={e => setNewLink({...newLink, title: e.target.value})} />
                          <input placeholder="網址" className="w-full border border-gray-300 rounded-xl p-3 mb-5 text-sm focus:border-black outline-none" value={newLink.url} onChange={e => setNewLink({...newLink, url: e.target.value})} />
                          <div className="flex gap-3">
                              <button onClick={() => setIsAdding(false)} className="flex-1 py-3 bg-gray-100 rounded-xl text-sm font-bold">取消</button>
                              <button onClick={addLink} className="flex-1 py-3 bg-black text-white rounded-xl text-sm font-bold">確認</button>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
  };

  const AIChatView = ({ tasks, grades, timetable, currentDate, gpaCourses, periodTimes }) => {
    const [messages, setMessages] = useState([{ 
        role: 'assistant', 
        content: '嗨！我是 StudyHub 助理。我可以根據你的資料庫內容，回答關於課表、成績或行程的問題。\n\n你可以點擊下方的按鈕快速提問，或直接輸入文字。' 
    }]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef(null);
    
    useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

    const getSystemContext = () => {
        const dayOfWeekMap = ['日', '一', '二', '三', '四', '五', '六'];
        const currentDayIndex = currentDate.getDay(); 
        const tableDayIndex = currentDayIndex === 0 ? 7 : currentDayIndex;

        const todaysClasses = Object.entries(timetable)
            .filter(([k, v]) => k.startsWith(`${tableDayIndex}-`))
            .map(([k, v]) => {
                const period = k.split('-')[1];
                const time = periodTimes[period] || '';
                return `第${period}節 (${time}): ${v}`;
            })
            .sort((a, b) => { 
                const pA = a.match(/第(.*?)節/)[1];
                const pB = b.match(/第(.*?)節/)[1];
                return pA.localeCompare(pB, undefined, { numeric: true });
            })
            .join('\n');

        const todaysTasks = tasks.filter(t => t.date === getLocalDateString(currentDate))
            .map(t => `[${CATEGORIES[t.category.toUpperCase()]?.label || '其他'}] ${t.subject}: ${t.note}`)
            .join('\n');

        const allTasks = tasks.map(t => `(${t.date}) [${CATEGORIES[t.category.toUpperCase()]?.label || '其他'}] ${t.subject}: ${t.note}`).join('\n');
        const allGrades = grades.map(g => `[${g.subject}] ${g.score}分 (${g.note})`).join('\n');

        return `【今日 (${currentDate.getFullYear()}/${currentDate.getMonth()+1}/${currentDate.getDate()} 週${dayOfWeekMap[currentDayIndex]}) 重點】\n課程：\n${todaysClasses || "無課程"}\n\n待辦事項：\n${todaysTasks || "無待辦"}\n\n【資料庫全覽】\n所有聯絡簿：\n${allTasks}\n\n所有成績：\n${allGrades}`;
    };

    const handleSend = async (text = null) => {
        const content = typeof text === 'string' ? text : input;
        if (!content.trim() || isSending) return;
        
        const userMsg = { role: 'user', content: content };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages); 
        if (typeof text !== 'string') setInput(''); // 只在非按鈕觸發時清空輸入框
        setIsSending(true);
        
        setTimeout(() => {
            const dbKeywords = /課|行程|表|time|schedule|today|今天|成績|grade|score|gpa|聯絡簿|作業|考試|report|homework|exam/i;
            const isAskingAboutDB = dbKeywords.test(userMsg.content);

            let fakeReply = "";
            if (isAskingAboutDB) {
                 const context = getSystemContext();
                 fakeReply = `(預覽模擬 - 僅回答資料庫內容)\n根據您的資料庫：\n${context}\n\n(以上為我所知的全部資訊)`;
            } else {
                 fakeReply = `(系統訊息)\n抱歉，我被設計為「StudyHub 專屬資料庫查詢員」。\n\n我無法回答關於「${userMsg.content}」的通用知識問題（如學科教學、閒聊、世界知識等）。\n\n請詢問關於您的 **課表、成績、聯絡簿** 或 **今日行程** 的問題。`;
            }
            
            setMessages(prev => [...prev, { role: 'assistant', content: fakeReply }]);
            setIsSending(false);
        }, 800);
    };

    const presetQuestions = [
        "今天有什麼課？",
        "什麼時候有考試？",
        "什麼時候有報告？",
        "什麼時候有作業？",
        "我的成績如何？"
    ];

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg, idx) => ( <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[70%] rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${msg.role === 'user' ? 'bg-black text-white rounded-br-none' : 'bg-gray-100 text-gray-800 border border-gray-200 rounded-bl-none'}`}>{msg.content}</div></div> ))}
                {isSending && <div className="text-gray-400 text-xs ml-4 animate-pulse">思考中...</div>}
                <div ref={messagesEndRef} />
            </div>
            
            {/* 預設問題區塊 */}
            <div className="bg-gray-50 border-t border-gray-200">
                <div className="flex gap-2 p-3 overflow-x-auto no-scrollbar">
                    {presetQuestions.map((q, idx) => (
                        <button 
                            key={idx} 
                            onClick={() => handleSend(q)}
                            className="whitespace-nowrap px-4 py-2 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:bg-gray-100 hover:border-gray-400 transition-all shadow-sm"
                        >
                            {q}
                        </button>
                    ))}
                </div>
                <div className="p-4 pt-0 flex gap-3">
                    <input type="text" placeholder="詢問關於您的課表、成績..." className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-all" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} />
                    <button onClick={() => handleSend()} disabled={isSending || !input.trim()} className="bg-black text-white p-3 rounded-xl hover:bg-gray-800 transition-colors disabled:bg-gray-300"><Send size={18} /></button>
                </div>
            </div>
        </div>
    );
  };

  const TimetableView = ({ timetable, setTimetable, periodTimes, setPeriodTimes }) => {
      const periods = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'A', 'B', 'C'];
      const days = ['一', '二', '三', '四', '五', '六', '日'];
      
      const [isEditing, setIsEditing] = useState(false);
      const [editModal, setEditModal] = useState({ isOpen: false, type: null, key: null, value: '' });
      const [timeEdit, setTimeEdit] = useState({ start: '', end: '' });

      const handleCellClick = (dayIdx, period) => {
          if (!isEditing) return;
          const key = `${dayIdx + 1}-${period}`;
          setEditModal({ isOpen: true, type: 'subject', key: key, value: timetable[key] || '' });
      };

      const handleTimeClick = (p) => {
          if (!isEditing) return;
          const currentVal = periodTimes[p] || "";
          let start = "", end = "";
          if (currentVal.includes('-')) {
              [start, end] = currentVal.split('-');
          }
          setTimeEdit({ start, end });
          setEditModal({ isOpen: true, type: 'time', key: p });
      };

      const saveEdit = () => {
          const { type, key, value } = editModal;
          if (type === 'subject') {
               const newTimetable = { ...timetable };
               if (!value.trim()) delete newTimetable[key];
               else newTimetable[key] = value;
               setTimetable(newTimetable);
          } else if (type === 'time') {
               const timeStr = `${timeEdit.start}-${timeEdit.end}`;
               setPeriodTimes(prev => ({...prev, [key]: timeStr}));
          }
          setEditModal({ ...editModal, isOpen: false });
      };

      return (
          <div className="h-full flex flex-col">
              <div className="flex-1 overflow-auto rounded-xl border border-gray-200 shadow-sm bg-white">
                <div className="min-w-[800px]">
                    <div className="grid grid-cols-[60px_100px_repeat(7,1fr)] text-center text-sm font-bold bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                        <div className="p-3 border-r border-gray-200 text-gray-500">節</div>
                        <div className="p-3 border-r border-gray-200 text-gray-500">時間</div>
                        {days.map(d => <div key={d} className="p-3 border-r border-gray-200 last:border-0 text-gray-700">{d}</div>)}
                    </div>
                    {periods.map(p => (
                        <div key={p} className="grid grid-cols-[60px_100px_repeat(7,1fr)] text-center text-sm h-16 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                            <div className="flex items-center justify-center bg-gray-50 text-gray-500 font-bold border-r border-gray-200">{p}</div>
                            
                            <div onClick={() => handleTimeClick(p)} className={`flex flex-col items-center justify-center border-r border-gray-200 p-1 h-full text-xs text-gray-500 ${isEditing ? 'cursor-pointer hover:bg-indigo-50' : ''}`}>
                                {(() => {
                                    const t = periodTimes[p] || "";
                                    if (t.includes('-')) {
                                        const [start, end] = t.split('-');
                                        return (<><div>{start}</div><div className="text-gray-300">|</div><div>{end}</div></>);
                                    }
                                    return t || (isEditing ? <span className="text-indigo-300">設定</span> : "");
                                })()}
                            </div>

                            {days.map((_, dayIdx) => {
                                const key = `${dayIdx + 1}-${p}`;
                                const subject = timetable[key];
                                return (
                                    <div key={key} onClick={() => handleCellClick(dayIdx, p)} className={`flex items-center justify-center p-1 border-r border-gray-100 last:border-0 ${isEditing ? 'cursor-pointer hover:bg-indigo-50' : ''}`}>
                                        {subject ? (
                                            <div className="bg-indigo-50 text-indigo-700 rounded-lg px-2 py-1 w-full h-full flex items-center justify-center text-xs font-bold break-all leading-tight border border-indigo-100 shadow-sm">{subject}</div>
                                        ) : (
                                            isEditing && <div className="text-indigo-100 text-lg opacity-0 hover:opacity-100 transition-opacity">+</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                  <button onClick={() => setIsEditing(!isEditing)} className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2 ${isEditing ? 'bg-black text-white hover:bg-gray-800' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                      {isEditing ? <> <Check size={16} /> 完成編輯 </> : <> <Edit2 size={16} /> 編輯課表 </>}
                  </button>
              </div>

              {editModal.isOpen && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
                      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl">
                          <h3 className="font-bold text-lg mb-4 text-gray-800">{editModal.type === 'time' ? '修改時間' : '編輯課程'}</h3>
                          {editModal.type === 'time' ? (
                              <div className="flex items-center gap-2 mb-6">
                                  <input type="time" className="border border-gray-300 rounded-lg p-2 text-sm w-full" value={timeEdit.start} onChange={e => setTimeEdit({...timeEdit, start: e.target.value})} />
                                  <span>-</span>
                                  <input type="time" className="border border-gray-300 rounded-lg p-2 text-sm w-full" value={timeEdit.end} onChange={e => setTimeEdit({...timeEdit, end: e.target.value})} />
                              </div>
                          ) : (
                              <input autoFocus className="w-full border border-gray-300 rounded-xl p-3 mb-5 text-sm focus:border-black outline-none" value={editModal.value} onChange={e => setEditModal({...editModal, value: e.target.value})} placeholder="輸入課程名稱..." />
                          )}
                          <div className="flex gap-3">
                              <button onClick={() => setEditModal({...editModal, isOpen: false})} className="flex-1 py-2.5 bg-gray-100 rounded-xl text-sm font-bold text-gray-600">取消</button>
                              <button onClick={saveEdit} className="flex-1 py-2.5 bg-black text-white rounded-xl text-sm font-bold">確定</button>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
  };

  const PomodoroView = ({ studyLogs, setStudyLogs, currentDate, pomodoroSubjects, setPomodoroSubjects }) => {
      const [timeLeft, setTimeLeft] = useState(25 * 60);
      const [isActive, setIsActive] = useState(false);
      const [mode, setMode] = useState('work'); 
      const [targetSubject, setTargetSubject] = useState("");
      
      const [isCreatingSubject, setIsCreatingSubject] = useState(false);
      const [customSubject, setCustomSubject] = useState("");

      useEffect(() => {
          let interval = null;
          if (isActive && timeLeft > 0) { interval = setInterval(() => setTimeLeft(t => t - 1), 1000); } 
          else if (timeLeft === 0) { 
              setIsActive(false); 
              if (mode === 'work') {
                  const subjectToSave = isCreatingSubject ? customSubject : targetSubject;
                  if (subjectToSave) {
                      alert(`專注結束！已記錄「${subjectToSave}」。`);
                      const todayStr = getLocalDateString(currentDate);
                      setStudyLogs(prev => [...prev, { id: Date.now(), date: todayStr, subject: subjectToSave, duration: 25 }]);
                      
                      if (isCreatingSubject && customSubject) {
                          setPomodoroSubjects(prev => [...prev, customSubject]);
                          setIsCreatingSubject(false);
                          setTargetSubject(customSubject);
                          setCustomSubject("");
                      }
                  } else {
                      alert("專注結束！");
                  }
              } else {
                  alert("休息結束！");
              }
          }
          return () => clearInterval(interval);
      }, [isActive, timeLeft, mode, targetSubject, customSubject, isCreatingSubject, currentDate]);

      const toggleTimer = () => setIsActive(!isActive);
      const resetTimer = () => { setIsActive(false); setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60); };
      const switchMode = (newMode) => { setMode(newMode); setIsActive(false); setTimeLeft(newMode === 'work' ? 25 * 60 : 5 * 60); };
      const formatTime = (seconds) => { const m = Math.floor(seconds / 60).toString().padStart(2, '0'); const s = (seconds % 60).toString().padStart(2, '0'); return `${m}:${s}`; };

      const handleSubjectChange = (e) => {
          const val = e.target.value;
          if (val === 'NEW_CUSTOM') {
              setIsCreatingSubject(true);
              setTargetSubject("");
          } else {
              setIsCreatingSubject(false);
              setTargetSubject(val);
          }
      };
      
      const handleConfirmSubject = () => {
          if (customSubject.trim()) {
              setPomodoroSubjects(prev => [...prev, customSubject]);
              setIsCreatingSubject(false);
              setTargetSubject(customSubject);
              setCustomSubject("");
          }
      };

      const subjectStats = useMemo(() => {
          const startOfWeek = new Date(currentDate);
          const day = startOfWeek.getDay();
          const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
          startOfWeek.setDate(diff); // 週一
          
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(endOfWeek.getDate() + 6); // 週日

          const weekLogs = studyLogs.filter(l => {
              const d = new Date(l.date);
              return d >= startOfWeek && d <= endOfWeek;
          });

          const stats = {};
          weekLogs.forEach(l => {
              stats[l.subject] = (stats[l.subject] || 0) + l.duration;
          });

          return Object.entries(stats).map(([subj, mins]) => ({
              subject: subj,
              hours: (mins / 60).toFixed(1)
          })).sort((a,b) => b.hours - a.hours);
      }, [studyLogs, currentDate]);

      const maxSubjectHours = Math.max(...subjectStats.map(s => parseFloat(s.hours)), 1);

      return (
          <div className="h-full flex flex-col md:flex-row gap-8">
              <div className="flex-1 flex flex-col items-center justify-center space-y-8 bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                  <div className="flex bg-gray-100 p-1.5 rounded-full">
                      <button onClick={() => switchMode('work')} className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all ${mode === 'work' ? 'bg-white shadow text-red-500' : 'text-gray-500'}`}>專注模式</button>
                      <button onClick={() => switchMode('break')} className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all ${mode === 'break' ? 'bg-white shadow text-green-500' : 'text-gray-500'}`}>休息模式</button>
                  </div>

                  {mode === 'work' && (
                      <div className="w-full max-w-xs">
                          {isCreatingSubject ? (
                              <div className="flex gap-2 items-center">
                                  <input autoFocus placeholder="輸入科目..." className="w-full border-b-2 border-indigo-500 outline-none text-center pb-2 bg-transparent text-lg" value={customSubject} onChange={(e) => setCustomSubject(e.target.value)} />
                                  <button onClick={handleConfirmSubject} className="text-green-500 hover:text-green-600 bg-green-50 p-2 rounded-full"><Check size={20}/></button>
                                  <button onClick={() => setIsCreatingSubject(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 p-2 rounded-full"><X size={20}/></button>
                              </div>
                          ) : (
                              <select className="bg-gray-50 border border-gray-200 text-gray-700 text-lg rounded-xl p-3 w-full outline-none focus:border-black text-center cursor-pointer" value={targetSubject} onChange={handleSubjectChange}>
                                  <option value="">-- 請選擇專注科目 --</option>
                                  {pomodoroSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                                  <option value="NEW_CUSTOM">＋ 新增科目...</option>
                              </select>
                          )}
                      </div>
                  )}

                  <div className={`w-72 h-72 rounded-full border-[12px] flex items-center justify-center shadow-xl transition-all duration-500 ${mode === 'work' ? 'border-red-50 bg-white' : 'border-green-50 bg-white'}`}>
                      <span className={`text-7xl font-mono font-bold tracking-tighter ${mode === 'work' ? 'text-red-500' : 'text-green-500'}`}>{formatTime(timeLeft)}</span>
                  </div>

                  <div className="flex gap-6">
                      <button onClick={toggleTimer} className="w-20 h-20 rounded-full bg-black text-white flex items-center justify-center hover:scale-105 transition-transform shadow-xl hover:shadow-2xl">{isActive ? <span className="text-3xl">⏸</span> : <span className="text-3xl ml-1">▶</span>}</button>
                      <button onClick={resetTimer} className="w-20 h-20 rounded-full bg-white border border-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-50 shadow-md hover:shadow-lg transition-all"><RotateCw size={28} /></button>
                  </div>
              </div>

              <div className="w-full md:w-80 bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2"><BarChart2 size={20} className="text-blue-500"/> 本週統計</h3>
                      <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">單位: 小時</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {subjectStats.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300 text-sm italic border-2 border-dashed border-gray-100 rounded-xl min-h-[200px]">
                            <Clock size={40} className="mb-2 opacity-20"/>
                            本週尚無讀書紀錄
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {subjectStats.map((stat, i) => (
                                <div key={stat.subject} className="flex flex-col gap-1">
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm font-bold text-gray-700">{stat.subject}</span>
                                        <span className="text-xs text-gray-500 font-mono font-bold">{stat.hours}hr</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${Math.max((parseFloat(stat.hours) / maxSubjectHours) * 100, 5)}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                  </div>
              </div>
          </div>
      );
  };

  const GpaView = ({ gpaCourses, setGpaCourses, courseCriteria, setCourseCriteria }) => {
      // 判斷是否有學期成績，若有則直接顯示，否則顯示 "N/A"
      const getCourseScore = (course) => {
          if (course.score && !isNaN(parseFloat(course.score))) return course.score;
          
          // 嘗試從細項計算 (如果該課程有設定評分標準)
          const criteria = courseCriteria[course.name];
          if (criteria && criteria.length > 0) {
              let total = 0;
              let currentPercentage = 0;
              criteria.forEach(c => {
                  const weight = parseFloat(c.weight);
                  const score = parseFloat(c.score);
                  if (!isNaN(weight) && !isNaN(score)) {
                      total += score * (weight / 100);
                      currentPercentage += weight;
                  }
              });
              // 只有當權重達到100%時才視為有效總成績，或者顯示目前已得分數
              return total.toFixed(1); 
          }
          return "-";
      };

      const calculatedGPA = useMemo(() => {
          let totalPoints = 0; let totalCredits = 0;
          gpaCourses.forEach(c => { 
              const credit = parseFloat(c.credit); 
              // 優先使用手動輸入的總分，如果沒有則嘗試計算
              let score = parseFloat(c.score);
              if (isNaN(score)) {
                  // 嘗試計算細項
                  const criteria = courseCriteria[c.name];
                  if (criteria) {
                      let tempScore = 0;
                      criteria.forEach(item => {
                          const w = parseFloat(item.weight) || 0;
                          const s = parseFloat(item.score) || 0;
                          tempScore += s * (w/100);
                      });
                      score = tempScore;
                  }
              }

              if (!isNaN(credit) && !isNaN(score)) { 
                  totalPoints += scoreToPoint(score) * credit; 
                  totalCredits += credit; 
              } 
          });
          return totalCredits === 0 ? "0.00" : (totalPoints / totalCredits).toFixed(2);
      }, [gpaCourses, courseCriteria]);
      
      const [isAdding, setIsAdding] = useState(false);
      const [newCourse, setNewCourse] = useState({ name: '', credit: '', score: '', note: '' }); 
      
      // 計算機 Modal 狀態
      const [calcModal, setCalcModal] = useState({ isOpen: false, courseId: null, courseName: '' });
      const [currentCriteria, setCurrentCriteria] = useState([]); // 暫存當前正在編輯的評分標準

      const openCalculator = (course) => {
          setCalcModal({ isOpen: true, courseId: course.id, courseName: course.name });
          // 載入該課程現有的評分標準，若無則預設空陣列
          setCurrentCriteria(courseCriteria[course.name] || []);
      };

      const closeCalculator = () => {
          setCalcModal({ isOpen: false, courseId: null, courseName: '' });
          setCurrentCriteria([]);
      };

      const addCriteriaItem = () => {
          setCurrentCriteria([...currentCriteria, { id: Date.now(), name: '', weight: '', score: '' }]);
      };

      const updateCriteriaItem = (id, field, value) => {
          setCurrentCriteria(currentCriteria.map(c => c.id === id ? { ...c, [field]: value } : c));
      };

      const removeCriteriaItem = (id) => {
          setCurrentCriteria(currentCriteria.filter(c => c.id !== id));
      };

      const saveCriteria = () => {
          // 1. 儲存評分標準
          setCourseCriteria(prev => ({ ...prev, [calcModal.courseName]: currentCriteria }));
          
          // 2. 計算總分並更新到 gpaCourses 的 score 欄位 (可選，視需求是否要自動覆蓋)
          let totalScore = 0;
          currentCriteria.forEach(c => {
              const w = parseFloat(c.weight) || 0;
              const s = parseFloat(c.score) || 0;
              totalScore += s * (w / 100);
          });
          
          // 更新該課程的總分
          setGpaCourses(prev => prev.map(c => c.id === calcModal.courseId ? { ...c, score: totalScore.toFixed(0) } : c));

          closeCalculator();
      };

      // 計算目前累積總分
      const currentTotalScore = useMemo(() => {
          let total = 0;
          currentCriteria.forEach(c => {
              const w = parseFloat(c.weight) || 0;
              const s = parseFloat(c.score) || 0;
              total += s * (w / 100);
          });
          return total.toFixed(1);
      }, [currentCriteria]);

      const currentTotalWeight = useMemo(() => {
          let total = 0;
          currentCriteria.forEach(c => total += (parseFloat(c.weight) || 0));
          return total;
      }, [currentCriteria]);


      const addNewCourse = () => {
        if (!newCourse.name) return; 
        setGpaCourses([...gpaCourses, { id: Date.now(), ...newCourse }]);
        setNewCourse({ name: '', credit: '', score: '', note: '' }); 
        setIsAdding(false); 
      };

      const removeGpaRow = (id) => setGpaCourses(gpaCourses.filter(c => c.id !== id));
      const updateGpaRow = (id, field, value) => { setGpaCourses(gpaCourses.map(c => c.id === id ? { ...c, [field]: value } : c)); };

      return (
          <div className="h-full flex flex-col space-y-6">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg flex items-center justify-between">
                  <div>
                      <p className="text-blue-100 text-sm font-bold tracking-wider uppercase mb-1">Current GPA (4.3)</p>
                      <h2 className="text-6xl font-black tracking-tighter">{calculatedGPA}</h2>
                  </div>
                  <div className="text-right">
                      <div className="text-3xl font-bold opacity-90">{gpaCourses.length}</div>
                      <div className="text-xs text-blue-200">Total Courses</div>
                  </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
                  <div className="grid grid-cols-12 bg-gray-50 text-xs font-bold text-gray-500 p-3 border-b border-gray-200 uppercase tracking-wide">
                      <div className="col-span-4 pl-2">Course Name</div>
                      <div className="col-span-2 text-center">Credit</div>
                      <div className="col-span-2 text-center">Score</div>
                      <div className="col-span-2 text-center">GPA</div>
                      <div className="col-span-2 text-center">Action</div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto">
                    {gpaCourses.map(course => (
                        <div key={course.id} className="grid grid-cols-12 p-3 border-b border-gray-100 items-center gap-2 hover:bg-gray-50 transition-colors group">
                            {/* 課程名稱點擊可開啟計算機 (如果有設定的話，或是透過按鈕) */}
                            <div className="col-span-4 flex items-center gap-2">
                                <input placeholder="課程名稱..." className="w-full text-sm font-medium text-gray-800 border-none bg-transparent outline-none focus:ring-0 placeholder:text-gray-300" value={course.name} onChange={e => updateGpaRow(course.id, 'name', e.target.value)}/>
                            </div>
                            
                            <input placeholder="-" type="number" className="col-span-2 text-center text-sm bg-gray-50 border border-gray-200 rounded-md py-1 focus:border-blue-500 outline-none" value={course.credit} onChange={e => updateGpaRow(course.id, 'credit', e.target.value)}/>
                            
                            {/* 分數欄位：可以直接輸入，也可以透過計算機計算 */}
                            <input placeholder="-" type="number" className="col-span-2 text-center text-sm bg-gray-50 border border-gray-200 rounded-md py-1 font-bold text-blue-600 focus:border-blue-500 outline-none" value={course.score} onChange={e => updateGpaRow(course.id, 'score', e.target.value)}/>
                            
                            <div className="col-span-2 text-center text-sm font-mono text-gray-500">{scoreToPoint(course.score)}</div>
                            
                            <div className="col-span-2 flex justify-center gap-1">
                                {/* 計算機按鈕 */}
                                <button 
                                    onClick={() => openCalculator(course)}
                                    className="text-gray-400 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded-md transition-all"
                                    title="計算學期成績"
                                >
                                    <PieChart size={16} />
                                </button>
                                <button onClick={() => removeGpaRow(course.id)} className="text-gray-300 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                  </div>
                  
                  <div className="p-4 border-t border-gray-200 bg-gray-50/50">
                    <button onClick={() => setIsAdding(true)} className="w-full py-3 text-center text-sm text-white font-bold bg-black rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-sm"><Plus size={18} /> 新增課程</button>
                  </div>
              </div>

              {/* 新增成績 Modal */}
              {isAdding && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
                      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl">
                          <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg text-gray-800">新增成績</h3><button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button></div>
                          <div className="flex flex-col gap-4 mb-6">
                              <div>
                                  <label className="text-xs font-bold text-gray-500 mb-1 block">科目名稱</label>
                                  <input className="w-full border border-gray-300 rounded-xl p-3 text-sm outline-none focus:border-black transition-colors" placeholder="例如: 微積分" value={newCourse.name} onChange={e => setNewCourse({...newCourse, name: e.target.value})}/>
                              </div>
                              <div className="flex gap-4">
                                  <div className="flex-1">
                                      <label className="text-xs font-bold text-gray-500 mb-1 block">學分</label>
                                      <input className="w-full border border-gray-300 rounded-xl p-3 text-sm outline-none focus:border-black text-center" placeholder="3" type="number" value={newCourse.credit} onChange={e => setNewCourse({...newCourse, credit: e.target.value})}/>
                                  </div>
                                  <div className="flex-1">
                                      <label className="text-xs font-bold text-gray-500 mb-1 block">分數</label>
                                      <input className="w-full border border-gray-300 rounded-xl p-3 text-sm outline-none focus:border-black text-center" placeholder="85" type="number" value={newCourse.score} onChange={e => setNewCourse({...newCourse, score: e.target.value})}/>
                                  </div>
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-gray-500 mb-1 block">備註 (選填)</label>
                                  <input className="w-full border border-gray-300 rounded-xl p-3 text-sm outline-none focus:border-black" placeholder="期中考" value={newCourse.note} onChange={e => setNewCourse({...newCourse, note: e.target.value})}/>
                              </div>
                          </div>
                          <button onClick={addNewCourse} className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors">確認新增</button>
                      </div>
                  </div>
              )}

              {/* 成績計算機 Modal */}
              {calcModal.isOpen && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
                      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl flex flex-col h-[500px]">
                          <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                              <div>
                                  <h3 className="font-bold text-lg text-gray-800">{calcModal.courseName}</h3>
                                  <span className="text-xs text-gray-500">學期成績計算機</span>
                              </div>
                              <button onClick={closeCalculator} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                          </div>
                          
                          <div className="flex-1 overflow-y-auto mb-4 pr-1">
                              <div className="space-y-3">
                                  {currentCriteria.map((item, idx) => (
                                      <div key={item.id} className="flex gap-2 items-center">
                                          <input 
                                              className="flex-1 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500" 
                                              placeholder="項目 (如: 期中考)"
                                              value={item.name}
                                              onChange={(e) => updateCriteriaItem(item.id, 'name', e.target.value)}
                                          />
                                          <div className="relative w-20">
                                              <input 
                                                  className="w-full border border-gray-200 rounded-lg p-2 text-sm text-center outline-none focus:border-blue-500 pr-5" 
                                                  placeholder="30"
                                                  type="number"
                                                  value={item.weight}
                                                  onChange={(e) => updateCriteriaItem(item.id, 'weight', e.target.value)}
                                              />
                                              <span className="absolute right-2 top-2 text-xs text-gray-400">%</span>
                                          </div>
                                          <input 
                                              className="w-20 border border-gray-200 rounded-lg p-2 text-sm text-center outline-none focus:border-blue-500 font-bold text-blue-600" 
                                              placeholder="得分"
                                              type="number"
                                              value={item.score}
                                              onChange={(e) => updateCriteriaItem(item.id, 'score', e.target.value)}
                                          />
                                          <button onClick={() => removeCriteriaItem(item.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                                      </div>
                                  ))}
                                  <button onClick={addCriteriaItem} className="w-full border border-dashed border-gray-300 py-2.5 rounded-lg text-xs text-gray-500 hover:border-gray-400 hover:bg-gray-50 transition-all">+ 新增評分項目</button>
                              </div>
                          </div>

                          <div className="border-t border-gray-100 pt-4 mt-auto">
                              <div className="flex justify-between items-center mb-4">
                                  <div className="text-xs text-gray-500">
                                      總權重: <span className={currentTotalWeight !== 100 ? 'text-red-500 font-bold' : 'text-green-600 font-bold'}>{currentTotalWeight}%</span>
                                      {currentTotalWeight !== 100 && ' (未滿100%)'}
                                  </div>
                                  <div className="text-right">
                                      <span className="text-xs text-gray-500 block">預估學期成績</span>
                                      <span className="text-3xl font-black text-blue-600">{currentTotalScore}</span>
                                  </div>
                              </div>
                              <button onClick={saveCriteria} className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors">儲存並應用</button>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
  };

  const GradesView = ({ grades, setGrades }) => {
    const [viewMode, setViewMode] = useState('all'); 
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [newGradeEntry, setNewGradeEntry] = useState({ date: getLocalDateString(new Date()), subject: '', score: '', note: '' });
    const uniqueSubjects = useMemo(() => [...new Set(grades.map(g => g.subject))], [grades]);
    const saveNewGrade = () => { if (!newGradeEntry.subject) return; setGrades([...grades, { id: Date.now(), ...newGradeEntry }]); setIsAdding(false); };

    return (
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
            <div className="flex bg-gray-100 p-1 rounded-xl">
                {['all:所有紀錄', 'subjects:科目分類'].map(m => {
                    const [mode, label] = m.split(':');
                    return ( <button key={mode} onClick={() => { setViewMode(mode); setSelectedSubject(null); }} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === mode || (mode==='subjects' && viewMode==='subject-detail') ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-700'}`}>{label}</button> )
                })}
            </div>
            <button onClick={()=>setIsAdding(true)} className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-800 flex items-center gap-2 transition-colors"><Plus size={16} /> 新增紀錄</button>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2">
            {viewMode === 'all' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {grades.sort((a,b) => new Date(b.date) - new Date(a.date)).map(grade => (
                        <div key={grade.id} className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 hover:border-blue-300 transition-colors group relative">
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                            </div>
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-bold text-gray-800 text-lg">{grade.subject}</h4>
                                    <p className="text-xs text-gray-400 mt-1">{grade.date}</p>
                                </div>
                                <div className="text-3xl font-black text-blue-600">{grade.score}</div>
                            </div>
                            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">{grade.note || "無備註"}</div>
                        </div>
                    ))}
                </div>
            )}
            {viewMode === 'subjects' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{uniqueSubjects.map(subject => (
                    <div key={subject} onClick={() => { setSelectedSubject(subject); setViewMode('subject-detail'); }} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:border-blue-400 hover:shadow-md transition-all">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4"><BookOpen size={24} /></div>
                        <h4 className="font-bold text-gray-800 text-lg mb-1">{subject}</h4>
                        <span className="text-xs font-bold text-gray-400">{grades.filter(g=>g.subject===subject).length} 筆紀錄</span>
                    </div>
                ))}</div>
            )}
            {viewMode === 'subject-detail' && selectedSubject && (
                <div className="space-y-4 max-w-2xl mx-auto">
                    <div className="flex items-center gap-4 mb-4 border-b border-gray-100 pb-4">
                        <button onClick={() => setViewMode('subjects')} className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200 transition-colors"><ArrowLeft size={20} /></button>
                        <h2 className="text-2xl font-bold text-gray-800">{selectedSubject}</h2>
                    </div>
                    {grades.filter(g => g.subject === selectedSubject).map(grade => (
                        <div key={grade.id} className="bg-white border-l-4 border-blue-500 shadow-sm rounded-r-xl p-5 flex justify-between items-center">
                            <div><span className="text-xs text-gray-400 font-mono block mb-1">{grade.date}</span><span className="text-base font-bold text-gray-800">{grade.note}</span></div>
                            <span className="text-2xl font-black text-gray-800">{grade.score}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {isAdding && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl">
                    <div className="flex justify-between items-center mb-6"><span className="font-bold text-lg text-gray-800">新增成績紀錄</span><button onClick={()=>setIsAdding(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button></div>
                    <div className="space-y-4">
                        <input type="date" value={newGradeEntry.date} onChange={e=>setNewGradeEntry({...newGradeEntry, date: e.target.value})} className="w-full border border-gray-300 p-3 rounded-xl text-sm focus:border-black outline-none"/>
                        <div className="flex gap-3">
                            <input placeholder="科目" value={newGradeEntry.subject} onChange={e=>setNewGradeEntry({...newGradeEntry, subject: e.target.value})} className="flex-1 border border-gray-300 p-3 rounded-xl text-sm focus:border-black outline-none"/>
                            <input placeholder="分數" type="number" value={newGradeEntry.score} onChange={e=>setNewGradeEntry({...newGradeEntry, score: e.target.value})} className="w-24 border border-gray-300 p-3 rounded-xl text-sm focus:border-black outline-none text-center"/>
                        </div>
                        <input placeholder="備註 (例如：期中考)" value={newGradeEntry.note} onChange={e=>setNewGradeEntry({...newGradeEntry, note: e.target.value})} className="w-full border border-gray-300 p-3 rounded-xl text-sm focus:border-black outline-none"/>
                        <button onClick={saveNewGrade} className="w-full bg-black text-white py-3.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors mt-2">確認新增</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  };

  const DashboardView = ({ tasks, currentDate, setCurrentDate }) => (
      <div className="h-full flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-80 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-fit">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><Calendar size={20} className="text-red-500"/> {currentDate.getMonth()+1} 月</h2>
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-2"><div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div><div>日</div></div>
              <div className="grid grid-cols-7 gap-1 text-sm">
                  {Array.from({length: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() === 0 ? 6 : new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() - 1}).map((_, i) => (<div key={`empty-${i}`} className="aspect-square"></div>))}
                  {Array.from({length: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()}).map((_, i) => {
                      const day = i + 1;
                      const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                      const isSelected = day === currentDate.getDate();
                      const dayTasks = tasks.filter(t => new Date(t.date).toDateString() === dateObj.toDateString());
                      return (
                          <div key={i} onClick={() => setCurrentDate(dateObj)} className={`aspect-square flex flex-col items-center justify-center rounded-lg cursor-pointer relative transition-all ${isSelected ? 'bg-black text-white shadow-md' : 'bg-white hover:bg-gray-50 text-gray-700'}`}>
                              <span className="text-xs font-bold z-10">{day}</span>
                              <div className="flex gap-0.5 mt-1 h-1">{dayTasks.slice(0, 3).map((t, idx) => (<div key={idx} className={`w-1 h-1 rounded-full ${CATEGORIES[t.category.toUpperCase()]?.color || 'bg-gray-400'}`}></div>))}</div>
                          </div>
                      );
                  })}
              </div>
          </div>
          
          <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col">
              <h3 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">{currentDate.getMonth()+1}/{currentDate.getDate()} 行程概覽</h3>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {tasks.filter(t => new Date(t.date).toDateString() === currentDate.toDateString()).length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300 text-sm italic">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3"><Sparkles size={24} className="opacity-20"/></div>
                        本日無任何行程，好好休息吧！
                    </div>
                ) : (
                    tasks.filter(t => new Date(t.date).toDateString() === currentDate.toDateString()).map(task => (
                        <div key={task.id} className={`flex items-center p-4 bg-white rounded-xl shadow-sm border-l-4 ${CATEGORIES[task.category.toUpperCase()].border} border-t border-r border-b border-gray-100 hover:shadow-md transition-shadow`}>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full text-white font-bold ${CATEGORIES[task.category.toUpperCase()].color}`}>{CATEGORIES[task.category.toUpperCase()].label}</span>
                                    <span className="font-bold text-gray-800">{task.subject}</span>
                                </div>
                                <p className="text-sm text-gray-500 pl-1">{task.note}</p>
                            </div>
                            {task.completed ? <div className="bg-green-50 text-green-600 p-1.5 rounded-full"><Check size={20} /></div> : <div className="w-5 h-5 rounded-full border-2 border-gray-200"></div>}
                        </div>
                    ))
                )}
              </div>
          </div>
      </div>
  );

  const PlannerView = ({ tasks, setTasks, weekDays }) => {
    const [newItem, setNewItem] = useState({ category: 'homework', subject: '', note: '' });
    
    const toggleTask = (id) => { setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)); };
    
    const handleAdd = (dateStr) => { 
        if (!newItem.subject) return; 
        setTasks([...tasks, { id: Date.now(), date: dateStr, ...newItem, completed: false }]); 
        setNewItem({ ...newItem, subject: '', note: '' }); 
    };

    const handleDelete = (taskId, taskSubject) => {
        if (window.confirm(`確定要刪除「${taskSubject}」嗎？`)) {
            setTasks(tasks.filter(t => t.id !== taskId));
        }
    };

    return (
      <div className="h-full flex flex-col">
        {/* 7欄式網格排版，利用 xl:grid-cols-7 強制在一行顯示 */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 h-full overflow-y-auto xl:overflow-hidden">
            {weekDays.map((day) => {
            const dateStr = getLocalDateString(day);
            const dayTasks = tasks.filter(t => t.date === dateStr);
            const isToday = new Date().toDateString() === day.toDateString();
            
            return (
                <div key={dateStr} className={`flex flex-col rounded-xl border ${isToday ? 'border-blue-500 shadow-md ring-2 ring-blue-50' : 'border-gray-200 shadow-sm'} bg-white overflow-hidden h-fit xl:h-full transition-all`}>
                    <div className={`px-3 py-2 border-b ${isToday ? 'bg-blue-500 text-white' : 'bg-gray-50 text-gray-700'} text-xs font-bold flex justify-between items-center`}>
                        <span>{['週一','週二','週三','週四','週五','週六','週日'][day.getDay() === 0 ? 6 : day.getDay()-1]}</span>
                        <span className={isToday ? 'text-blue-100' : 'text-gray-400'}>{day.getMonth()+1}/{day.getDate()}</span>
                    </div>
                    
                    {/* 卡片內容區 */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-1.5 bg-gray-50/30 min-h-[100px] xl:min-h-0 custom-scrollbar">
                        {dayTasks.length === 0 && <div className="text-[10px] text-gray-300 text-center py-4 italic">無待辦</div>}
                        {dayTasks.map(task => (
                            <div key={task.id} className={`group relative bg-white p-2 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all ${task.completed ? 'opacity-60 grayscale' : ''}`}>
                                <div className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full ${CATEGORIES[task.category.toUpperCase()].color}`}></div>
                                <div className="flex items-start gap-2 pl-1.5">
                                    <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} className="mt-0.5 w-3 h-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"/>
                                    <div className="flex-1 min-w-0">
                                        <div className={`font-bold text-xs truncate ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.subject}</div>
                                        <div className="text-[10px] text-gray-500 truncate">{task.note}</div>
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(task.id, task.subject)} className="absolute top-1 right-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                            </div>
                        ))}
                    </div>

                    {/* 底部輸入區 */}
                    <div className="p-2 bg-white border-t border-gray-100">
                        <div className="flex flex-col gap-1.5">
                            <div className="flex gap-1.5">
                                <select className="text-[10px] border border-gray-200 rounded p-1 bg-gray-50 outline-none flex-1 truncate" value={newItem.category} onChange={(e) => setNewItem({...newItem, category: e.target.value})}>{Object.values(CATEGORIES).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
                                <input placeholder="科目" className="text-[10px] border border-gray-200 p-1 rounded w-16 outline-none focus:border-blue-500" onChange={e=>setNewItem({...newItem, subject: e.target.value})} value={newItem.subject} />
                            </div>
                            <div className="flex gap-1.5">
                                <input placeholder="備註" className="text-[10px] border border-gray-200 p-1 rounded flex-1 outline-none focus:border-blue-500" onChange={e=>setNewItem({...newItem, note: e.target.value})} value={newItem.note} />
                                <button onClick={()=>handleAdd(dateStr)} className="p-1 bg-black text-white rounded hover:bg-gray-800 transition-colors flex items-center justify-center w-6"><Plus size={12}/></button>
                            </div>
                        </div>
                    </div>
                </div>
            );
            })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <div className="max-w-6xl mx-auto h-full flex flex-col">
             {!isDataLoaded ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 animate-pulse flex-col gap-2">
                   <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
                   <span className="text-sm font-bold">資料載入中...</span>
                </div>
             ) : (
                <>
                  {activeTab === 'dashboard' && <DashboardView tasks={tasks} currentDate={currentDate} setCurrentDate={setCurrentDate} />}
                  {activeTab === 'planner' && <PlannerView tasks={tasks} setTasks={setTasks} weekDays={weekDays} />}
                  {activeTab === 'grades' && <GradesView grades={grades} setGrades={setGrades} />}
                  {activeTab === 'gpa' && <GpaView gpaCourses={gpaCourses} setGpaCourses={setGpaCourses} courseCriteria={courseCriteria} setCourseCriteria={setCourseCriteria} />}
                  {activeTab === 'timetable' && <TimetableView timetable={timetable} setTimetable={setTimetable} periodTimes={periodTimes} setPeriodTimes={setPeriodTimes} />}
                  {activeTab === 'pomodoro' && <PomodoroView studyLogs={studyLogs} setStudyLogs={setStudyLogs} currentDate={currentDate} pomodoroSubjects={pomodoroSubjects} setPomodoroSubjects={setPomodoroSubjects} />}
                  {activeTab === 'ai' && <AIChatView tasks={tasks} grades={grades} timetable={timetable} currentDate={currentDate} gpaCourses={gpaCourses} periodTimes={periodTimes} />}
                  {activeTab === 'links' && <LinksView links={links} setLinks={setLinks} />}
                </>
             )}
          </div>
        </div>
      </main>
    </div>
  );
}