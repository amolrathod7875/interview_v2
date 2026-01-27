import { Droppable } from "@hello-pangea/dnd";
import Card from "./Card";

const Column = ({ title, jobs, onNotesSave, onDelete }) => {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border">
      <h3 className="font-medium text-gray-700 mb-4 flex items-center justify-between">
        {title}
        <span className="text-sm text-gray-400">{jobs.length}</span>
      </h3>

      <Droppable droppableId={title}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[120px] space-y-3 transition
              ${snapshot.isDraggingOver ? "bg-blue-50 rounded-lg" : ""}`}
          >
            {jobs.map((job, index) => (
              <Card
                key={job.id}
                job={job}
                index={index}
                onNotesSave={onNotesSave}
                onDelete={onDelete}   // 🗑 PASS DELETE CALLBACK
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
