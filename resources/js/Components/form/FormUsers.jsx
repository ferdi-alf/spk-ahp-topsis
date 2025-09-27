import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
    TextField,
    FormControl,
    OutlinedInput,
    InputAdornment,
    IconButton,
    Button,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import ModalLayout from "../ModalLayout";

export default function FormUsers({
    isOpen,
    onOpen,
    onClose,
    initialData,
    onSubmitCreate,
    onSubmitUpdate,
}) {
    const [showPassword, setShowPassword] = useState(false);

    const {
        handleSubmit,
        control,
        reset,
        formState: { isSubmitting },
    } = useForm({
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
    });

    useEffect(() => {
        if (initialData) {
            reset(initialData);
        } else {
            reset({
                name: "",
                email: "",
                password: "",
            });
        }
    }, [initialData, isOpen, reset]);

    const onSubmit = (data) => {
        console.log("Form data:", data);

        if (initialData && onSubmitUpdate) {
            onSubmitUpdate(data);
        } else if (onSubmitCreate) {
            onSubmitCreate(data);
        }
    };

    const handleClickShowPassword = () => setShowPassword((show) => !show);

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    const handleMouseUpPassword = (event) => {
        event.preventDefault();
    };

    return (
        <ModalLayout
            isOpen={isOpen}
            onOpen={onOpen}
            onClose={onClose}
            modalTitle={initialData ? "Edit User" : "Tambah User"}
            textButton="Tambah User"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Controller
                    name="name"
                    control={control}
                    rules={{ required: "Name wajib diisi" }}
                    render={({ field, fieldState }) => (
                        <TextField
                            {...field}
                            fullWidth
                            label="Name"
                            variant="outlined"
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                        />
                    )}
                />

                <Controller
                    name="email"
                    control={control}
                    rules={{
                        required: "Email wajib diisi",
                        pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Format email tidak valid",
                        },
                    }}
                    render={({ field, fieldState }) => (
                        <TextField
                            {...field}
                            fullWidth
                            label="Email"
                            type="email"
                            variant="outlined"
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                        />
                    )}
                />

                <Controller
                    name="password"
                    control={control}
                    rules={{
                        required: initialData ? false : "Password wajib diisi",
                        minLength: {
                            value: 6,
                            message: "Password minimal 6 karakter",
                        },
                    }}
                    render={({ field, fieldState }) => (
                        <FormControl
                            fullWidth
                            variant="outlined"
                            error={!!fieldState.error}
                        >
                            <TextField
                                {...field}
                                label={`Password${
                                    initialData
                                        ? " (kosongkan jika tidak ingin mengubah)"
                                        : ""
                                }`}
                                type={showPassword ? "text" : "password"}
                                variant="outlined"
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label={
                                                    showPassword
                                                        ? "hide the password"
                                                        : "display the password"
                                                }
                                                onClick={
                                                    handleClickShowPassword
                                                }
                                                onMouseDown={
                                                    handleMouseDownPassword
                                                }
                                                onMouseUp={
                                                    handleMouseUpPassword
                                                }
                                                edge="end"
                                            >
                                                {showPassword ? (
                                                    <VisibilityOff />
                                                ) : (
                                                    <Visibility />
                                                )}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
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
                        {isSubmitting ? "Menyimpan..." : "Submit"}
                    </Button>
                </div>
            </form>
        </ModalLayout>
    );
}
