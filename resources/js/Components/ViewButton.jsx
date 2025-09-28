import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";

export default function ViewButton({ onClick, disabled = false }) {
    return (
        <div className="px-4 py-2">
            <IconButton
                onClick={onClick}
                disabled={disabled}
                sx={{
                    color: "#2563eb",
                    backgroundColor: "#eff6ff",
                    "&:hover": {
                        backgroundColor: "#dbeafe",
                        color: "#1d4ed8",
                    },
                    "&:disabled": {
                        backgroundColor: "#f3f4f6",
                        color: "#9ca3af",
                    },
                }}
                size="small"
            >
                <VisibilityIcon fontSize="small" />
            </IconButton>
        </div>
    );
}
