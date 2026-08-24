import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import { taskService } from '../../services/taskService';
import { KanbanColumn } from '../../components/common/KanbanColumn';
import { KanbanCard } from '../../components/common/KanbanCard';
import { Select } from '../../components/common/Select';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../api/apiClient';
import type { Task, ProjectStatus, Project } from '../../types';
import { mapProject, mapTask } from '../../utils/mappers';

function SortableTaskCard({
  task,
  assigneeName,
  onClick,
}: {
  task: Task;
  assigneeName?: string;
  onClick?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task, statusId: task.statusId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <KanbanCard
        task={task}
        assigneeName={assigneeName}
        onClick={onClick}
        dragHandleProps={listeners}
      />
    </div>
  );
}

function DroppableColumn({
  status,
  tasks,
  children,
}: {
  status: ProjectStatus;
  tasks: Task[];
  children?: React.ReactNode;
}) {
  return (
    <KanbanColumn title={status.name} count={tasks.length} color={status.color}>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </KanbanColumn>
  );
}

export default function KanbanBoardPage() {
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  useEffect(() => {
    Promise.all([
      projectService.list(),
      taskService.list(),
    ]).then(([projectsRes, tasksRes]) => {
      const pData = projectsRes.data.data || projectsRes.data || [];
      const tData = tasksRes.data.data || tasksRes.data || [];
      setProjects((Array.isArray(pData) ? pData : []).map(mapProject));
      setAllTasks((Array.isArray(tData) ? tData : []).map(mapTask));
      const list = Array.isArray(pData) ? pData : [];
      if (list.length > 0) {
        setSelectedProjectId(mapProject(list[0]).id);
      }
    }).catch(() => {});
  }, []);

  const project = useMemo(
    () => projects.find((p) => p.id === selectedProjectId),
    [selectedProjectId, projects]
  );

  const projectTasks = useMemo(
    () => allTasks.filter((t) => t.projectId === selectedProjectId),
    [allTasks, selectedProjectId]
  );

  const statuses = useMemo(
    () => (project?.statuses ?? []).filter((s) => s.enabled).sort((a, b) => a.order - b.order),
    [project]
  );

  const getUserById = useCallback((id: string) => ({ name: id } as any), []);

  const getTasksForStatus = useCallback(
    (statusId: string) =>
      projectTasks
        .filter((t) => t.statusId === statusId)
        .sort((a, b) => {
          const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
          return (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
        }),
    [projectTasks]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const findTaskById = useCallback(
    (id: string) => allTasks.find((t) => t.id === id) ?? null,
    [allTasks]
  );

  const findStatusForTask = useCallback(
    (taskId: string) => {
      const task = allTasks.find((t) => t.id === taskId);
      return task?.statusId ?? null;
    },
    [allTasks]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const task = findTaskById(active.id as string);
      if (task) setActiveTask(task);
    },
    [findTaskById]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeStatus = findStatusForTask(activeId);
      if (!activeStatus) return;

      let overStatus: string | null = null;
      const overTask = findTaskById(overId);
      if (overTask) {
        overStatus = overTask.statusId;
      } else {
        const matchedStatus = statuses.find((s) => s.id === overId);
        if (matchedStatus) overStatus = matchedStatus.id;
      }

      if (!overStatus || activeStatus === overStatus) return;

      setAllTasks((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, statusId: overStatus! } : t))
      );
      taskService.update(activeId, { status_id: overStatus }).then(res => {
        const msg = (res as any).data?.message;
        if (msg) showSuccess(msg);
      }).catch((err: any) => {
        showError(getErrorMessage(err));
        setAllTasks((prev) =>
          prev.map((t) => (t.id === activeId ? { ...t, statusId: activeStatus } : t))
        );
      });
    },
    [findStatusForTask, findTaskById, statuses, showSuccess, showError]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      if (activeId === overId) return;

      const activeStatus = findStatusForTask(activeId);
      const overTask = findTaskById(overId);
      const overStatus = overTask?.statusId ?? statuses.find((s) => s.id === overId)?.id;

      if (!activeStatus || !overStatus) return;

      if (activeStatus === overStatus && overTask) {
        setAllTasks((prev) => {
          const columnTasks = prev.filter(
            (t) => t.statusId === activeStatus && t.projectId === selectedProjectId
          );
          const activeIndex = columnTasks.findIndex((t) => t.id === activeId);
          const overIndex = columnTasks.findIndex((t) => t.id === overId);

          if (activeIndex === -1 || overIndex === -1) return prev;

          const reordered = [...columnTasks];
          const [moved] = reordered.splice(activeIndex, 1);
          reordered.splice(overIndex, 0, moved);

          const otherTasks = prev.filter(
            (t) => t.statusId !== activeStatus || t.projectId !== selectedProjectId
          );
          return [...otherTasks, ...reordered];
        });
      }
    },
    [findStatusForTask, findTaskById, statuses, selectedProjectId]
  );

  const projectOptions = projects.map((p) => ({ value: p.id, label: p.name }));

  const handleCardClick = useCallback((task: Task) => {
    navigate(`/tasks/${task.id}`);
  }, [navigate]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <LayoutGrid className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Kanban Board
          </h1>
        </div>
        <div className="w-64">
          <Select
            options={projectOptions}
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            placeholder="Select project"
          />
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        {project ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 h-full">
              {statuses.map((status) => {
                const columnTasks = getTasksForStatus(status.id);
                return (
                  <DroppableColumn key={status.id} status={status} tasks={columnTasks}>
                    {columnTasks.map((task) => (
                      <SortableTaskCard
                        key={task.id}
                        task={task}
                        assigneeName={task.assignedTo ? getUserById(task.assignedTo)?.name : undefined}
                        onClick={() => handleCardClick(task)}
                      />
                    ))}
                  </DroppableColumn>
                );
              })}
            </div>

            <DragOverlay>
              {activeTask ? (
                <div className="opacity-90 rotate-2 scale-105">
                  <KanbanCard
                    task={activeTask}
                    assigneeName={activeTask.assignedTo ? getUserById(activeTask.assignedTo)?.name : undefined}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
            Select a project to view the board
          </div>
        )}
      </div>
    </div>
  );
}

