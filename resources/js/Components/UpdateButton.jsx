import EditIcon from "@mui/icons-material/Edit";

export default function UpdateButton({ onClick }) {
    return (
        <button
            onClick={onClick}
            className="p-3 text-lg bg-blue-100 text-blue-500 rounded-lg cursor-pointer focus:ring-4 focus:outline-none focus:ring-blue-300"
            title="Edit"
        >
            <EditIcon />
        </button>
    );
}
