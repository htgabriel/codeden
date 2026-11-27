import type { Project, Session } from "@codeden/contracts";
import {
  type Announcements,
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  type Modifier,
  PointerSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "@/lib/i18n";
import { useProjectActions } from "@/lib/project-actions";
import { ProjectGroup } from "./project-group";
import type { GroupPosition } from "./project-menu";

/** Drags move up and down only. */
const verticalOnly: Modifier = ({ transform }) => ({ ...transform, x: 0 });

function SortableProject({
  project,
  sessions,
  position,
}: {
  project: Project;
  sessions: Session[];
  position: GroupPosition;
}) {
  const sortable = useSortable({ id: project.id });
  const drag = {
    setNodeRef: sortable.setNodeRef,
    setActivatorNodeRef: sortable.setActivatorNodeRef,
    attributes: sortable.attributes,
    listeners: sortable.listeners,
    style: {
      transform: CSS.Translate.toString(sortable.transform),
      transition: sortable.transition,
    },
    isDragging: sortable.isDragging,
  };
  return <ProjectGroup project={project} sessions={sessions} drag={drag} position={position} />;
}

/**
 * One group of the project list (pinned, or the rest), sortable on its own: projects never
 * cross groups by dragging. Mouse drags start after 6px so clicks still open and expand; the
 * grip in each row's gutter starts a keyboard move.
 */
export function SortableProjectGroup({
  projects,
  sessions,
  label,
}: {
  projects: Project[];
  sessions: Session[];
  /** Group name for screen reader announcements. */
  label: string;
}) {
  const { t } = useTranslation();
  const actions = useProjectActions();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = projects.map((p) => p.id);
  const name = (id: UniqueIdentifier) =>
    projects.find((p) => p.id === id)?.name ?? t("shell.projectList.project");
  const place = (id: UniqueIdentifier) =>
    t("shell.projectList.place", {
      n: ids.indexOf(String(id)) + 1,
      total: ids.length,
      group: label,
    });
  const announcements: Announcements = {
    onDragStart: ({ active }) => t("shell.projectList.pickedUp", { name: name(active.id) }),
    onDragOver: ({ active, over }) =>
      over
        ? t("shell.projectList.isAt", { name: name(active.id), place: place(over.id) })
        : t("shell.projectList.outside", { name: name(active.id) }),
    onDragEnd: ({ active, over }) =>
      over
        ? t("shell.projectList.droppedAt", { name: name(active.id), place: place(over.id) })
        : t("shell.projectList.dropped", { name: name(active.id) }),
    onDragCancel: ({ active }) => t("shell.projectList.cancelled", { name: name(active.id) }),
  };
  const screenReaderInstructions = { draggable: t("shell.projectList.instructions") };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    void actions.moveTo(String(active.id), ids.indexOf(String(over.id)));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[verticalOnly]}
      onDragEnd={onDragEnd}
      accessibility={{ announcements, screenReaderInstructions }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {projects.map((project, index) => (
          <SortableProject
            key={project.id}
            project={project}
            sessions={sessions.filter((s) => s.projectId === project.id)}
            position={{ index, count: projects.length }}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}
