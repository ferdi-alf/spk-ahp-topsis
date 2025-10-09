// Pages/Partials/TableSkala.jsx
import React, { useState, useEffect } from "react";
import { toast } from "react-fox-toast";
import useSWR, { mutate } from "swr";
import {
    Button,
    ButtonGroup,
    Card,
    CardContent,
    Typography,
    Alert,
    Chip,
    Box,
    IconButton,
} from "@mui/material";
import { KeyboardArrowLeft, KeyboardArrowRight } from "@mui/icons-material";
import Loading from "@/Components/Loading";
import { generateComparisonPairs, getScaleText } from "@/utils/ahpHelpers";

export default function TableSkala() {
    const [comparisons, setComparisons] = useState([]);
    const [consistencyResult, setConsistencyResult] = useState(null);

    const {
        data: criteria,
        error: criteriaError,
        isLoading: criteriaLoading,
    } = useSWR("/kriteria?json=true", async () => {
        const res = await fetch("/kriteria?json=true");
        if (!res.ok) throw new Error("Gagal memuat data kriteria");
        return res.json();
    });

    const { data: validation, error: validationError } = useSWR(
        "/ahp-validation",
        async () => {
            const res = await fetch("/ahp-validation");
            if (!res.ok) return { is_ready_for_calculation: false };
            return res.json();
        }
    );

    const { data: ahpResults, error: ahpError } = useSWR(
        "/ahp-results",
        async () => {
            const res = await fetch("/ahp-results");
            if (!res.ok) return null;
            return res.json();
        }
    );

    const {
        data: existingComparisons,
        error: comparisonError,
        isLoading: comparisonLoading,
    } = useSWR(
        "/kriteria-comparison?json=true",
        async () => {
            const res = await fetch("/kriteria-comparison?json=true", {
                cache: "no-cache", // 🔥 Tambahkan ini
                headers: {
                    "Cache-Control": "no-cache",
                    Pragma: "no-cache",
                },
            });
            if (!res.ok) return [];
            return res.json();
        },
        {
            revalidateOnFocus: true, // 🔥 Force revalidate
            dedupingInterval: 0, // 🔥 No deduping
        }
    );

    useEffect(() => {
        if (criteria && criteria.length >= 2) {
            const pairs = generateComparisonPairs(criteria);

            const updatedPairs = pairs.map((pair) => {
                const existing = existingComparisons?.find(
                    (comp) =>
                        (comp.criteria1_id === pair.criteria1.id &&
                            comp.criteria2_id === pair.criteria2.id) ||
                        (comp.criteria1_id === pair.criteria2.id &&
                            comp.criteria2_id === pair.criteria1.id)
                );

                if (existing) {
                    let finalValue = parseFloat(existing.value);

                    console.log("🔄 Processing comparison:", {
                        pair: `${pair.criteria1.name} vs ${pair.criteria2.name}`,
                        existing_value: existing.value,
                        existing_c1: existing.criteria1_id,
                        existing_c2: existing.criteria2_id,
                        pair_c1: pair.criteria1.id,
                        pair_c2: pair.criteria2.id,
                        need_inverse:
                            existing.criteria1_id !== pair.criteria1.id,
                        before_inverse: finalValue,
                    });

                    if (existing.criteria1_id !== pair.criteria1.id) {
                        const beforeInverse = finalValue;
                        finalValue = 1 / finalValue;

                        console.log("⚠️ INVERTING:", {
                            before: beforeInverse,
                            after: finalValue,
                            after_rounded: Math.round(finalValue * 1000) / 1000,
                        });

                        // Normalisasi ke skala AHP terdekat
                        const scales = [
                            1 / 9,
                            1 / 7,
                            1 / 5,
                            1 / 3,
                            1,
                            3,
                            5,
                            7,
                            9,
                        ];
                        const normalized = scales.reduce((prev, curr) =>
                            Math.abs(curr - finalValue) <
                            Math.abs(prev - finalValue)
                                ? curr
                                : prev
                        );

                        console.log("✅ NORMALIZED:", {
                            before_normalize: finalValue,
                            after_normalize: normalized,
                        });

                        finalValue = normalized;
                    }

                    const result = {
                        ...pair,
                        value: Math.round(finalValue * 1000) / 1000,
                        favoredCriteria: existing.favored_criteria,
                        id: existing.id,
                    };

                    console.log("✅ Final comparison state:", result);

                    return result;
                }
                return pair;
            });

            setComparisons(updatedPairs);

            if (ahpResults?.success && ahpResults.data.consistency) {
                setConsistencyResult({
                    cr: ahpResults.data.consistency.CR,
                    isConsistent: ahpResults.data.consistency.isConsistent,
                    ci: ahpResults.data.consistency.CI,
                    lambdaMax: ahpResults.data.consistency.lambdaMax,
                });
            }
        }
    }, [criteria, existingComparisons, ahpResults]);

    useEffect(() => {
        if (existingComparisons && existingComparisons.length > 0) {
            console.log("🔍 RAW API Response:", existingComparisons);

            existingComparisons.forEach((comp, idx) => {
                console.log(`Comparison #${idx}:`, {
                    id: comp.id,
                    value: comp.value,
                    type: typeof comp.value,
                    criteria1_id: comp.criteria1_id,
                    criteria2_id: comp.criteria2_id,

                    ...comp,
                });
            });
        }
    }, [existingComparisons]);

    const handleScaleChange = (index, newValue, direction) => {
        const updatedComparisons = [...comparisons];

        if (direction === "right") {
            updatedComparisons[index].value = Number(newValue.toFixed(3));
            updatedComparisons[index].favoredCriteria =
                updatedComparisons[index].criteria2.id;
        } else {
            updatedComparisons[index].value = Number((1 / newValue).toFixed(3));
            updatedComparisons[index].favoredCriteria =
                updatedComparisons[index].criteria1.id;
        }

        setComparisons(updatedComparisons);
        checkConsistencyRealtime(updatedComparisons);
    };

    const checkConsistencyRealtime = async (currentComparisons) => {
        if (!criteria || criteria.length < 2) return;

        try {
            const formattedComparisons = currentComparisons.map((comp) => ({
                criteria1_id: comp.criteria1.id,
                criteria2_id: comp.criteria2.id,
                value: comp.value,
            }));

            const res = await fetch("/ahp-check-consistency", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN":
                        document.querySelector('meta[name="csrf-token"]')
                            ?.content || "",
                },
                credentials: "same-origin",
                body: JSON.stringify({
                    comparisons: formattedComparisons,
                }),
            });

            if (res.ok) {
                const result = await res.json();
                setConsistencyResult(result);
            }
        } catch (error) {
            console.error("Error checking consistency:", error);
        }
    };

    const handleSaveComparisons = async () => {
        try {
            const res = await fetch("/kriteria-comparison", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN":
                        document.querySelector('meta[name="csrf-token"]')
                            ?.content || "",
                },
                credentials: "same-origin",
                body: JSON.stringify({
                    comparisons: comparisons.map((comp) => ({
                        criteria1_id: comp.criteria1.id,
                        criteria2_id: comp.criteria2.id,
                        value: comp.value,
                    })),
                }),
            });

            const json = await res.json();

            if (!res.ok)
                throw new Error(json.message || "Gagal menyimpan perbandingan");

            toast.success(json.message || "Perbandingan berhasil disimpan");
            mutate("/kriteria-comparison?json=true");
            mutate("/ahp-results");
            mutate("/ahp-validation");
        } catch (err) {
            console.error(err);
            toast.error(
                `Gagal: ${err instanceof Error ? err.message : String(err)}`
            );
        }
    };

    if (criteriaLoading) {
        return <Loading />;
    }

    if (criteriaError) {
        return <Alert severity="error">Error: {criteriaError.message}</Alert>;
    }

    if (!validation?.has_enough_criteria) {
        return (
            <Alert severity="warning">
                Minimal 2 kriteria diperlukan untuk melakukan perbandingan
                berpasangan.
                {criteria &&
                    criteria.length === 1 &&
                    " Tambah 1 kriteria lagi."}
                {(!criteria || criteria.length === 0) &&
                    " Tambah kriteria untuk memulai."}
            </Alert>
        );
    }

    const isScaleActive = (comparisonValue, targetScale, direction) => {
        // Round dulu ke 3 desimal
        const roundedValue = Math.round(comparisonValue * 1000) / 1000;

        const calculatedValue =
            direction === "left"
                ? Math.round((1 / targetScale) * 1000) / 1000
                : Math.round(targetScale * 1000) / 1000;

        // Gunakan tolerance yang lebih besar
        return Math.abs(roundedValue - calculatedValue) < 0.005;
    };

    return (
        <div className="space-y-6 relative">
            <div className="bg-white  rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Skala Perbandingan Kriteria
                        </h2>
                        <p className="text-gray-600 mt-1">
                            Bandingkan setiap pasangan kriteria (1-9 skala AHP)
                        </p>
                    </div>
                </div>

                {consistencyResult && consistencyResult.cr != null && (
                    <div
                        className="sticky top-4 z-50 mb-4"
                        style={{
                            position: "sticky",
                            top: "4rem",
                            zIndex: 1000,
                        }}
                    >
                        <Alert
                            severity={
                                consistencyResult.isConsistent
                                    ? "success"
                                    : "warning"
                            }
                            className="shadow-lg border-l-4"
                            sx={{
                                backgroundColor: consistencyResult.isConsistent
                                    ? "#f0f9ff"
                                    : "#fffbeb",
                                borderLeft: `4px solid ${
                                    consistencyResult.isConsistent
                                        ? "#10b981"
                                        : "#f59e0b"
                                }`,
                                "& .MuiAlert-message": {
                                    width: "100%",
                                },
                            }}
                        >
                            <div className="flex items-center justify-between w-full">
                                <span className="flex-1">
                                    Consistency Ratio:{" "}
                                    {(
                                        Number(consistencyResult.cr) * 100
                                    ).toFixed(2)}
                                    %
                                    {consistencyResult.isConsistent
                                        ? " - Konsisten ✓"
                                        : " - Tidak Konsisten (harus ≤ 10%)"}
                                </span>
                                <Chip
                                    className="ml-3 flex-shrink-0"
                                    label={
                                        consistencyResult.isConsistent
                                            ? "KONSISTEN"
                                            : "TIDAK KONSISTEN"
                                    }
                                    color={
                                        consistencyResult.isConsistent
                                            ? "success"
                                            : "error"
                                    }
                                    size="small"
                                    sx={{
                                        fontWeight: "bold",
                                        fontSize: "0.75rem",
                                    }}
                                />
                            </div>
                        </Alert>
                    </div>
                )}

                <div className="space-y-4">
                    {comparisons.map((comparison, index) => (
                        <Card key={index} variant="outlined">
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 text-center">
                                        <Typography
                                            variant="h6"
                                            className="text-blue-600"
                                        >
                                            {comparison.criteria1.name}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color="textSecondary"
                                        >
                                            ({comparison.criteria1.code})
                                        </Typography>
                                    </div>

                                    <div className="flex-1 flex items-center justify-center space-x-2">
                                        <ButtonGroup
                                            size="small"
                                            orientation="vertical"
                                        >
                                            {[9, 7, 5, 3].map((scale) => {
                                                // 🔥 PERBAIKAN: Hitung target dan current value dengan konsisten
                                                const targetValue =
                                                    Math.round(
                                                        (1 / scale) * 1000
                                                    ) / 1000;
                                                const currentValue =
                                                    Math.round(
                                                        comparison.value * 1000
                                                    ) / 1000;
                                                const isActive =
                                                    Math.abs(
                                                        currentValue -
                                                            targetValue
                                                    ) < 0.01; // Tolerance 0.01

                                                return (
                                                    <Button
                                                        key={`left-${scale}`}
                                                        variant={
                                                            isActive
                                                                ? "contained"
                                                                : "outlined"
                                                        }
                                                        onClick={() =>
                                                            handleScaleChange(
                                                                index,
                                                                scale,
                                                                "left"
                                                            )
                                                        }
                                                        sx={{
                                                            minWidth: "40px",
                                                            fontSize: "0.75rem",
                                                        }}
                                                    >
                                                        {scale}
                                                    </Button>
                                                );
                                            })}
                                        </ButtonGroup>
                                        <Button
                                            variant={
                                                Math.abs(
                                                    Math.round(
                                                        comparison.value * 1000
                                                    ) /
                                                        1000 -
                                                        1
                                                ) < 0.01 // 🔥 PERBAIKAN: Tolerance dari 0.005 ke 0.01
                                                    ? "contained"
                                                    : "outlined"
                                            }
                                            onClick={() => {
                                                const updated = [
                                                    ...comparisons,
                                                ];
                                                updated[index].value = 1;
                                                updated[index].favoredCriteria =
                                                    null;
                                                setComparisons(updated);
                                                checkConsistencyRealtime(
                                                    updated
                                                );
                                            }}
                                            sx={{
                                                minWidth: "50px",
                                                backgroundColor:
                                                    Math.abs(
                                                        Math.round(
                                                            comparison.value *
                                                                1000
                                                        ) /
                                                            1000 -
                                                            1
                                                    ) < 0.01 // 🔥 PERBAIKAN: Tolerance dari 0.005 ke 0.01
                                                        ? "#4caf50"
                                                        : undefined,
                                            }}
                                        >
                                            1
                                        </Button>

                                        <ButtonGroup
                                            size="small"
                                            orientation="vertical"
                                        >
                                            {[3, 5, 7, 9].map((scale) => {
                                                const targetValue =
                                                    Math.round(scale * 1000) /
                                                    1000;
                                                const currentValue =
                                                    Math.round(
                                                        comparison.value * 1000
                                                    ) / 1000;
                                                const isActive =
                                                    Math.abs(
                                                        currentValue -
                                                            targetValue
                                                    ) < 0.01;

                                                // Tambahkan log untuk button yang seharusnya aktif
                                                if (
                                                    scale === 5 &&
                                                    comparison.criteria1.id ===
                                                        1
                                                ) {
                                                    // Sesuaikan dengan test case
                                                    console.log(
                                                        "🔘 Button 5 check:",
                                                        {
                                                            scale,
                                                            targetValue,
                                                            currentValue,
                                                            difference:
                                                                Math.abs(
                                                                    currentValue -
                                                                        targetValue
                                                                ),
                                                            isActive,
                                                            comparison_value_raw:
                                                                comparison.value,
                                                        }
                                                    );
                                                }

                                                return (
                                                    <Button
                                                        key={`right-${scale}`}
                                                        variant={
                                                            isActive
                                                                ? "contained"
                                                                : "outlined"
                                                        }
                                                        onClick={() =>
                                                            handleScaleChange(
                                                                index,
                                                                scale,
                                                                "right"
                                                            )
                                                        }
                                                        sx={{
                                                            minWidth: "40px",
                                                            fontSize: "0.75rem",
                                                        }}
                                                    >
                                                        {scale}
                                                    </Button>
                                                );
                                            })}
                                        </ButtonGroup>
                                    </div>

                                    <div className="flex-1 text-center">
                                        <Typography
                                            variant="h6"
                                            className="text-green-600"
                                        >
                                            {comparison.criteria2.name}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color="textSecondary"
                                        >
                                            ({comparison.criteria2.code})
                                        </Typography>
                                    </div>
                                </div>

                                <div className="mt-3 text-center">
                                    <Typography
                                        variant="body2"
                                        color="textSecondary"
                                    >
                                        Nilai:{" "}
                                        {Number(comparison.value || 0).toFixed(
                                            3
                                        )}{" "}
                                        -{" "}
                                        {getScaleText(
                                            comparison.value > 1
                                                ? Math.round(comparison.value)
                                                : Math.round(
                                                      1 / comparison.value
                                                  )
                                        )}
                                        {comparison.value !== 1 && (
                                            <span className="ml-2 font-medium">
                                                (
                                                {comparison.value > 1
                                                    ? comparison.criteria2.name
                                                    : comparison.criteria1
                                                          .name}{" "}
                                                lebih penting)
                                            </span>
                                        )}
                                    </Typography>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="mt-6 flex justify-end">
                    <Button
                        variant="contained"
                        onClick={handleSaveComparisons}
                        disabled={!consistencyResult?.isConsistent}
                        sx={{
                            background: consistencyResult?.isConsistent
                                ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                                : undefined,
                            "&:hover": {
                                background: consistencyResult?.isConsistent
                                    ? "linear-gradient(135deg, #5a6fd8 0%, #6b4190 100%)"
                                    : undefined,
                            },
                        }}
                    >
                        {consistencyResult?.isConsistent
                            ? "Simpan Perbandingan"
                            : "Perbaiki Konsistensi Terlebih Dahulu"}
                    </Button>
                </div>
            </div>

            {/* Legend */}
            <Card variant="outlined">
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Panduan Skala Perbandingan AHP
                    </Typography>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>1 = Sama penting</div>
                        <div>3 = Sedikit lebih penting</div>
                        <div>5 = Lebih penting</div>
                        <div>7 = Jauh lebih penting</div>
                        <div>9 = Mutlak lebih penting</div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
