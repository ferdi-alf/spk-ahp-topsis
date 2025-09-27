import { useState } from "react";
import { Head, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import ReusableCollapsibleTable from "@/Components/Table";
import FormUsers from "@/Components/form/FormUsers";
import DeleteButton from "@/Components/DeleteButton";
import UpdateButton from "@/Components/UpdateButton";
import { Avatar } from "@mui/material";
import { toast } from "react-fox-toast";
import useSWR, { mutate } from "swr";
import Loading from "@/Components/Loading";

export default function User() {
    const { auth } = usePage().props;
    const [openModal, setOpenModal] = useState(false);
    const [modalMode, setModalMode] = useState("create");
    const [editData, setEditData] = useState(null);

    const {
        data: users,
        error,
        isLoading,
    } = useSWR("/users?json=true", async () => {
        const res = await fetch("/users?json=true", {
            headers: {
                "X-Requested-With": "XMLHttpRequest",
            },
        });
        if (!res.ok) throw new Error("Gagal memuat data users");
        return res.json();
    });

    const headers = ["name", "email", "created_at"];

    const handleCreate = async (data) => {
        try {
            const res = await fetch("/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN":
                        document.querySelector('meta[name="csrf-token"]')
                            ?.content || "",
                },
                credentials: "same-origin",
                body: JSON.stringify(data),
            });

            const json = await res.json();

            if (!res.ok)
                throw new Error(json.message || "Gagal menyimpan data");

            toast.success(json.message || "User berhasil ditambahkan");
            mutate("/users?json=true");
            handleCloseModal();
        } catch (err) {
            console.error(err);
            toast.error(
                `Gagal: ${err instanceof Error ? err.message : String(err)}`
            );
        }
    };

    const handleUpdate = async (data) => {
        if (!editData?.id) return;

        try {
            const res = await fetch(`/users/${editData.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN":
                        document.querySelector('meta[name="csrf-token"]')
                            ?.content || "",
                },
                credentials: "same-origin",
                body: JSON.stringify(data),
            });

            const json = await res.json();

            if (!res.ok)
                throw new Error(json.message || "Gagal memperbarui data");

            toast.success(json.message || "User berhasil diperbarui");
            mutate("/users?json=true");
            handleCloseModal();
        } catch (err) {
            console.error(err);
            toast.error(
                `Gagal: ${err instanceof Error ? err.message : String(err)}`
            );
        }
    };

    const handleEdit = (user) => {
        setEditData(user);
        setModalMode("edit");
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setEditData(null);
        setModalMode("create");
    };

    const handleDeleteSuccess = () => {
        mutate("/users?json=true");
    };

    const actionButtons = (row) => ({
        edit: <UpdateButton onClick={() => handleEdit(row)} />,
        delete: (
            <DeleteButton
                id={row.id}
                name={row.name || row.email}
                url={`/users/${row.id}`}
                onSuccess={handleDeleteSuccess}
            />
        ),
    });

    const columnMapper = {
        name: (row, index) => (
            <div className="flex items-center gap-3">
                <Avatar
                    src={
                        row.avatar ? `/images/avatar/${row.avatar}` : undefined
                    }
                    alt={row.name || row.email}
                    sx={{ width: 32, height: 32 }}
                >
                    {!row.avatar &&
                        (row.name || row.email)?.charAt(0).toUpperCase()}
                </Avatar>
                <span className="font-medium">{row.name || "-"}</span>
            </div>
        ),
        email: (row, index) => (
            <span className="text-gray-700">{row.email}</span>
        ),
        created_at: (row, index) => (
            <span className="text-gray-600">
                {new Date(row.created_at).toLocaleDateString("id-ID", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                })}
            </span>
        ),
    };

    if (isLoading) {
        return (
            <AuthenticatedLayout>
                <Loading />
            </AuthenticatedLayout>
        );
    }

    if (error) {
        return (
            <AuthenticatedLayout>
                <div className="text-center text-red-600 py-8">
                    Error: {error.message}
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title="Users" />
            <div className="">
                <FormUsers
                    isOpen={openModal}
                    onOpen={() => setOpenModal(true)}
                    onClose={handleCloseModal}
                    initialData={
                        modalMode === "edit" && editData ? editData : undefined
                    }
                    onSubmitCreate={handleCreate}
                    onSubmitUpdate={handleUpdate}
                />
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Manajemen Users
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Kelola data pengguna sistem
                            </p>
                        </div>
                    </div>

                    <ReusableCollapsibleTable
                        headers={headers}
                        data={users || []}
                        showActionButton={actionButtons}
                        columnMapper={columnMapper}
                        rowsPerPageDefault={10}
                        cellAlignment="left"
                        headerAlignment="left"
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
