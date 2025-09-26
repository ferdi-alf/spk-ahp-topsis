import React, { useState, useRef, useEffect, FormEventHandler } from "react";
import { Head, useForm } from "@inertiajs/react";

import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import { ToastContainer } from "react-fox-toast";
import { FormHelperText } from "@mui/material";
import Loading from "@/Components/Loading";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

export default function Welcome() {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, processing, reset, post, errors } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route("login"), {
            onFinish: () => reset("password"),
        });
    };

    const handleClickShowPassword = () => setShowPassword((show) => !show);

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    const handleMouseUpPassword = (event) => {
        event.preventDefault();
    };

    return (
        <>
            <Head title="Sistem Pengambilan Keputusan" />
            <ToastContainer position="top-right" />
            {processing && <Loading />}

            <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex justify-center items-center p-4">
                <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
                        <div className="p-8 lg:p-12 flex flex-col justify-center">
                            <div className="w-full max-w-md mx-auto">
                                <h1 className="lg:block hidden font-serif text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-fuchsia-500 via-purple-400 to-blue-500 mb-2">
                                    SPK AHP TOPSIS
                                </h1>
                                <p className="text-gray-600 mb-8">
                                    Login ke Akunmu
                                </p>

                                <form className="space-y-6" onSubmit={submit}>
                                    <div className="inputGroup inputGroup1">
                                        <TextField
                                            id="email"
                                            name="email"
                                            type="text"
                                            autoComplete="email"
                                            error={!!errors.email}
                                            helperText={errors.email}
                                            value={data.email}
                                            onChange={(e) =>
                                                setData("email", e.target.value)
                                            }
                                            placeholder="Masukan email"
                                            label="Email"
                                            variant="outlined"
                                            className="rounded-lg w-full"
                                            sx={{
                                                "& .MuiOutlinedInput-root": {
                                                    borderRadius: "12px",
                                                    "&:focus-within": {
                                                        outline: "none",
                                                    },
                                                },
                                                "& .MuiOutlinedInput-input": {
                                                    "&:focus": {
                                                        outline: "none",
                                                    },
                                                },
                                            }}
                                        />
                                    </div>

                                    <div className="inputGroup inputGroup2">
                                        <FormControl
                                            fullWidth
                                            error={!!errors.password}
                                            variant="outlined"
                                            sx={{
                                                "& .MuiOutlinedInput-root": {
                                                    borderRadius: "12px",
                                                    "& input": {
                                                        outline: "none",
                                                    },
                                                    "& fieldset": {
                                                        outline: "none",
                                                    },
                                                },
                                                "& .MuiInputLabel-root": {
                                                    borderRadius: "12px",
                                                },
                                            }}
                                        >
                                            <InputLabel htmlFor="outlined-adornment-password">
                                                Password
                                            </InputLabel>
                                            <OutlinedInput
                                                autoComplete="password"
                                                value={data.password}
                                                onChange={(e) =>
                                                    setData(
                                                        "password",
                                                        e.target.value
                                                    )
                                                }
                                                id="outlined-adornment-password"
                                                type={
                                                    showPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                endAdornment={
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
                                                }
                                                label="Password"
                                            />
                                            <FormHelperText>
                                                {errors.password}
                                            </FormHelperText>
                                        </FormControl>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <input
                                                id="remember-me"
                                                name="remember-me"
                                                type="checkbox"
                                                checked={data.remember}
                                                onChange={(e) =>
                                                    setData(
                                                        "remember",
                                                        e.target.checked
                                                    )
                                                }
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label
                                                htmlFor="remember-me"
                                                className="ml-2 block text-sm text-gray-900"
                                            >
                                                Remember me
                                            </label>
                                        </div>
                                    </div>

                                    <div className="inputGroup inputGroup3">
                                        <button
                                            disabled={processing}
                                            type="submit"
                                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-fuchsia-500 via-purple-400 to-blue-500 hover:from-fuchsia-500 hover:via-purple-400 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
                                        >
                                            Sign in
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br md:flex hidden from-fuchsia-500 via-purple-400 to-blue-500 p-8 lg:p-12 items-center justify-center">
                            <div className="flex items-center justify-center">
                                <img
                                    src="/images/login.png"
                                    alt="Login Illustration"
                                    className="h-96 w-96 object-contain"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
