import React, { useState, useEffect } from "react";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Tabs,
    Tab,
    Box,
    Button,
    Typography,
    Card,
    CardContent,
    Grid,
} from "@mui/material";
import { Download, Close } from "@mui/icons-material";
import { Bar, Doughnut } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from "chart.js";
import { toast } from "react-fox-toast";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

function TabPanel({ children, value, index, ...other }) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

export default function DrawerResult({
    open,
    onClose,
    uploadData,
    calculationResults,
    onDownload,
}) {
    const [tabValue, setTabValue] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleDownload = async () => {
        if (!uploadData?.id) return;

        setIsDownloading(true);
        try {
            await onDownload(uploadData.id);
        } catch (error) {
            toast.error("Gagal mengunduh file");
        } finally {
            setIsDownloading(false);
        }
    };

    const getChartData = () => {
        if (!calculationResults?.data?.results) return null;

        const results = calculationResults.data.results
            .sort((a, b) => a.topsis_ahp_rank - b.topsis_ahp_rank)
            .slice(0, 10); // Top 10

        const labels = results.map(
            (r) => r.alternative?.name || `Alt ${r.alternative_id}`
        );
        const ahpScores = results.map((r) => r.ahp_score);
        const topsisScores = results.map((r) => r.topsis_score);
        const combinedScores = results.map((r) => r.topsis_ahp_score);

        return {
            bar: {
                labels,
                datasets: [
                    {
                        label: "AHP Score",
                        data: ahpScores,
                        backgroundColor: "rgba(54, 162, 235, 0.6)",
                        borderColor: "rgba(54, 162, 235, 1)",
                        borderWidth: 1,
                    },
                    {
                        label: "TOPSIS Score",
                        data: topsisScores,
                        backgroundColor: "rgba(255, 99, 132, 0.6)",
                        borderColor: "rgba(255, 99, 132, 1)",
                        borderWidth: 1,
                    },
                    {
                        label: "Combined Score",
                        data: combinedScores,
                        backgroundColor: "rgba(75, 192, 192, 0.6)",
                        borderColor: "rgba(75, 192, 192, 1)",
                        borderWidth: 1,
                    },
                ],
            },
            doughnut: {
                labels: labels.slice(0, 5),
                datasets: [
                    {
                        data: combinedScores.slice(0, 5),
                        backgroundColor: [
                            "rgba(255, 99, 132, 0.6)",
                            "rgba(54, 162, 235, 0.6)",
                            "rgba(255, 205, 86, 0.6)",
                            "rgba(75, 192, 192, 0.6)",
                            "rgba(153, 102, 255, 0.6)",
                        ],
                        borderWidth: 2,
                    },
                ],
            },
        };
    };

    const chartData = getChartData();

    const formatNumber = (num) => {
        return typeof num === "number" ? num.toFixed(4) : "0.0000";
    };

    const renderRankingTab = () => {
        if (!calculationResults?.data?.results) return null;

        const results = calculationResults.data.results.sort(
            (a, b) => a.topsis_ahp_rank - b.topsis_ahp_rank
        );

        return (
            <div className="space-y-6">
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Total Karyawan
                                </Typography>
                                <Typography variant="h4">
                                    {results.length}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Kriteria
                                </Typography>
                                <Typography variant="h4">
                                    {calculationResults.data.criteria?.length ||
                                        0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Skor Tertinggi
                                </Typography>
                                <Typography variant="h4">
                                    {formatNumber(
                                        Math.max(
                                            ...results.map(
                                                (r) => r.topsis_ahp_score
                                            )
                                        )
                                    )}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Upload Date
                                </Typography>
                                <Typography variant="h6">
                                    {uploadData?.created_at
                                        ? new Date(
                                              uploadData.created_at
                                          ).toLocaleDateString("id-ID")
                                        : "-"}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {chartData && (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Perbandingan Skor (Top 10)
                                    </Typography>
                                    <Box sx={{ height: 400 }}>
                                        <Bar
                                            data={chartData.bar}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: { position: "top" },
                                                    title: {
                                                        display: true,
                                                        text: "Ranking Karyawan Berdasarkan Metode AHP-TOPSIS",
                                                    },
                                                },
                                                scales: {
                                                    y: { beginAtZero: true },
                                                },
                                            }}
                                        />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Top 5 Karyawan
                                    </Typography>
                                    <Box sx={{ height: 300 }}>
                                        <Doughnut
                                            data={chartData.doughnut}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: {
                                                        position: "bottom",
                                                    },
                                                },
                                            }}
                                        />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}

                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Ranking Final Karyawan
                        </Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>
                                            <strong>Rank</strong>
                                        </TableCell>
                                        <TableCell>
                                            <strong>Nama Karyawan</strong>
                                        </TableCell>
                                        <TableCell align="center">
                                            <strong>AHP Score</strong>
                                        </TableCell>
                                        <TableCell align="center">
                                            <strong>TOPSIS Score</strong>
                                        </TableCell>
                                        <TableCell align="center">
                                            <strong>Combined Score</strong>
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {results.map((result) => (
                                        <TableRow key={result.alternative_id}>
                                            <TableCell>
                                                <div
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                                                        result.topsis_ahp_rank ===
                                                        1
                                                            ? "bg-yellow-500"
                                                            : result.topsis_ahp_rank ===
                                                              2
                                                            ? "bg-gray-400"
                                                            : result.topsis_ahp_rank ===
                                                              3
                                                            ? "bg-amber-600"
                                                            : "bg-blue-500"
                                                    }`}
                                                >
                                                    {result.topsis_ahp_rank}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Typography
                                                    variant="body2"
                                                    fontWeight="medium"
                                                >
                                                    {result.alternative?.name ||
                                                        `Alternative ${result.alternative_id}`}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                {formatNumber(result.ahp_score)}
                                            </TableCell>
                                            <TableCell align="center">
                                                {formatNumber(
                                                    result.topsis_score
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Typography
                                                    variant="body2"
                                                    fontWeight="bold"
                                                    color="primary"
                                                >
                                                    {formatNumber(
                                                        result.topsis_ahp_score
                                                    )}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            </div>
        );
    };

    const renderCalculationTab = () => {
        if (!calculationResults?.data) return null;

        const {
            decision_matrix,
            normalized_matrix,
            weighted_matrix,
            ideal_positive,
            ideal_negative,
            distances,
        } = calculationResults.data;
        const alternatives = calculationResults.data.alternatives || [];
        const criteria = calculationResults.data.criteria || [];

        return (
            <div className="space-y-6">
                {/* Decision Matrix (X) */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            1. Matrix Keputusan (X)
                        </Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>
                                            <strong>Alternatif</strong>
                                        </TableCell>
                                        {criteria.map((crit) => (
                                            <TableCell
                                                key={crit.id}
                                                align="center"
                                            >
                                                <strong>{crit.code}</strong>
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {alternatives.map((alt) => (
                                        <TableRow key={alt.id}>
                                            <TableCell>{alt.name}</TableCell>
                                            {criteria.map((crit) => (
                                                <TableCell
                                                    key={crit.id}
                                                    align="center"
                                                >
                                                    {decision_matrix[alt.id]?.[
                                                        crit.id
                                                    ] || 0}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>

                {/* Normalized Matrix (R) */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            2. Matrix Ternormalisasi (R)
                        </Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>
                                            <strong>Alternatif</strong>
                                        </TableCell>
                                        {criteria.map((crit) => (
                                            <TableCell
                                                key={crit.id}
                                                align="center"
                                            >
                                                <strong>{crit.code}</strong>
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {alternatives.map((alt) => (
                                        <TableRow key={alt.id}>
                                            <TableCell>{alt.name}</TableCell>
                                            {criteria.map((crit) => (
                                                <TableCell
                                                    key={crit.id}
                                                    align="center"
                                                >
                                                    {formatNumber(
                                                        normalized_matrix[
                                                            alt.id
                                                        ]?.[crit.id]
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>

                {/* Weighted Matrix (Y) */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            3. Matrix Berbobot (Y)
                        </Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>
                                            <strong>Alternatif</strong>
                                        </TableCell>
                                        {criteria.map((crit) => (
                                            <TableCell
                                                key={crit.id}
                                                align="center"
                                            >
                                                <strong>
                                                    {crit.code} (
                                                    {formatNumber(crit.weight)})
                                                </strong>
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {alternatives.map((alt) => (
                                        <TableRow key={alt.id}>
                                            <TableCell>{alt.name}</TableCell>
                                            {criteria.map((crit) => (
                                                <TableCell
                                                    key={crit.id}
                                                    align="center"
                                                >
                                                    {formatNumber(
                                                        weighted_matrix[
                                                            alt.id
                                                        ]?.[crit.id]
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>

                {/* Ideal Solutions */}
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    4. Solusi Ideal Positif (A+)
                                </Typography>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>
                                                    <strong>Kriteria</strong>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <strong>Nilai</strong>
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {criteria.map((crit) => (
                                                <TableRow key={crit.id}>
                                                    <TableCell>
                                                        {crit.code}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {formatNumber(
                                                            ideal_positive[
                                                                crit.id
                                                            ]
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    5. Solusi Ideal Negatif (A-)
                                </Typography>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>
                                                    <strong>Kriteria</strong>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <strong>Nilai</strong>
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {criteria.map((crit) => (
                                                <TableRow key={crit.id}>
                                                    <TableCell>
                                                        {crit.code}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {formatNumber(
                                                            ideal_negative[
                                                                crit.id
                                                            ]
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Distance and Final Scores */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            6. Jarak dan Kedekatan Relatif
                        </Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>
                                            <strong>Alternatif</strong>
                                        </TableCell>
                                        <TableCell align="center">
                                            <strong>S+ (Jarak ke A+)</strong>
                                        </TableCell>
                                        <TableCell align="center">
                                            <strong>S- (Jarak ke A-)</strong>
                                        </TableCell>
                                        <TableCell align="center">
                                            <strong>
                                                V (Kedekatan Relatif)
                                            </strong>
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {alternatives.map((alt) => (
                                        <TableRow key={alt.id}>
                                            <TableCell>{alt.name}</TableCell>
                                            <TableCell align="center">
                                                {formatNumber(
                                                    distances[alt.id]?.positive
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                {formatNumber(
                                                    distances[alt.id]?.negative
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Typography
                                                    variant="body2"
                                                    fontWeight="bold"
                                                    color="primary"
                                                >
                                                    {formatNumber(
                                                        calculationResults.data
                                                            .topsis_scores[
                                                            alt.id
                                                        ]
                                                    )}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            </div>
        );
    };

    return (
        <Drawer open={open} onOpenChange={onClose}>
            <DrawerContent className="w-full h-3/4">
                <DrawerHeader>
                    <DrawerTitle className="flex items-center justify-between">
                        <div>
                            <Typography variant="h5">
                                Hasil Perhitungan: {uploadData?.file_name}
                            </Typography>
                            <DrawerDescription>
                                Analisis ranking karyawan menggunakan metode AHP
                                dan TOPSIS
                            </DrawerDescription>
                        </div>
                        <Button
                            variant="contained"
                            startIcon={<Download />}
                            onClick={handleDownload}
                            disabled={isDownloading}
                            sx={{
                                background:
                                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                "&:hover": {
                                    background:
                                        "linear-gradient(135deg, #5a6fd8 0%, #6b4190 100%)",
                                },
                            }}
                        >
                            {isDownloading ? "Mengunduh..." : "Download Excel"}
                        </Button>
                    </DrawerTitle>
                </DrawerHeader>

                <div className="px-6">
                    <Tabs
                        variant="fullWidth"
                        value={tabValue}
                        onChange={handleTabChange}
                    >
                        <Tab label="Ranking Karyawan" />
                        <Tab label="Detail Perhitungan" />
                    </Tabs>

                    <TabPanel value={tabValue} index={0}>
                        {renderRankingTab()}
                    </TabPanel>

                    <TabPanel value={tabValue} index={1}>
                        {renderCalculationTab()}
                    </TabPanel>
                </div>

                <DrawerFooter>
                    <DrawerClose asChild>
                        <Button variant="outlined" startIcon={<Close />}>
                            Tutup
                        </Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
