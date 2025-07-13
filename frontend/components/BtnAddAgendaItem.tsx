import {FaPlus} from "react-icons/fa6";

interface ButtonAddAgendaItemProps {
  onAdd: () => void;
}

const BtnAddAgendaItem: React.FC<ButtonAddAgendaItemProps> = ({ onAdd }) => {

  return (
    <li
      className="relative flex items-center min-h-[2rem] mr-3"
    >
        <button
          className={`w-full flex items-center justify-between px-1.5 py-1.5 cursor-pointer rounded-lg border border-gray-300 bg-stone-400/60 hover:scale-105 border-dashed transition-all duration-200 focus:outline-none`}
          aria-label="Add an agenda item"
          title="Add an agenda item"
          onClick={() => {
            
            // Adding a new agenda item via API call
            console.log("Adding new agenda item...");
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/agenda`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                meeting_id: 'a8f52a02-5aa8-45ec-9549-79ad2a194fa4', // test meeting ID
                agenda_item: 'New agenda item',
                duration_seconds: 200
              })
            })
              .then(res => res.json())
              .then(data => {
                console.log("Agenda item created:", data);
                onAdd(); // still dispatch locally if needed to trigger UI change
              })
              .catch(err => console.error("Error creating agenda item:", err));
          }}
          type="button"
        >
          {/* Simulated faded lines */}
          <div className="flex-1 flex flex-col gap-1 text-left">
            <div className="h-2 w-3/4 bg-gray-300 rounded opacity-60 mb-1"></div>
            <div className="h-2 w-1/2 bg-gray-300 rounded opacity-40"></div>
          </div>
          <FaPlus className="text-gray-400 mr-2"/>
        </button>
    </li>
  );
};

export default BtnAddAgendaItem;