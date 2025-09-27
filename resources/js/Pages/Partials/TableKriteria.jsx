// Pages/Partials/TableKriteria.jsx
import React, { useState } from "react";
import { toast } from "react-fox-toast";
import useSWR, { mutate } from "swr";
import ReusableCollapsibleTable from "@/Components/Table";

import DeleteButton from "@/Components/DeleteButton";
import UpdateButton from "@/Components/UpdateButton";
import Loading from "@/Components/Loading";
import { Chip, Alert } from "@mui/material";
import FormKriteria from "@/Components/form/FormKriteria";

export default function TableKriteria() {
    const [openModal, setOpenModal] = useState(false);
    const [modalMode, setModalMode] = useState("create");
    const [editData, setEditData] = useState(null);

    const {
        data: criteria,
        error,
        isLoading,
    } = useSWR("/kriteria?json=true", async () => {
        const res = await fetch("/kriteria?json=true", {
            headers: {
                "X-Requested-With": "XMLHttpRequest",
            },
        });
        if (!res.ok) throw new Error("Gagal memuat data kriteria");
        return res.json();
    });

    const headers = ["code", "name", "type", "weight"];

    const handleCreate = async (data) => {
        console.log("dataaa", data);
        try {
            const res = await fetch("/kriteria", {
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
                throw new Error(json.message || "Gagal menyimpan kriteria");

            toast.success(json.message || "Kriteria berhasil ditambahkan");
            mutate("/kriteria?json=true");
            mutate("/ahp-validation");
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
            const res = await fetch(`/kriteria/${editData.id}`, {
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
                throw new Error(json.message || "Gagal memperbarui kriteria");

            toast.success(json.message || "Kriteria berhasil diperbarui");
            mutate("/kriteria?json=true");
            mutate("/ahp-validation"); // refresh validasi AHP
            handleCloseModal();
        } catch (err) {
            console.error(err);
            toast.error(
                `Gagal: ${err instanceof Error ? err.message : String(err)}`
            );
        }
    };

    const handleEdit = (criterion) => {
        setEditData(criterion);
        setModalMode("edit");
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setEditData(null);
        setModalMode("create");
    };

    const handleDeleteSuccess = () => {
        mutate("/kriteria?json=true");
        mutate("/ahp-validation");
        mutate("/ahp-results");
    };

    const actionButtons = (row) => ({
        edit: <UpdateButton onClick={() => handleEdit(row)} />,
        delete: (
            <DeleteButton
                id={row.id}
                name={row.name || row.code}
                url={`/kriteria/${row.id}`}
                onSuccess={handleDeleteSuccess}
            />
        ),
    });

    const columnMapper = {
        code: (row) => (
            <span className="font-mono font-semibold text-blue-600">
                {row.code}
            </span>
        ),
        name: (row) => (
            <span className="font-medium text-gray-900">{row.name}</span>
        ),
        type: (row) => (
            <Chip
                label={row.type === "benefit" ? "Benefit" : "Cost"}
                color={row.type === "benefit" ? "success" : "warning"}
                size="small"
                variant="outlined"
            />
        ),
        weight: (row) => (
            <span className="text-gray-600">
                {row.weight
                    ? (row.weight * 100).toFixed(2) + "%"
                    : "Belum dihitung"}
            </span>
        ),
    };

    if (isLoading) {
        return <Loading />;
    }

    if (error) {
        return (
            <Alert severity="error" className="mb-4">
                Error: {error.message}
            </Alert>
        );
    }

    return (
        <div>
            <FormKriteria
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
                        <h2 className="text-xl font-bold text-gray-900">
                            Data Kriteria
                        </h2>
                        <p className="text-gray-600 mt-1">
                            Kelola kriteria untuk analisis AHP
                        </p>
                    </div>
                </div>

                {(!criteria || criteria.length < 2) && (
                    <Alert severity="info" className="mb-4">
                        Minimal 2 kriteria diperlukan untuk melakukan
                        perbandingan berpasangan.
                        {criteria &&
                            criteria.length === 1 &&
                            " Tambah 1 kriteria lagi."}
                        {(!criteria || criteria.length === 0) &&
                            " Tambah kriteria untuk memulai."}
                    </Alert>
                )}

                <ReusableCollapsibleTable
                    headers={headers}
                    data={criteria || []}
                    showActionButton={actionButtons}
                    columnMapper={columnMapper}
                    rowsPerPageDefault={10}
                    cellAlignment="left"
                    headerAlignment="left"
                />
            </div>
        </div>
    );
}
