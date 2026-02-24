import { Droppable } from "@hello-pangea/dnd";
import Card from "./Card";

const Column = ({ title, jobs, onNotesSave, onDelete }) => {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border min-w-[320px] max-w-[320px] flex flex-col">
      <h3 className="font-medium text-gray-700 mb-4 flex items-center justify-between">
        {title}
        <span className="text-sm text-gray-400">{jobs.length}</span>
      </h3>

      <Droppable droppableId={title}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[120px] flex-1 space-y-3 transition
              ${snapshot.isDraggingOver ? "bg-blue-50 rounded-lg" : ""}`}
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
