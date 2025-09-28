import React, { useState, useRef } from "react";
import { Button, Typography, Box, LinearProgress } from "@mui/material";
import { CloudUpload, Description, Clear } from "@mui/icons-material";
import ModalLayout from "../ModalLayout";
import { toast } from "react-fox-toast";

export default function FormUpload({
    isOpen,
    onOpen,
    onClose,
    onSubmitCreate,
}) {
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsDragging(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleFileSelect = (selectedFile) => {
        if (!selectedFile) return;

        // Validasi file Excel
        const allowedTypes = [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
            ".xlsx",
            ".xls",
        ];

        const fileExtension = selectedFile.name.split(".").pop().toLowerCase();
        const isValidType =
            allowedTypes.includes(selectedFile.type) ||
            ["xlsx", "xls"].includes(fileExtension);

        if (!isValidType) {
            toast.error("File harus berformat Excel (.xlsx atau .xls)");
            return;
        }

        // Validasi ukuran file (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (selectedFile.size > maxSize) {
            toast.error("File tidak boleh lebih dari 10MB");
            return;
        }

        setFile(selectedFile);
    };

    const handleFileInputChange = (e) => {
        const selectedFile = e.target.files[0];
        handleFileSelect(selectedFile);
    };

    const handleRemoveFile = () => {
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!file) {
            toast.error("Pilih file Excel terlebih dahulu");
            return;
        }

        setIsUploading(true);

        const formData = new FormData();
        formData.append("file", file);

        try {
            await onSubmitCreate(formData);
            setFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (error) {
            console.error("Upload error:", error);
        } finally {
            setIsUploading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <ModalLayout
            isOpen={isOpen}
            onOpen={onOpen}
            onClose={onClose}
            modalTitle="Upload File Excel"
            textButton="Upload Data"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="text-sm text-gray-600 mb-4">
                    <p>Upload file Excel dengan format:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Column 1: Nama Karyawan (Alternatif)</li>
                        <li>Column 2+: Kode Kriteria sesuai sistem</li>
                        <li>Format file: .xlsx atau .xls</li>
                        <li>Ukuran maksimal: 10MB</li>
                    </ul>
                </div>

                <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        isDragging
                            ? "border-blue-500 bg-blue-50"
                            : file
                            ? "border-green-500 bg-green-50"
                            : "border-gray-300 bg-gray-50"
                    }`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    {file ? (
                        <div className="space-y-4">
                            <Description className="text-green-500 text-5xl mx-auto" />
                            <div>
                                <Typography
                                    variant="h6"
                                    className="font-medium text-green-700"
                                >
                                    {file.name}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    className="text-gray-600"
                                >
                                    {formatFileSize(file.size)}
                                </Typography>
                            </div>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<Clear />}
                                onClick={handleRemoveFile}
                                className="text-red-600 border-red-300 hover:border-red-500"
                            >
                                Hapus File
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <CloudUpload className="text-gray-400 text-5xl mx-auto" />
                            <div>
                                <Typography
                                    variant="h6"
                                    className="font-medium text-gray-700"
                                >
                                    {isDragging
                                        ? "Lepaskan file di sini"
                                        : "Drag & drop file Excel"}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    className="text-gray-500"
                                >
                                    atau klik untuk memilih file
                                </Typography>
                            </div>
                            <Button
                                variant="outlined"
                                component="label"
                                startIcon={<CloudUpload />}
                                className="mt-4"
                            >
                                Pilih File
                                <input
                                    type="file"
                                    hidden
                                    ref={fileInputRef}
                                    accept=".xlsx,.xls"
                                    onChange={handleFileInputChange}
                                />
                            </Button>
                        </div>
                    )}
                </div>

                {isUploading && (
                    <Box className="w-full">
                        <Typography
                            variant="body2"
                            className="text-center mb-2"
                        >
                            Mengupload dan memproses file...
                        </Typography>
                        <LinearProgress />
                    </Box>
                )}

                <div className="flex justify-end space-x-2 pt-4">
                    <Button
                        type="button"
                        onClick={onClose}
                        variant="outlined"
                        disabled={isUploading}
                    >
                        Batal
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={!file || isUploading}
                        sx={{
                            background:
                                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            "&:hover": {
                                background:
                                    "linear-gradient(135deg, #5a6fd8 0%, #6b4190 100%)",
                            },
                        }}
                    >
                        {isUploading ? "Mengupload..." : "Upload"}
                    </Button>
                </div>
            </form>
        </ModalLayout>
    );
}
