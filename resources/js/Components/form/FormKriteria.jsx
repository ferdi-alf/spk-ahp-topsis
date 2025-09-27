// Components/form/FormKriteria.jsx
import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
} from "@mui/material";
import ModalLayout from "../ModalLayout";

export default function FormKriteria({
    isOpen,
    onOpen,
    onClose,
    initialData,
    onSubmitCreate,
    onSubmitUpdate,
}) {
    const {
        handleSubmit,
        control,
        reset,
        formState: { isSubmitting, errors },
    } = useForm({
        defaultValues: {
            code: "",
            name: "",
            type: "benefit", // default benefit
        },
    });

    useEffect(() => {
        if (initialData) {
            reset(initialData);
        } else {
            reset({
                code: "",
                name: "",
                type: "benefit",
            });
        }
    }, [initialData, isOpen, reset]);

    const onSubmit = (data) => {
        console.log("Form kriteria data:", data);

        if (initialData && onSubmitUpdate) {
            onSubmitUpdate(data);
        } else if (onSubmitCreate) {
            onSubmitCreate(data);
        }
    };

    return (
        <ModalLayout
            isOpen={isOpen}
            onOpen={onOpen}
            onClose={onClose}
            modalTitle={initialData ? "Edit Kriteria" : "Tambah Kriteria"}
            textButton="Tambah Kriteria"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Controller
                    name="code"
                    control={control}
                    rules={{
                        required: "Kode kriteria wajib diisi",
                        pattern: {
                            value: /^[A-Z]\d{1,2}$/,
                            message:
                                "Format kode: C1, C2, C3, dst (huruf C diikuti angka)",
                        },
                    }}
                    render={({ field, fieldState }) => (
                        <TextField
                            {...field}
                            fullWidth
                            name="code"
                            label="Kode Kriteria"
                            placeholder="C1, C2, C3, dst"
                            variant="outlined"
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                        />
                    )}
                />

                <Controller
                    name="name"
                    control={control}
                    rules={{ required: "Nama kriteria wajib diisi" }}
                    render={({ field, fieldState }) => (
                        <TextField
                            {...field}
                            fullWidth
                            label="Nama Kriteria"
                            variant="outlined"
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                        />
                    )}
                />

                <Controller
                    name="type"
                    control={control}
                    rules={{ required: "Jenis kriteria wajib dipilih" }}
                    render={({ field, fieldState }) => (
                        <FormControl
                            fullWidth
                            error={!!fieldState.error}
                            variant="outlined"
                        >
                            <InputLabel>Jenis Kriteria</InputLabel>
                            <Select {...field} label="Jenis Kriteria">
                                <MenuItem value="benefit">
                                    Benefit (semakin besar semakin baik)
                                </MenuItem>
                                <MenuItem value="cost">
                                    Cost (semakin kecil semakin baik)
                                </MenuItem>
                            </Select>
                            {fieldState.error && (
                                <div className="text-red-500 text-sm mt-1 ml-3">
                                    {fieldState.error.message}
                                </div>
                            )}
                        </FormControl>
                    )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                    <Button
                        type="button"
                        onClick={onClose}
                        variant="outlined"
                        disabled={isSubmitting}
                    >
                        Batal
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting}
                        sx={{
                            background:
                                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            "&:hover": {
                                background:
                                    "linear-gradient(135deg, #5a6fd8 0%, #6b4190 100%)",
                            },
                        }}
                    >
                        {isSubmitting ? "Menyimpan..." : "Simpan"}
                    </Button>
                </div>
            </form>
        </ModalLayout>
    );
}
