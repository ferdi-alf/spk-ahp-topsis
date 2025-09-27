import { useState } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import Swal from "sweetalert2";
import { toast } from "react-fox-toast";
import Loading from "./Loading";

export default function DeleteButton({ id, name, onSuccess, url }) {
    const [loading, setLoading] = useState(false);

    const onDelete = async () => {
        const result = await Swal.fire({
            title: `Hapus ${name}?`,
            text: `Data ${name} akan dihapus permanen!`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Ya, hapus!",
            cancelButtonText: "Batal",
        });

        if (!result.isConfirmed) return;

        try {
            setLoading(true);
            const res = await fetch(url, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN":
                        document.querySelector('meta[name="csrf-token"]')
                            ?.content || "",
                },
                credentials: "same-origin",
                body: JSON.stringify({ id }),
            });

            const json = await res.json();

            if (!res.ok) throw new Error(json.message || "Gagal menghapus");

            toast.success(json.message || `Data ${name} berhasil dihapus`);
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error(err);
            toast.error(
                `Gagal: ${err instanceof Error ? err.message : String(err)}`
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {loading && <Loading />}
            <button
                type="button"
                onClick={onDelete}
                disabled={loading}
                className={`p-3 focus:ring-4 focus:outline-none focus:ring-red-300 text-lg rounded-lg ${
                    loading
                        ? "bg-gray-200 text-gray-400"
                        : "bg-red-100 text-red-500"
                }`}
            >
                <DeleteIcon />
            </button>
        </>
    );
}
