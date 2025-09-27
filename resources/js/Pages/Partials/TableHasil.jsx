// Pages/Partials/TableHasil.jsx
import React from "react";
import useSWR from "swr";
import {
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Alert,
    Grid,
    Chip,
    Box,
} from "@mui/material";
import Loading from "@/Components/Loading";
import { formatNumber } from "@/utils/ahpHelpers";

export default function TableHasil() {
    const {
        data: criteria,
        error: criteriaError,
        isLoading: criteriaLoading,
    } = useSWR("/kriteria?json=true", async () => {
        const res = await fetch("/kriteria?json=true");
        if (!res.ok) throw new Error("Gagal memuat data kriteria");
        return res.json();
    });

    const {
        data: ahpResults,
        error: ahpError,
        isLoading: ahpLoading,
    } = useSWR("/ahp-results", async () => {
        const res = await fetch("/ahp-results");
        if (!res.ok) throw new Error("Gagal memuat hasil perhitungan AHP");
        return res.json();
    });

    if (criteriaLoading || ahpLoading) {
        return <Loading />;
    }

    if (criteriaError || ahpError) {
        return (
            <Alert severity="error">
                Error: {criteriaError?.message || ahpError?.message}
            </Alert>
        );
    }

    if (!ahpResults || !ahpResults.success) {
        return (
            <Alert severity="warning">
                {ahpResults?.message ||
                    "Belum ada data perhitungan AHP yang valid"}
            </Alert>
        );
    }

    const {
        criteria: calculatedCriteria,
        matrix: comparisonMatrix,
        normalized_matrix: normalizedMatrix,
        weights,
        row_sums: rowSums,
        consistency: consistencyResult,
        ranking,
    } = ahpResults.data;

    return (
        <div className="space-y-6">
            {/* Status Konsistensi */}
            <Card variant="outlined">
                <CardContent>
                    <div className="flex items-center justify-between">
                        <Typography variant="h6">Status Konsistensi</Typography>
                        <Chip
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
                        />
                    </div>
                    <Typography
                        variant="body2"
                        color="textSecondary"
                        className="mt-2"
                    >
                        Consistency Ratio:{" "}
                        {formatNumber(consistencyResult.cr * 100, 2)}%
                        {consistencyResult.isConsistent
                            ? " (≤ 10% - Dapat diterima)"
                            : " (> 10% - Perlu diperbaiki)"}
                    </Typography>
                </CardContent>
            </Card>

            {/* Matriks Perbandingan Berpasangan */}
            <Card variant="outlined">
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Matriks Perbandingan Berpasangan
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>
                                        <strong>Kriteria</strong>
                                    </TableCell>
                                    {criteria.map((criterion) => (
                                        <TableCell
                                            key={criterion.id}
                                            align="center"
                                        >
                                            <strong>{criterion.code}</strong>
                                        </TableCell>
                                    ))}
                                    <TableCell align="center">
                                        <strong>Jumlah</strong>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {calculatedCriteria.map((criterion, i) => (
                                    <TableRow key={criterion.id}>
                                        <TableCell>
                                            <strong>{criterion.code}</strong>
                                        </TableCell>
                                        {comparisonMatrix[i] &&
                                            comparisonMatrix[i].map(
                                                (value, j) => (
                                                    <TableCell
                                                        key={j}
                                                        align="center"
                                                    >
                                                        {formatNumber(value, 3)}
                                                    </TableCell>
                                                )
                                            )}
                                        <TableCell align="center">
                                            <strong>
                                                {formatNumber(rowSums[i], 3)}
                                            </strong>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Matriks Nilai Kriteria (Normalisasi) */}
            <Card variant="outlined">
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Matriks Nilai Kriteria (Normalisasi)
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>
                                        <strong>Kriteria</strong>
                                    </TableCell>
                                    {criteria.map((criterion) => (
                                        <TableCell
                                            key={criterion.id}
                                            align="center"
                                        >
                                            <strong>{criterion.code}</strong>
                                        </TableCell>
                                    ))}
                                    <TableCell align="center">
                                        <strong>Priority Vector</strong>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {calculatedCriteria.map((criterion, i) => (
                                    <TableRow key={criterion.id}>
                                        <TableCell>
                                            <strong>{criterion.code}</strong>
                                        </TableCell>
                                        {normalizedMatrix[i] &&
                                            normalizedMatrix[i].map(
                                                (value, j) => (
                                                    <TableCell
                                                        key={j}
                                                        align="center"
                                                    >
                                                        {formatNumber(value, 4)}
                                                    </TableCell>
                                                )
                                            )}
                                        <TableCell align="center">
                                            <strong
                                                style={{ color: "#1976d2" }}
                                            >
                                                {formatNumber(weights[i], 4)}
                                            </strong>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow>
                                    <TableCell
                                        colSpan={calculatedCriteria.length + 1}
                                        align="center"
                                    >
                                        <strong>Total</strong>
                                    </TableCell>
                                    <TableCell align="center">
                                        <strong>
                                            {formatNumber(
                                                weights.reduce(
                                                    (a, b) => a + b,
                                                    0
                                                ),
                                                4
                                            )}
                                        </strong>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Ranking Kriteria */}
            <Card variant="outlined">
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Ranking Kriteria
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell align="center">
                                        <strong>Rank</strong>
                                    </TableCell>
                                    <TableCell>
                                        <strong>Kode</strong>
                                    </TableCell>
                                    <TableCell>
                                        <strong>Nama Kriteria</strong>
                                    </TableCell>
                                    <TableCell align="center">
                                        <strong>Bobot</strong>
                                    </TableCell>
                                    <TableCell align="center">
                                        <strong>Persentase</strong>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {ranking.map((criterion) => (
                                    <TableRow key={criterion.id}>
                                        <TableCell align="center">
                                            <Chip
                                                label={criterion.rank}
                                                size="small"
                                                color={
                                                    criterion.rank === 1
                                                        ? "primary"
                                                        : "default"
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <strong>{criterion.code}</strong>
                                        </TableCell>
                                        <TableCell>{criterion.name}</TableCell>
                                        <TableCell align="center">
                                            {formatNumber(criterion.weight, 4)}
                                        </TableCell>
                                        <TableCell align="center">
                                            <strong>
                                                {formatNumber(
                                                    criterion.weight_percentage,
                                                    2
                                                )}
                                                %
                                            </strong>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Statistik Perhitungan */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                    <Card variant="outlined">
                        <CardContent className="text-center">
                            <Typography variant="h4" color="primary">
                                {calculatedCriteria.length}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Jumlah Kriteria (n)
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card variant="outlined">
                        <CardContent className="text-center">
                            <Typography variant="h4" color="secondary">
                                {formatNumber(consistencyResult.lambdaMax, 4)}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Lambda Maksimum (λ max)
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card variant="outlined">
                        <CardContent className="text-center">
                            <Typography
                                variant="h4"
                                style={{ color: "#ff9800" }}
                            >
                                {formatNumber(consistencyResult.ci, 4)}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Consistency Index (CI)
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card variant="outlined">
                        <CardContent className="text-center">
                            <Typography
                                variant="h4"
                                style={{
                                    color: consistencyResult.isConsistent
                                        ? "#4caf50"
                                        : "#f44336",
                                }}
                            >
                                {formatNumber(consistencyResult.cr * 100, 2)}%
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Consistency Ratio (CR)
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </div>
    );
}
