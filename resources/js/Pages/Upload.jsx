import { useState, useEffect } from "react";
import { Head, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import ReusableCollapsibleTable from "@/Components/Table";
import FormUpload from "@/Components/form/FormUpload";
import DeleteButton from "@/Components/DeleteButton";
import ViewButton from "@/Components/ViewButton";
import DrawerResult from "@/Components/DrawerResult";
import {
    Description,
    Upload as UploadIcon,
    Download,
    Info,
    CheckCircle,
    Warning,
} from "@mui/icons-material";
import {
    Button,
    Alert,
    AlertTitle,
    Card,
    CardContent,
    Typography,
    Box,
    Chip,
} from "@mui/material";
import { toast } from "react-fox-toast";
import useSWR, { mutate } from "swr";
import Loading from "@/Components/Loading";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function UploadIndex() {
    const { auth } = usePage().props;
    const [openModal, setOpenModal] = useState(false);
    const [openDrawer, setOpenDrawer] = useState(false);
    const [selectedUpload, setSelectedUpload] = useState(null);
    const [calculationResults, setCalculationResults] = useState(null);

    const {
        data: uploads,
        error,
        isLoading,
    } = useSWR("/uploads?json=true", async () => {
        const res = await fetch("/uploads?json=true", {
            headers: {
                "X-Requested-With": "XMLHttpRequest",
            },
        });
        if (!res.ok) throw new Error("Gagal memuat data uploads");
        return res.json();
    });

    const {
        data: criteria,
        error: criteriaError,
        isLoading: criteriaLoading,
    } = useSWR("/kriteria?json=true", async () => {
        const res = await fetch("/kriteria?json=true", {
            headers: {
                "X-Requested-With": "XMLHttpRequest",
            },
        });
        if (!res.ok) throw new Error("Gagal memuat data kriteria");
        return res.json();
    });

    const headers = ["file_name", "alternatives_count", "created_at"];

    const handleCreate = async (formData) => {
        try {
            const res = await fetch("/uploads", {
                method: "POST",
                headers: {
                    "X-CSRF-TOKEN":
                        document.querySelector('meta[name="csrf-token"]')
                            ?.content || "",
                },
                credentials: "same-origin",
                body: formData,
            });

            const json = await res.json();

            if (!res.ok)
                throw new Error(json.message || "Gagal mengupload file");

            toast.success(
                json.message || "File berhasil diupload dan diproses"
            );
            mutate("/uploads?json=true");
            handleCloseModal();
        } catch (err) {
            console.error(err);
            toast.error(
                `Gagal: ${err instanceof Error ? err.message : String(err)}`
            );
        }
    };

    const handleView = async (upload) => {
        setSelectedUpload(upload);

        try {
            // Fetch calculation results
            const res = await fetch(`/uploads/${upload.id}/calculate`, {
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    "X-CSRF-TOKEN":
                        document.querySelector('meta[name="csrf-token"]')
                            ?.content || "",
                },
            });

            const results = await res.json();

            if (!res.ok) {
                throw new Error(
                    results.message || "Gagal memuat hasil perhitungan"
                );
            }

            setCalculationResults(results);
            setOpenDrawer(true);
        } catch (err) {
            console.error(err);
            toast.error(
                `Gagal memuat hasil: ${
                    err instanceof Error ? err.message : String(err)
                }`
            );
        }
    };

    const handleDownload = async (uploadId) => {
        try {
            const res = await fetch(`/uploads/${uploadId}/export`, {
                method: "GET",
                headers: {
                    "X-CSRF-TOKEN":
                        document.querySelector('meta[name="csrf-token"]')
                            ?.content || "",
                },
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Gagal mengunduh file");
            }

            // Create blob and download
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            a.download = `ranking_result_${uploadId}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success("File berhasil diunduh");
        } catch (err) {
            console.error(err);
            toast.error(
                `Gagal mengunduh: ${
                    err instanceof Error ? err.message : String(err)
                }`
            );
        }
    };

    const handleDownloadTemplate = () => {
        if (!criteria || criteria.length === 0) {
            toast.error("Data kriteria kosong");
            return;
        }

        const cols = criteria.length;
        const firstRow = [
            "Alternatif",
            "Kriteria",
            ...Array(cols - 1).fill(""),
        ];
        const secondRow = ["", ...criteria.map((c) => c.code)];
        const thirdRow = [
            "Contoh Karyawan 1",
            ...criteria.map(() => Math.floor(Math.random() * 100)),
        ];
        const fourthRow = [
            "Contoh Karyawan 2",
            ...criteria.map(() => Math.floor(Math.random() * 100)),
        ];

        const wsData = [firstRow, secondRow, thirdRow, fourthRow];
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        ws["!merges"] = [
            { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
            { s: { r: 0, c: 1 }, e: { r: 0, c: cols } },
        ];

        const setCellStyle = (cellRef) => {
            if (!ws[cellRef]) ws[cellRef] = { t: "s", v: "" };
            ws[cellRef].s = {
                font: { bold: true },
                alignment: { horizontal: "center", vertical: "center" },
                fill: { fgColor: { rgb: "E3F2FD" } },
            };
        };

        setCellStyle("A1");
        setCellStyle("B1");

        for (let i = 0; i < cols; i++) {
            const colLetter = XLSX.utils.encode_col(i + 1);
            setCellStyle(colLetter + "2");
        }

        ws["!cols"] = [{ wch: 25 }, ...Array(cols).fill({ wch: 15 })];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
        saveAs(
            new Blob([wbout], { type: "application/octet-stream" }),
            "template_ranking_karyawan.xlsx"
        );

        toast.success("Template berhasil diunduh");
    };

    const handleCloseModal = () => {
        setOpenModal(false);
    };

    const handleCloseDrawer = () => {
        setOpenDrawer(false);
        setSelectedUpload(null);
        setCalculationResults(null);
    };

    const handleDeleteSuccess = () => {
        mutate("/uploads?json=true");
    };

    const actionButtons = (row) => ({
        view: <ViewButton onClick={() => handleView(row)} />,
        delete: (
            <DeleteButton
                id={row.id}
                name={row.file_name}
                url={`/uploads/${row.id}`}
                onSuccess={handleDeleteSuccess}
            />
        ),
    });

    const columnMapper = {
        file_name: (row, index) => (
            <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                    <Description
                        className="text-green-600"
                        sx={{ fontSize: 32 }}
                    />
                </div>
                <div>
                    <span className="font-medium text-gray-900">
                        {row.filename}
                    </span>
                    <div className="text-sm text-gray-500">Excel File</div>
                </div>
            </div>
        ),
        alternatives_count: (row, index) => (
            <div className="flex items-center gap-2">
                <Chip
                    label={`${row.alternatives_count || 0} Karyawan`}
                    size="small"
                    color="primary"
                    variant="outlined"
                />
            </div>
        ),
        created_at: (row, index) => (
            <div className="text-gray-600">
                <div className="font-medium">
                    {new Date(row.created_at).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                    })}
                </div>
                <div className="text-sm">
                    {new Date(row.created_at).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </div>
            </div>
        ),
    };

    if (isLoading || criteriaLoading) {
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
            <Head title="Upload Data Ranking" />
            <div className="">
                <div className="grid grid-cols-1 mb-5 md:grid-cols-2 gap-6">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-start space-x-4">
                                <Info className="text-blue-500 mt-1" />
                                <div>
                                    <Typography
                                        variant="h6"
                                        className="font-semibold mb-2"
                                    >
                                        Cara Upload Data
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        className="text-gray-600 space-y-2"
                                    >
                                        <div>
                                            1. Download template Excel terlebih
                                            dahulu
                                        </div>
                                        <div>
                                            2. Isi data karyawan sesuai format
                                            template
                                        </div>
                                        <div>
                                            3. Upload file yang sudah diisi
                                        </div>
                                        <div>
                                            4. Sistem akan otomatis menghitung
                                            ranking
                                        </div>
                                    </Typography>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-start space-x-4">
                                <CheckCircle className="text-green-500 mt-1" />
                                <div>
                                    <Typography
                                        variant="h6"
                                        className="font-semibold mb-2"
                                    >
                                        Status Sistem
                                    </Typography>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">
                                                Kriteria:
                                            </span>
                                            <Chip
                                                label={`${
                                                    criteria?.length || 0
                                                } Kriteria`}
                                                size="small"
                                                color={
                                                    criteria?.length > 0
                                                        ? "success"
                                                        : "error"
                                                }
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">
                                                Data Upload:
                                            </span>
                                            <Chip
                                                label={`${
                                                    uploads?.length || 0
                                                } File`}
                                                size="small"
                                                color="info"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {(!criteria || criteria.length === 0) && (
                    <Alert severity="warning" className="mb-6">
                        <AlertTitle>Perhatian!</AlertTitle>
                        Anda belum memiliki data kriteria. Silakan buat kriteria
                        terlebih dahulu dan lakukan perbandingan AHP sebelum
                        mengupload data karyawan.
                    </Alert>
                )}

                <FormUpload
                    isOpen={openModal}
                    onOpen={() => setOpenModal(true)}
                    onClose={handleCloseModal}
                    onSubmitCreate={handleCreate}
                />

                <DrawerResult
                    open={openDrawer}
                    onClose={handleCloseDrawer}
                    uploadData={selectedUpload}
                    calculationResults={calculationResults}
                    onDownload={handleDownload}
                />

                <div className="bg-white mt-5 rounded-lg shadow-sm p-6">
                    <div className="flex md:flex-row flex-col justify-between items-center mb-6">
                        <div>
                            <h1 className="md:text-2xl sm:text-xl text-base font-bold text-gray-900 flex items-center gap-2">
                                <UploadIcon className="text-blue-600" />
                                Upload Data Ranking Karyawan
                            </h1>
                            <p className="text-gray-600 text-xs mt-1">
                                Upload dan kelola file Excel untuk analisis
                                ranking karyawan menggunakan AHP-TOPSIS
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outlined"
                                startIcon={<Download />}
                                onClick={handleDownloadTemplate}
                                disabled={!criteria || criteria.length === 0}
                            >
                                Download Template
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<UploadIcon />}
                                onClick={() => setOpenModal(true)}
                                disabled={!criteria || criteria.length === 0}
                                sx={{
                                    background:
                                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                    "&:hover": {
                                        background:
                                            "linear-gradient(135deg, #5a6fd8 0%, #6b4190 100%)",
                                    },
                                }}
                            >
                                Upload Data
                            </Button>
                        </div>
                    </div>

                    {uploads && uploads.length === 0 ? (
                        <div className="text-center py-12">
                            <UploadIcon
                                className="mx-auto text-gray-400 mb-4"
                                sx={{ fontSize: 64 }}
                            />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Belum ada file yang diupload
                            </h3>
                            <p className="text-gray-500 mb-6">
                                Upload file Excel pertama Anda untuk mulai
                                analisis ranking karyawan
                            </p>
                        </div>
                    ) : (
                        <ReusableCollapsibleTable
                            headers={headers}
                            data={uploads || []}
                            showActionButton={actionButtons}
                            columnMapper={columnMapper}
                            rowsPerPageDefault={10}
                            cellAlignment="left"
                            headerAlignment="left"
                        />
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
