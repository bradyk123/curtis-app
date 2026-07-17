import type { ReactNode, CSSProperties } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface DragProps {
  /** Spread onto the row/card element (ref + transform styles). */
  rowProps: { ref: (el: HTMLElement | null) => void; style: CSSProperties };
  /** Spread onto the drag-handle element (grip) that initiates the drag. */
  handleProps: Record<string, unknown>;
  isDragging: boolean;
}

function SortableRow<T>({
  id,
  item,
  renderItem,
}: {
  id: UniqueIdentifier;
  item: T;
  renderItem: (item: T, drag: DragProps) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
    opacity: isDragging ? 0.9 : undefined,
    position: isDragging ? "relative" : undefined,
  };
  return (
    <>
      {renderItem(item, {
        rowProps: { ref: setNodeRef, style },
        handleProps: { ref: setActivatorNodeRef, ...attributes, ...listeners },
        isDragging,
      })}
    </>
  );
}

/**
 * Generic drag-to-reorder list. Renders no wrapper DOM of its own, so it drops
 * straight into existing `.list` / grid containers. `onReorder` receives the
 * fully reordered array; persist it however you like.
 */
export function SortableList<T>({
  items,
  getId,
  onReorder,
  renderItem,
  grid = false,
}: {
  items: T[];
  getId: (item: T) => UniqueIdentifier;
  onReorder: (reordered: T[]) => void;
  renderItem: (item: T, drag: DragProps) => ReactNode;
  /** Use the 2-D rect strategy for grid layouts (e.g. the video clip grid). */
  grid?: boolean;
}) {
  const sensors = useSensors(
    // small distance/delay so taps on inner buttons don't start a drag
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const ids = items.map(getId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (!over || active.id === over.id) return;
        const oldIndex = ids.indexOf(active.id);
        const newIndex = ids.indexOf(over.id);
        if (oldIndex < 0 || newIndex < 0) return;
        onReorder(arrayMove(items, oldIndex, newIndex));
      }}
    >
      <SortableContext items={ids} strategy={grid ? rectSortingStrategy : verticalListSortingStrategy}>
        {items.map((item) => (
          <SortableRow key={String(getId(item))} id={getId(item)} item={item} renderItem={renderItem} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
