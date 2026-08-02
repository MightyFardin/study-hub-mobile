import { LocalNotifications } from '@capacitor/local-notifications';

const DAYS_MAP = {
  'Sunday': 1,
  'Monday': 2,
  'Tuesday': 3,
  'Wednesday': 4,
  'Thursday': 5,
  'Friday': 6,
  'Saturday': 7
};

export const scheduleTimetableNotifications = async (timetable, activeCourses) => {
  try {
    const permStatus = await LocalNotifications.checkPermissions();
    if (permStatus.display !== 'granted') {
      const request = await LocalNotifications.requestPermissions();
      if (request.display !== 'granted') return;
    }
    
    // Clear all existing pending notifications to avoid duplicates
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }

    const activeTimetable = timetable.filter(t => activeCourses.some(c => c.id === t.courseId));
    if (activeTimetable.length === 0) return;

    const notifications = [];
    let idCounter = 1;

    for (const entry of activeTimetable) {
      const course = activeCourses.find(c => c.id === entry.courseId);
      if (!course) continue;

      const weekday = DAYS_MAP[entry.day];
      if (!weekday) continue;

      const [hourStr, minuteStr] = entry.time.split(':');
      let hour = parseInt(hourStr, 10);
      let minute = parseInt(minuteStr, 10);
      
      // Remind 10 minutes before
      minute -= 10;
      if (minute < 0) {
        minute += 60;
        hour -= 1;
      }
      if (hour < 0) hour += 24;

      notifications.push({
        id: idCounter++,
        title: `Upcoming Class: ${course.name}`,
        body: `Your class starts in 10 minutes at ${entry.time}${entry.room ? ` in Room ${entry.room}` : ''}.`,
        schedule: { on: { weekday, hour, minute }, repeats: true },
        sound: null, // default sound
      });
    }

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
    }
  } catch (error) {
    console.error("Failed to schedule notifications", error);
  }
};
