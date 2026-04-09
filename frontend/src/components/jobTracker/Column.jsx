import { Droppable } from "@hello-pangea/dnd";
import Card from "./Card";

const Column = ({ title, jobs, onNotesSave, onDelete }) => {
  return (
    <div className="bg-muted/40 rounded-xl p-4 border border-border min-w-[320px] max-w-[320px] flex flex-col">
      <h3 className="font-medium text-foreground mb-4 flex items-center justify-between">
        {title}
        <span className="text-sm text-muted-foreground">{jobs.length}</span>
      </h3>

      <Droppable droppableId={title}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[120px] flex-1 space-y-3 transition
              ${snapshot.isDraggingOver ? "bg-primary/10 rounded-lg" : ""}`}
            style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}
          >
            {jobs.map((job, index) => (
              <Card
                key={String(job.id || job._id)}
                job={job}
                index={index}
                onNotesSave={onNotesSave}
                onDelete={onDelete}   // PASS DELETE CALLBACK
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default Column;
