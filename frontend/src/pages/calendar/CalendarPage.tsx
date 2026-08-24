import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { projectService } from '../../services/projectService';
import { teamService } from '../../services/teamService';
import { calendarService } from '../../services/calendarService';
import { getErrorMessage } from '../../api/apiClient';
import { mapProject, mapTeam, mapCalendarEvent } from '../../utils/mappers';
import type { CalendarEvent, Project, Team } from '../../types';

export default function CalendarPage() {
  const { projectId: paramId } = useParams();
  const fetchSeq = useRef(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState(paramId || '');
  const [teams, setTeams] = useState<Team[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    projectService.list().then(res => {
      const list = (res.data.data || res.data || []).map(mapProject);
      setProjects(list);
      if (!paramId && list[0]) setProjectId(list[0].id);
    }).catch(e => setError(getErrorMessage(e)));
  }, []);

  const fetchCalendar = useCallback(async () => {
    if (!projectId) return;
    const seq = ++fetchSeq.current;
    setLoading(true);
    setError('');
    try {
      const [evRes, tmRes] = await Promise.all([
        calendarService.getEvents(projectId, filterTeam ? { team_id: filterTeam } : undefined),
        teamService.list(projectId).catch(() => ({ data: { data: [] } })),
      ]);
      if (seq !== fetchSeq.current) return;
      setEvents((evRes.data.data || evRes.data || []).map(mapCalendarEvent));
      setTeams((tmRes.data.data || tmRes.data || []).map(mapTeam));
    } catch (e) { if (seq === fetchSeq.current) setError(getErrorMessage(e)); } finally { if (seq === fetchSeq.current) setLoading(false); }
  }, [projectId, filterTeam]);

  useEffect(() => { fetchCalendar(); }, [fetchCalendar]);

  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayEvents = events.filter(e => e.start === iso);
    return { date: d, iso, dayEvents };
  });

  const project = projects.find(p => p.id === projectId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><CalendarIcon className="h-6 w-6" />Calendar</h1>
          <p className="text-sm text-slate-500">Project: {project?.name || '—'}</p>
        </div>
        <div className="flex gap-3">
          <Select options={projects.map(p => ({ value: p.id, label: p.name }))} value={projectId} onChange={e => { setProjectId(e.target.value); setFilterTeam(''); }} className="w-56" />
          <Select options={[{ value: '', label: 'All Teams' }, ...teams.map(t => ({ value: t.id, label: t.name }))]} value={filterTeam} onChange={e => setFilterTeam(e.target.value)} className="w-40" />
        </div>
      </div>

      {error ? <div className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-800 p-8 text-center text-sm text-red-500">{error}</div> :
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
          <div className="flex gap-2">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Today</button>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
        {loading ? <div className="py-16 text-center text-sm text-slate-500">Loading events...</div> : (
          <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="bg-slate-50 dark:bg-slate-800 p-2 text-center text-xs font-semibold text-slate-500">{d}</div>)}
            {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} className="bg-white dark:bg-slate-900 h-24" />)}
            {days.map(({ date, iso, dayEvents }) => (
              <div key={iso} className={`bg-white dark:bg-slate-900 h-24 p-1 overflow-hidden ${iso === new Date().toISOString().slice(0, 10) ? 'ring-1 ring-primary-400' : ''}`}>
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300">{date.getDate()}</div>
                <div className="space-y-1 mt-1">
                  {dayEvents.slice(0, 3).map(ev => (
                    <div key={ev.id} onClick={() => setSelectedEvent(ev)} className="text-[10px] px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80" style={{ backgroundColor: ev.color ? ev.color + '20' : '#3b82f620', color: ev.color || '#3b82f6' }}>
                      {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && <div className="text-[10px] text-slate-400">+{dayEvents.length - 3} more</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>}

      {selectedEvent && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-900 dark:text-white">{selectedEvent.title}</h3>
            <p className="text-sm text-slate-500">{selectedEvent.type} • {selectedEvent.start}</p>
            <Badge>{selectedEvent.type}</Badge>
            <div className="flex justify-end gap-2">
              <button onClick={() => setSelectedEvent(null)} className="text-sm text-slate-500">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
