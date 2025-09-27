// Pages/Kriteria.jsx
import AuthenticatedLayout from "../Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import * as React from "react";
import PropTypes from "prop-types";
import { useTheme } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import TableKriteria from "./Partials/TableKriteria";
import TableSkala from "./Partials/TableSkala";
import TableHasil from "./Partials/TableHasil";

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`full-width-tabpanel-${index}`}
            aria-labelledby={`full-width-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
};

function a11yProps(index) {
    return {
        id: `full-width-tab-${index}`,
        "aria-controls": `full-width-tabpanel-${index}`,
    };
}

export default function Kriteria() {
    const theme = useTheme();
    const [value, setValue] = React.useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Analisis Kriteria AHP" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">
                            Analisis Kriteria AHP
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Kelola kriteria dan lakukan analisis perbandingan
                            berpasangan menggunakan metode AHP
                        </p>
                    </div>

                    <Box
                        sx={{
                            bgcolor: "background.paper",
                            borderRadius: 2,
                            boxShadow: 1,
                        }}
                    >
                        <AppBar
                            position="static"
                            color="transparent"
                            elevation={0}
                        >
                            <Tabs
                                value={value}
                                onChange={handleChange}
                                textColor="primary"
                                indicatorColor="primary"
                                variant="fullWidth"
                                aria-label="tabs analisis kriteria"
                                sx={{
                                    borderBottom: 1,
                                    borderColor: "divider",
                                    "& .MuiTab-root": {
                                        textTransform: "none",
                                        fontSize: "1rem",
                                        fontWeight: 500,
                                        minHeight: 64,
                                    },
                                }}
                            >
                                <Tab
                                    label="Data Kriteria"
                                    {...a11yProps(0)}
                                    icon={<span className="text-lg">📋</span>}
                                    iconPosition="start"
                                />
                                <Tab
                                    label="Perbandingan Berpasangan"
                                    {...a11yProps(1)}
                                    icon={<span className="text-lg">⚖️</span>}
                                    iconPosition="start"
                                />
                                <Tab
                                    label="Hasil Analisis"
                                    {...a11yProps(2)}
                                    icon={<span className="text-lg">📊</span>}
                                    iconPosition="start"
                                />
                            </Tabs>
                        </AppBar>

                        {/* Tab 1: Data Kriteria */}
                        <TabPanel value={value} index={0} dir={theme.direction}>
                            <TableKriteria />
                        </TabPanel>

                        {/* Tab 2: Perbandingan Berpasangan */}
                        <TabPanel value={value} index={1} dir={theme.direction}>
                            <TableSkala />
                        </TabPanel>

                        {/* Tab 3: Hasil Analisis */}
                        <TabPanel value={value} index={2} dir={theme.direction}>
                            <TableHasil />
                        </TabPanel>
                    </Box>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
