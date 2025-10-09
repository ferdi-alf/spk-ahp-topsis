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
// Pages/Partials/TableHasil.jsx
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
        matrix_fraction: fractionMatrix,
        normalized_matrix: normalizedMatrix,
        weights,
        row_sums: rowSums,
        col_sums: colSums,
        normalized_row_sums: normalizedRowSums,
        eigenvalues,
        weighted_sums: weightedSums,
        consistency: consistencyResult,
        validation: matrixValidation,
        ranking,
    } = ahpResults.data;

    return (
        <div className="space-y-6">
            {matrixValidation && !matrixValidation.is_valid && (
                <Alert severity="warning">
                    <strong>⚠️ Peringatan Matriks:</strong>{" "}
                    {matrixValidation.message}
                    <br />
                    <Typography variant="caption">
                        Matriks telah diperbaiki secara otomatis untuk memenuhi
                        prinsip reciprocal symmetry.
                    </Typography>
                </Alert>
            )}

            {matrixValidation && matrixValidation.is_valid && (
                <Alert severity="success">
                    <strong>✓ Validasi Matriks:</strong>{" "}
                    {matrixValidation.message}
                </Alert>
            )}

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

            <Card variant="outlined">
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Matriks Perbandingan Berpasangan (Rasio)
                    </Typography>
                    <Typography
                        variant="body2"
                        color="textSecondary"
                        gutterBottom
                    >
                        Tabel ini menampilkan nilai perbandingan dalam format
                        rasio (1/3, 1/5, dll)
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
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {calculatedCriteria.map((criterion, i) => (
                                    <TableRow key={criterion.id}>
                                        <TableCell>
                                            <strong>{criterion.code}</strong>
                                        </TableCell>
                                        {fractionMatrix &&
                                            fractionMatrix[i] &&
                                            fractionMatrix[i].map(
                                                (value, j) => (
                                                    <TableCell
                                                        key={j}
                                                        align="center"
                                                        style={{
                                                            backgroundColor:
                                                                i === j
                                                                    ? "#f5f5f5"
                                                                    : "transparent",
                                                            fontWeight:
                                                                i === j
                                                                    ? "bold"
                                                                    : "normal",
                                                        }}
                                                    >
                                                        {value}
                                                    </TableCell>
                                                )
                                            )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            <Card variant="outlined">
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Matriks Perbandingan Berpasangan (Desimal)
                    </Typography>
                    <Typography
                        variant="body2"
                        color="textSecondary"
                        gutterBottom
                    >
                        Tabel ini menampilkan nilai perbandingan dalam format
                        desimal
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
                                        <strong>Jumlah Baris</strong>
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
                                                        {formatNumber(value, 2)}
                                                    </TableCell>
                                                )
                                            )}
                                        <TableCell align="center">
                                            <strong>
                                                {formatNumber(rowSums[i], 2)}
                                            </strong>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow
                                    style={{ backgroundColor: "#f9f9f9" }}
                                >
                                    <TableCell>
                                        <strong>Jumlah Kolom</strong>
                                    </TableCell>
                                    {colSums &&
                                        colSums.map((sum, j) => (
                                            <TableCell key={j} align="center">
                                                <strong>
                                                    {formatNumber(sum, 2)}
                                                </strong>
                                            </TableCell>
                                        ))}
                                    <TableCell></TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box
                        sx={{
                            mt: 2,
                            p: 2,
                            bgcolor: "#f5f5f5",
                            borderRadius: 1,
                        }}
                    >
                        <Typography
                            variant="subtitle2"
                            gutterBottom
                            sx={{ fontWeight: "bold" }}
                        >
                            📊 Detail Perhitungan:
                        </Typography>
                        <Typography variant="body2" component="div">
                            <strong>Jumlah Baris (Horizontal):</strong>
                            <ul style={{ marginTop: 4, marginBottom: 8 }}>
                                {calculatedCriteria.map((criterion, i) => (
                                    <li key={i}>
                                        {criterion.code}:{" "}
                                        {comparisonMatrix[i] &&
                                            comparisonMatrix[i]
                                                .map((v) => formatNumber(v, 2))
                                                .join(" + ")}{" "}
                                        ={" "}
                                        <strong>
                                            {formatNumber(rowSums[i], 2)}
                                        </strong>
                                    </li>
                                ))}
                            </ul>
                            <strong>Jumlah Kolom (Vertikal):</strong>
                            <ul style={{ marginTop: 4 }}>
                                {colSums &&
                                    colSums.map((sum, j) => (
                                        <li key={j}>
                                            {criteria[j].code}:{" "}
                                            {comparisonMatrix
                                                .map((row) =>
                                                    formatNumber(row[j], 2)
                                                )
                                                .join(" + ")}{" "}
                                            ={" "}
                                            <strong>
                                                {formatNumber(sum, 2)}
                                            </strong>
                                        </li>
                                    ))}
                            </ul>
                        </Typography>
                    </Box>
                </CardContent>
            </Card>

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
                                        <strong>Jumlah Baris</strong>
                                    </TableCell>
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
                                            <strong style={{ color: "#666" }}>
                                                {formatNumber(
                                                    normalizedRowSums[i],
                                                    4
                                                )}
                                            </strong>
                                        </TableCell>
                                        <TableCell align="center">
                                            <strong
                                                style={{ color: "#1976d2" }}
                                            >
                                                {formatNumber(weights[i], 4)}
                                            </strong>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow
                                    style={{ backgroundColor: "#f9f9f9" }}
                                >
                                    <TableCell>
                                        <strong>Jumlah Kolom</strong>
                                    </TableCell>
                                    {colSums &&
                                        colSums.map((_, j) => {
                                            const colSum =
                                                normalizedMatrix.reduce(
                                                    (sum, row) => sum + row[j],
                                                    0
                                                );
                                            return (
                                                <TableCell
                                                    key={j}
                                                    align="center"
                                                >
                                                    <strong>
                                                        {formatNumber(
                                                            colSum,
                                                            4
                                                        )}
                                                    </strong>
                                                </TableCell>
                                            );
                                        })}
                                    <TableCell align="center">
                                        <strong>
                                            {formatNumber(
                                                normalizedRowSums.reduce(
                                                    (a, b) => a + b,
                                                    0
                                                ),
                                                4
                                            )}
                                        </strong>
                                    </TableCell>
                                    <TableCell align="center">
                                        <strong style={{ color: "#1976d2" }}>
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

                    {/* Detail Perhitungan Normalisasi */}
                    <Box
                        sx={{
                            mt: 2,
                            p: 2,
                            bgcolor: "#f5f5f5",
                            borderRadius: 1,
                        }}
                    >
                        <Typography
                            variant="subtitle2"
                            gutterBottom
                            sx={{ fontWeight: "bold" }}
                        >
                            📐 Detail Perhitungan Normalisasi:
                        </Typography>
                        <Typography variant="body2" component="div">
                            <strong>Rumus:</strong> Nilai Normalisasi = Nilai
                            Matriks ÷ Jumlah Kolom
                            <br />
                            <br />
                            <strong>
                                Contoh untuk baris pertama (
                                {calculatedCriteria[0]?.code}):
                            </strong>
                            <ul style={{ marginTop: 4, marginBottom: 8 }}>
                                {comparisonMatrix[0] &&
                                    comparisonMatrix[0].map((val, j) => (
                                        <li key={j}>
                                            Kolom {criteria[j].code}:{" "}
                                            {formatNumber(val, 2)} ÷{" "}
                                            {formatNumber(colSums[j], 4)} ={" "}
                                            <strong>
                                                {formatNumber(
                                                    normalizedMatrix[0][j],
                                                    4
                                                )}
                                            </strong>
                                        </li>
                                    ))}
                            </ul>
                            <strong>Priority Vector (Bobot):</strong>
                            <ul style={{ marginTop: 4 }}>
                                {calculatedCriteria.map((criterion, i) => (
                                    <li key={i}>
                                        {criterion.code}: (
                                        {normalizedMatrix[i]
                                            .map((v) => formatNumber(v, 4))
                                            .join(" + ")}
                                        ) ÷ {calculatedCriteria.length} ={" "}
                                        <strong>
                                            {formatNumber(weights[i], 4)}
                                        </strong>
                                    </li>
                                ))}
                            </ul>
                        </Typography>
                    </Box>
                </CardContent>
            </Card>

            <Card variant="outlined">
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Vektor Prioritas dan Eigenvalue
                    </Typography>
                    <Typography
                        variant="body2"
                        color="textSecondary"
                        gutterBottom
                    >
                        Tabel ringkasan bobot kriteria dan nilai eigenvalue
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell align="center">
                                        <strong>Kriteria</strong>
                                    </TableCell>
                                    <TableCell align="center">
                                        <strong>P. Vector</strong>
                                    </TableCell>
                                    <TableCell align="center">
                                        <strong>Bobot (%)</strong>
                                    </TableCell>
                                    <TableCell align="center">
                                        <strong>Weighted Sum</strong>
                                    </TableCell>
                                    <TableCell align="center">
                                        <strong>Eigenvalue</strong>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {calculatedCriteria.map((criterion, i) => (
                                    <TableRow key={criterion.id}>
                                        <TableCell align="center">
                                            <strong>{criterion.code}</strong>
                                        </TableCell>
                                        <TableCell align="center">
                                            {formatNumber(weights[i], 3)}
                                        </TableCell>
                                        <TableCell align="center">
                                            <strong
                                                style={{ color: "#1976d2" }}
                                            >
                                                {formatNumber(
                                                    weights[i] * 100,
                                                    2
                                                )}
                                                %
                                            </strong>
                                        </TableCell>
                                        <TableCell align="center">
                                            {weightedSums &&
                                                formatNumber(
                                                    weightedSums[i],
                                                    4
                                                )}
                                        </TableCell>
                                        <TableCell align="center">
                                            {eigenvalues &&
                                                formatNumber(eigenvalues[i], 4)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow
                                    style={{ backgroundColor: "#f9f9f9" }}
                                >
                                    <TableCell align="center">
                                        <strong>Total / Rata-rata</strong>
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
                                    <TableCell align="center">
                                        <strong style={{ color: "#1976d2" }}>
                                            {formatNumber(
                                                weights.reduce(
                                                    (a, b) => a + b,
                                                    0
                                                ) * 100,
                                                2
                                            )}
                                            %
                                        </strong>
                                    </TableCell>
                                    <TableCell align="center">
                                        <strong>-</strong>
                                    </TableCell>
                                    <TableCell align="center">
                                        <strong style={{ color: "#ff9800" }}>
                                            λmax ={" "}
                                            {formatNumber(
                                                consistencyResult.lambdaMax,
                                                4
                                            )}
                                        </strong>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Detail Perhitungan Eigenvalue */}
                    <Box
                        sx={{
                            mt: 2,
                            p: 2,
                            bgcolor: "#f5f5f5",
                            borderRadius: 1,
                        }}
                    >
                        <Typography
                            variant="subtitle2"
                            gutterBottom
                            sx={{ fontWeight: "bold" }}
                        >
                            🔢 Detail Perhitungan Eigenvalue:
                        </Typography>
                        <Typography variant="body2" component="div">
                            <strong>Step 1 - Weighted Sum Vector:</strong>
                            <br />
                            Rumus: Weighted Sum = Σ (Nilai Matriks × Priority
                            Vector)
                            <ul style={{ marginTop: 4, marginBottom: 8 }}>
                                {calculatedCriteria.map((criterion, i) => (
                                    <li key={i}>
                                        {criterion.code}:{" "}
                                        {comparisonMatrix[i] &&
                                            comparisonMatrix[i]
                                                .map(
                                                    (val, j) =>
                                                        `(${formatNumber(
                                                            val,
                                                            2
                                                        )} × ${formatNumber(
                                                            weights[j],
                                                            4
                                                        )})`
                                                )
                                                .join(" + ")}
                                        <br />={" "}
                                        {comparisonMatrix[i] &&
                                            comparisonMatrix[i]
                                                .map((val, j) =>
                                                    formatNumber(
                                                        val * weights[j],
                                                        4
                                                    )
                                                )
                                                .join(" + ")}
                                        ={" "}
                                        <strong>
                                            {weightedSums &&
                                                formatNumber(
                                                    weightedSums[i],
                                                    4
                                                )}
                                        </strong>
                                    </li>
                                ))}
                            </ul>
                            <strong>Step 2 - Eigenvalue per Kriteria:</strong>
                            <br />
                            Rumus: Eigenvalue = Weighted Sum ÷ Priority Vector
                            <ul style={{ marginTop: 4, marginBottom: 8 }}>
                                {calculatedCriteria.map((criterion, i) => (
                                    <li key={i}>
                                        {criterion.code}:{" "}
                                        {weightedSums &&
                                            formatNumber(
                                                weightedSums[i],
                                                4
                                            )}{" "}
                                        ÷ {formatNumber(weights[i], 4)} ={" "}
                                        <strong>
                                            {eigenvalues &&
                                                formatNumber(eigenvalues[i], 4)}
                                        </strong>
                                    </li>
                                ))}
                            </ul>
                            <strong>Step 3 - Lambda Max (λmax):</strong>
                            <br />
                            λmax = (
                            {eigenvalues &&
                                eigenvalues
                                    .map((v) => formatNumber(v, 4))
                                    .join(" + ")}
                            ) ÷ {calculatedCriteria.length}
                            <br />
                            λmax ={" "}
                            {eigenvalues &&
                                formatNumber(
                                    eigenvalues.reduce((a, b) => a + b, 0),
                                    4
                                )}{" "}
                            ÷ {calculatedCriteria.length} ={" "}
                            <strong style={{ color: "#ff9800" }}>
                                {formatNumber(consistencyResult.lambdaMax, 4)}
                            </strong>
                        </Typography>
                    </Box>
                </CardContent>
            </Card>

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
                                            <strong className="text-blue-500">
                                                {formatNumber(
                                                    criterion.weight_percentage,
                                                    1
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
                                Lambda Maksimum (λmax)
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

            <Card variant="outlined">
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        📋 Detail Perhitungan Konsistensi
                    </Typography>
                    <Box sx={{ p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                        <Typography variant="body2" component="div">
                            <strong>1. Consistency Index (CI):</strong>
                            <br />
                            Rumus: CI = (λmax - n) / (n - 1)
                            <br />
                            CI = ({formatNumber(
                                consistencyResult.lambdaMax,
                                4
                            )}{" "}
                            - {calculatedCriteria.length}) / (
                            {calculatedCriteria.length} - 1)
                            <br />
                            CI ={" "}
                            {formatNumber(
                                consistencyResult.lambdaMax -
                                    calculatedCriteria.length,
                                4
                            )}{" "}
                            / {calculatedCriteria.length - 1}
                            <br />
                            CI ={" "}
                            <strong style={{ color: "#ff9800" }}>
                                {formatNumber(consistencyResult.ci, 4)}
                            </strong>
                            <br />
                            <br />
                            <strong>2. Random Index (RI):</strong>
                            <br />
                            Untuk n = {calculatedCriteria.length}, RI ={" "}
                            <strong>
                                {formatNumber(consistencyResult.ri, 2)}
                            </strong>
                            <br />
                            <Typography variant="caption" color="textSecondary">
                                (Nilai RI standar berdasarkan tabel Saaty)
                            </Typography>
                            <br />
                            <br />
                            <strong>3. Consistency Ratio (CR):</strong>
                            <br />
                            Rumus: CR = CI / RI
                            <br />
                            CR = {formatNumber(consistencyResult.ci, 4)} /{" "}
                            {formatNumber(consistencyResult.ri, 2)}
                            <br />
                            CR ={" "}
                            <strong
                                style={{
                                    color: consistencyResult.isConsistent
                                        ? "#4caf50"
                                        : "#f44336",
                                }}
                            >
                                {formatNumber(consistencyResult.cr, 4)} atau{" "}
                                {formatNumber(consistencyResult.cr * 100, 2)}%
                            </strong>
                            <br />
                            <br />
                            <strong>4. Kesimpulan:</strong>
                            <br />
                            {consistencyResult.isConsistent ? (
                                <span style={{ color: "#4caf50" }}>
                                    ✓ Matriks KONSISTEN (CR ={" "}
                                    {formatNumber(
                                        consistencyResult.cr * 100,
                                        2
                                    )}
                                    % ≤ 10%)
                                    <br />
                                    Hasil perhitungan dapat diterima dan
                                    digunakan untuk pengambilan keputusan.
                                </span>
                            ) : (
                                <span style={{ color: "#f44336" }}>
                                    ✗ Matriks TIDAK KONSISTEN (CR ={" "}
                                    {formatNumber(
                                        consistencyResult.cr * 100,
                                        2
                                    )}
                                    % {">"} 10%)
                                    <br />
                                    Perlu dilakukan revisi pada nilai
                                    perbandingan berpasangan.
                                </span>
                            )}
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </div>
    );
}
