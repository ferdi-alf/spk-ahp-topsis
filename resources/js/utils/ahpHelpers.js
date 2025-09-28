// utils/ahpHelpers.js

/**
 * Membuat matriks perbandingan berpasangan dari data kriteria dan perbandingan
 */
export function createComparisonMatrix(criteria, comparisons) {
    const n = criteria.length;
    const matrix = Array(n)
        .fill()
        .map(() => Array(n).fill(1));

    // Isi diagonal dengan 1 (kriteria dibanding dengan dirinya sendiri)
    for (let i = 0; i < n; i++) {
        matrix[i][i] = 1;
    }

    // Isi matriks berdasarkan data perbandingan
    comparisons.forEach((comparison) => {
        const i = criteria.findIndex((c) => c.id === comparison.criteria1_id);
        const j = criteria.findIndex((c) => c.id === comparison.criteria2_id);

        if (i !== -1 && j !== -1) {
            matrix[i][j] = comparison.value;
            matrix[j][i] = 1 / comparison.value; // Reciprocal
        }
    });

    return matrix;
}

/**
 * Normalisasi matriks perbandingan
 */
export function normalizeMatrix(matrix) {
    const n = matrix.length;
    const normalizedMatrix = Array(n)
        .fill()
        .map(() => Array(n).fill(0));

    // Hitung jumlah setiap kolom
    const columnSums = Array(n).fill(0);
    for (let j = 0; j < n; j++) {
        for (let i = 0; i < n; i++) {
            columnSums[j] += matrix[i][j];
        }
    }

    // Normalisasi setiap elemen
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            normalizedMatrix[i][j] = matrix[i][j] / columnSums[j];
        }
    }

    return normalizedMatrix;
}

/**
 * Hitung bobot kriteria (priority vector)
 */
export function calculateWeights(normalizedMatrix) {
    const n = normalizedMatrix.length;
    const weights = Array(n).fill(0);

    // Rata-rata setiap baris
    for (let i = 0; i < n; i++) {
        let sum = 0;
        for (let j = 0; j < n; j++) {
            sum += normalizedMatrix[i][j];
        }
        weights[i] = sum / n;
    }

    return weights;
}

/**
 * Hitung lambda maksimum
 */
export function calculateLambdaMax(matrix, weights) {
    const n = matrix.length;
    let lambdaMax = 0;

    for (let i = 0; i < n; i++) {
        let sum = 0;
        for (let j = 0; j < n; j++) {
            sum += matrix[i][j] * weights[j];
        }
        lambdaMax += sum / weights[i];
    }

    return lambdaMax / n;
}

/**
 * Hitung Consistency Index (CI)
 */
export function calculateCI(lambdaMax, n) {
    return (lambdaMax - n) / (n - 1);
}

/**
 * Hitung Consistency Ratio (CR)
 */
export function calculateCR(ci, n) {
    // Random Index (RI) values
    const RI = {
        1: 0,
        2: 0,
        3: 0.58,
        4: 0.9,
        5: 1.12,
        6: 1.24,
        7: 1.32,
        8: 1.41,
        9: 1.45,
        10: 1.49,
    };

    if (n <= 2) return 0;
    return ci / (RI[n] || 1.49);
}

/**
 * Cek konsistensi matriks
 */
export function checkConsistency(matrix) {
    const n = matrix.length;
    const normalizedMatrix = normalizeMatrix(matrix);
    const weights = calculateWeights(normalizedMatrix);
    const lambdaMax = calculateLambdaMax(matrix, weights);
    const ci = calculateCI(lambdaMax, n);
    const cr = calculateCR(ci, n);

    return {
        weights,
        lambdaMax,
        ci,
        cr,
        isConsistent: cr <= 0.1,
        matrix,
        normalizedMatrix,
        n,
    };
}

/**
 * Generate skala perbandingan untuk UI
 */
export function generateComparisonPairs(criteria) {
    const pairs = [];

    for (let i = 0; i < criteria.length; i++) {
        for (let j = i + 1; j < criteria.length; j++) {
            pairs.push({
                criteria1: criteria[i],
                criteria2: criteria[j],
                value: 1, // default equal importance
            });
        }
    }

    return pairs;
}

/**
 * Konversi nilai skala ke text
 */
export function getScaleText(value) {
    const scaleTexts = {
        1: "Sama penting",
        3: "Sedikit lebih penting",
        5: "Lebih penting",
        7: "Jauh lebih penting",
        9: "Mutlak lebih penting",
    };

    return scaleTexts[value] || "Tidak diketahui";
}
/**
 * Format angka untuk tampilan
 */
export function formatNumber(number, decimals = 4) {
    return Number(number).toFixed(decimals);
}

/**
 * Hitung penjumlahan setiap baris matriks
 */
export function calculateRowSums(matrix) {
    return matrix.map((row) => row.reduce((sum, val) => sum + val, 0));
}

/**
 * Validasi data kriteria untuk AHP
 */
export function validateCriteriaForAHP(criteria) {
    if (!criteria || criteria.length < 2) {
        return {
            isValid: false,
            message: "Minimal 2 kriteria diperlukan untuk analisis AHP",
        };
    }

    if (criteria.length > 9) {
        return {
            isValid: false,
            message: "Maksimal 9 kriteria untuk analisis AHP",
        };
    }

    return {
        isValid: true,
        message: "Data kriteria valid untuk analisis AHP",
    };
}
