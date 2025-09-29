import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";

export default function ViewButton({ onClick, disabled = false }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="px-4 py-2 bg-green-100 rounded-xl text-green-500"
        >
            <VisibilityIcon fontSize="small" />
        </button>
    );
}
