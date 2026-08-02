import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { scheduleTimetableNotifications } from './notificationService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sh2_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeCourseId, setActiveCourseId] = useState(() => {
    return localStorage.getItem('sh2_active_course') || null;
  });

  const [globalYear, setGlobalYear] = useState(() => localStorage.getItem('sh2_global_year') || '1st Year');
  const [globalSemester, setGlobalSemester] = useState(() => localStorage.getItem('sh2_global_semester') || '1st Semester');

  // Dual-sync states (Local + Cloud)
  const [courses, setCourses] = useState(() => { const s = localStorage.getItem('sh2_courses'); return s ? JSON.parse(s) : []; });
  const [attendances, setAttendances] = useState(() => { const s = localStorage.getItem('sh2_attendances'); return s ? JSON.parse(s) : []; });
  const [attendanceHistory, setAttendanceHistory] = useState(() => { const s = localStorage.getItem('sh2_attendanceHistory'); return s ? JSON.parse(s) : []; });
  const [notes, setNotes] = useState(() => { const s = localStorage.getItem('sh2_notes'); return s ? JSON.parse(s) : []; });
  const [assignments, setAssignments] = useState(() => { const s = localStorage.getItem('sh2_assignments'); return s ? JSON.parse(s) : []; });
  const [timetable, setTimetable] = useState(() => { const s = localStorage.getItem('sh2_timetable'); return s ? JSON.parse(s) : []; });
  const [grades, setGrades] = useState(() => { const s = localStorage.getItem('sh2_grades'); return s ? JSON.parse(s) : []; });
  const [flashcards, setFlashcards] = useState(() => { const s = localStorage.getItem('sh2_flashcards'); return s ? JSON.parse(s) : []; });
  const [settings, setSettings] = useState(() => { const s = localStorage.getItem('sh2_settings'); return s ? JSON.parse(s) : { theme: 'light', appStyle: 'minimalist', accent: 'indigo', onboardingCompleted: false }; });
  const [masterDriveLinks, setMasterDriveLinks] = useState(() => { const s = localStorage.getItem('sh2_master_drives'); return s ? JSON.parse(s) : []; });

  const [isFirebaseLoaded, setIsFirebaseLoaded] = useState(false);
  const [authConfirmed, setAuthConfirmed] = useState(false);
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced', 'syncing', 'error'

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) setAuthConfirmed(true);
      else setAuthConfirmed(false);
    });
    return () => unsubscribe();
  }, []);

  // Load from Firebase on mount or login
  useEffect(() => {
    if (!user || !authConfirmed) return; // Wait until logged in AND auth token is ready
    const loadFromFirebase = async () => {
      try {
        // Use a static doc ID for the single user for now, or user.id
        const docRef = doc(db, 'users', user.id || 'my_personal_data');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Merge strategy: if cloud has data, use it. Else keep local.
          if (data.courses && data.courses.length > 0) setCourses(data.courses);
          if (data.attendances && data.attendances.length > 0) setAttendances(data.attendances);
          if (data.attendanceHistory && data.attendanceHistory.length > 0) setAttendanceHistory(data.attendanceHistory);
          if (data.notes && data.notes.length > 0) setNotes(data.notes);
          if (data.assignments && data.assignments.length > 0) setAssignments(data.assignments);
          if (data.timetable && data.timetable.length > 0) setTimetable(data.timetable);
          if (data.grades && data.grades.length > 0) setGrades(data.grades);
          if (data.flashcards && data.flashcards.length > 0) setFlashcards(data.flashcards);
          if (data.settings) setSettings(data.settings);
          if (data.masterDriveLinks) setMasterDriveLinks(data.masterDriveLinks);
          if (data.globalYear) setGlobalYear(data.globalYear);
          if (data.globalSemester) setGlobalSemester(data.globalSemester);
        } else {
          // First login, or no data yet. Cloud is empty, we keep local data and let the dual-sync save it to cloud.
        }
      } catch (err) {
        console.error("Firebase Load Error:", err);
      } finally {
        setIsFirebaseLoaded(true);
      }
    };
    loadFromFirebase();
  }, [user, authConfirmed]);

  // Sync to Firebase (Debounced)
  useEffect(() => {
    if (!isFirebaseLoaded || !user || !authConfirmed) return;
    
    setSyncStatus('syncing');
    const timeoutId = setTimeout(() => {
      const docRef = doc(db, 'users', user.id || 'my_personal_data');
      setDoc(docRef, {
        courses,
        attendances,
        attendanceHistory,
        notes,
        assignments,
        timetable,
        grades,
        flashcards,
        settings,
        masterDriveLinks,
        globalYear,
        globalSemester,
        name: user.name || 'Anonymous User',
        email: user.email || 'N/A',
        lastSync: new Date().toISOString()
      }, { merge: true })
      .then(() => setSyncStatus('synced'))
      .catch(err => {
        console.error("Firebase Save Error:", err);
        setSyncStatus('error');
      });
    }, 1500); // 1.5 second debounce

    return () => clearTimeout(timeoutId);
  }, [courses, attendances, attendanceHistory, notes, assignments, timetable, grades, flashcards, settings, masterDriveLinks, globalYear, globalSemester, isFirebaseLoaded, user, authConfirmed]);

  useEffect(() => localStorage.setItem('sh2_user', JSON.stringify(user)), [user]);
  
  useEffect(() => {
    if (activeCourseId) localStorage.setItem('sh2_active_course', activeCourseId);
    else localStorage.removeItem('sh2_active_course');
  }, [activeCourseId]);

  useEffect(() => localStorage.setItem('sh2_courses', JSON.stringify(courses)), [courses]);
  useEffect(() => localStorage.setItem('sh2_attendances', JSON.stringify(attendances)), [attendances]);
  useEffect(() => localStorage.setItem('sh2_attendanceHistory', JSON.stringify(attendanceHistory)), [attendanceHistory]);
  useEffect(() => localStorage.setItem('sh2_notes', JSON.stringify(notes)), [notes]);
  useEffect(() => localStorage.setItem('sh2_assignments', JSON.stringify(assignments)), [assignments]);
  useEffect(() => localStorage.setItem('sh2_timetable', JSON.stringify(timetable)), [timetable]);
  useEffect(() => localStorage.setItem('sh2_grades', JSON.stringify(grades)), [grades]);
  useEffect(() => localStorage.setItem('sh2_flashcards', JSON.stringify(flashcards)), [flashcards]);
  useEffect(() => localStorage.setItem('sh2_settings', JSON.stringify(settings)), [settings]);
  useEffect(() => localStorage.setItem('sh2_master_drives', JSON.stringify(masterDriveLinks)), [masterDriveLinks]);
  
  useEffect(() => localStorage.setItem('sh2_global_year', globalYear), [globalYear]);
  useEffect(() => localStorage.setItem('sh2_global_semester', globalSemester), [globalSemester]);

  const activeCourses = courses.filter(c => c.year === globalYear && c.semester === globalSemester);

  // Push Notifications for Deadlines
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted' && assignments.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const lastNotified = localStorage.getItem('sh2_last_notified_date');
      
      if (lastNotified !== todayStr) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        const dueTomorrow = assignments.filter(a => !a.completed && a.dueDate && a.dueDate.startsWith(tomorrowStr));
        
        if (dueTomorrow.length > 0) {
          navigator.serviceWorker.ready.then(registration => {
            registration.showNotification('Deadline Tomorrow!', {
              body: `You have ${dueTomorrow.length} assignment(s) due tomorrow!`,
              icon: '/favicon.svg'
            });
            localStorage.setItem('sh2_last_notified_date', todayStr);
          }).catch(e => console.log('SW Notification failed', e));
        }
      }
    }
  }, [assignments]);

  // Apply theme and accent on load
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (settings.theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(settings.theme);
    }
  }, [settings.theme]);

  // Apply App Style (Colorful vs Minimalist) and Glassmorphism
  useEffect(() => {
    const root = window.document.documentElement;
    if (settings.appStyle === 'minimalist') {
      root.classList.add('theme-minimalist');
    } else {
      root.classList.remove('theme-minimalist');
    }
    
    if (settings.glassmorphism) {
      root.classList.add('theme-glass');
    } else {
      root.classList.remove('theme-glass');
    }
  }, [settings.appStyle, settings.glassmorphism]);

  useEffect(() => {
    if (timetable.length > 0 && activeCourses.length > 0) {
      scheduleTimetableNotifications(timetable, activeCourses);
    }
  }, [timetable, activeCourses]);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{
      user, login, logout,
      activeCourseId, setActiveCourseId,
      courses, setCourses,
      attendances, setAttendances,
      attendanceHistory, setAttendanceHistory,
      notes, setNotes,
      assignments, setAssignments,
      timetable, setTimetable,
      grades, setGrades,
      flashcards, setFlashcards,
      settings, setSettings,
      masterDriveLinks, setMasterDriveLinks,
      globalYear, setGlobalYear,
      globalSemester, setGlobalSemester,
      activeCourses,
      syncStatus,
      isFirebaseLoaded
    }}>
      {children}
    </AuthContext.Provider>
  );
};
