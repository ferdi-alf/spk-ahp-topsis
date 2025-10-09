// utils/ahpHelpers.js

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
 * Normalisasi matriks perbandingan (VERSI PRESISI)
 * Returns: { normalizedMatrix, columnSums }
 */
export function normalizeMatrix(matrix) {
    const n = matrix.length;
    const normalizedMatrix = Array(n)
        .fill()
        .map(() => Array(n).fill(0));

    // Hitung jumlah setiap kolom (VERTIKAL)
    const columnSums = Array(n).fill(0);
    for (let j = 0; j < n; j++) {
        for (let i = 0; i < n; i++) {
            columnSums[j] += matrix[i][j];
        }
    }

    // Normalisasi setiap elemen
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            normalizedMatrix[i][j] =
                columnSums[j] > 0 ? matrix[i][j] / columnSums[j] : 0;
        }
    }

    return {
        normalizedMatrix,
        columnSums,
    };
}
/**
 * Hitung bobot kriteria (priority vector)
 */
export function calculateWeights(normalizedMatrix) {
    const n = normalizedMatrix.length;
    const weights = Array(n).fill(0);
    const rowSums = Array(n).fill(0);

    // Rata-rata setiap baris
    for (let i = 0; i < n; i++) {
        let sum = 0;
        for (let j = 0; j < n; j++) {
            sum += normalizedMatrix[i][j];
        }
        rowSums[i] = sum;
        weights[i] = sum / n;
    }

    return {
        weights,
        rowSums,
    };
}

export function calculateEigenvalues(matrix, weights) {
    const n = matrix.length;
    const weightedSums = Array(n).fill(0);
    const eigenvalues = Array(n).fill(0);

    // Hitung weighted sum untuk setiap baris
    for (let i = 0; i < n; i++) {
        let sum = 0;
        for (let j = 0; j < n; j++) {
            sum += matrix[i][j] * weights[j];
        }
        weightedSums[i] = sum;
        // Eigenvalue = weighted sum / priority vector
        eigenvalues[i] = weights[i] > 0 ? sum / weights[i] : 0;
    }

    return {
        weightedSums,
        eigenvalues,
    };
}

/**
 * Hitung lambda maksimum - VERSI PRESISI
 */
export function calculateLambdaMax(eigenvalues) {
    const n = eigenvalues.length;
    const sum = eigenvalues.reduce((acc, val) => acc + val, 0);
    return sum / n;
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
    const ri = RI[n] || 1.49;
    return ci / ri;
}

/**
 * Cek konsistensi matriks
 */
export function checkConsistency(matrix) {
    const n = matrix.length;

    // Step 1: Normalisasi
    const { normalizedMatrix, columnSums } = normalizeMatrix(matrix);

    // Step 2: Hitung weights
    const { weights, rowSums: normalizedRowSums } =
        calculateWeights(normalizedMatrix);

    // Step 3: Hitung eigenvalues
    const { weightedSums, eigenvalues } = calculateEigenvalues(matrix, weights);

    // Step 4: Hitung lambda max
    const lambdaMax = calculateLambdaMax(eigenvalues);

    // Step 5: Hitung CI dan CR
    const ci = calculateCI(lambdaMax, n);
    const cr = calculateCR(ci, n);

    // Random Index
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

    return {
        weights,
        normalizedMatrix,
        columnSums,
        normalizedRowSums,
        weightedSums,
        eigenvalues,
        lambdaMax,
        ci,
        cr,
        ri: RI[n] || 1.49,
        isConsistent: cr <= 0.1,
        matrix,
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

export function formatNumber(number, decimals = 4) {
    if (number === null || number === undefined || isNaN(number)) {
        return "0." + "0".repeat(decimals);
    }
    return Number(number).toFixed(decimals);
}

/**
 * Hitung penjumlahan setiap baris matriks
 */
export function calculateRowSums(matrix) {
    return matrix.map((row) => row.reduce((sum, val) => sum + val, 0));
}

export function calculateColumnSums(matrix) {
    const n = matrix.length;
    if (n === 0) return [];

    const m = matrix[0].length;
    const columnSums = Array(m).fill(0);

    for (let j = 0; j < m; j++) {
        for (let i = 0; i < n; i++) {
            columnSums[j] += matrix[i][j];
        }
    }

    return columnSums;
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

export function decimalToFraction(decimal) {
    if (Math.abs(decimal - 1) < 0.0001) {
        return "1";
    }

    if (decimal >= 1) {
        const rounded = Math.round(decimal);
        if (Math.abs(decimal - rounded) < 0.01) {
            return String(rounded);
        }
        return decimal.toFixed(2);
    }

    const reciprocal = 1 / decimal;
    const rounded = Math.round(reciprocal);

    if (Math.abs(reciprocal - rounded) < 0.01) {
        return `1/${rounded}`;
    }
    return `1/${reciprocal.toFixed(2)}`;
}

export function generateCalculationDetails(matrix, normalizedMatrix, weights) {
    const n = matrix.length;
    const details = {
        rowSums: calculateRowSums(matrix),
        columnSums: calculateColumnSums(matrix),
        normalizedRowSums: calculateRowSums(normalizedMatrix),
        normalizedColumnSums: calculateColumnSums(normalizedMatrix),
    };

    return details;
}

export function calculateAHPComplete(matrix) {
    const n = matrix.length;

    if (n < 2) {
        return {
            error: "Minimal 2 kriteria diperlukan",
            isValid: false,
        };
    }

    const { normalizedMatrix, columnSums } = normalizeMatrix(matrix);
    const { weights, rowSums: normalizedRowSums } =
        calculateWeights(normalizedMatrix);
    const { weightedSums, eigenvalues } = calculateEigenvalues(matrix, weights);
    const lambdaMax = calculateLambdaMax(eigenvalues);
    const ci = calculateCI(lambdaMax, n);
    const cr = calculateCR(ci, n);

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

    return {
        isValid: true,
        matrix,
        normalizedMatrix,
        weights,
        rowSums: calculateRowSums(matrix),
        columnSums,
        normalizedRowSums,
        normalizedColumnSums: calculateColumnSums(normalizedMatrix),
        weightedSums,
        eigenvalues,
        lambdaMax,
        ci,
        cr,
        ri: RI[n] || 1.49,
        isConsistent: cr <= 0.1,
        n,
    };
}
