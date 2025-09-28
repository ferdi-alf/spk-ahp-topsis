import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Collapse,
    Box,
    Typography,
    TablePagination,
} from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";

function Row(props) {
    const {
        row,
        headers,
        showActionButton,
        renderDropDownTable,
        dropdownTitle,
        hasDropdown,
        columnMapper,
        rowIndex,
        cellAlignment = "center",
    } = props;

    const [open, setOpen] = React.useState(false);

    return (
        <>
            <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
                {hasDropdown && (
                    <TableCell align="center">
                        <IconButton
                            aria-label="expand row"
                            size="small"
                            onClick={() => setOpen(!open)}
                        >
                            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                        </IconButton>
                    </TableCell>
                )}

                {headers.map((header, index) => {
                    if (header.toLowerCase() === "action") return null;

                    const key = header.toLowerCase();
                    const content = columnMapper?.[key]
                        ? columnMapper[key](row, rowIndex)
                        : row[key] || row[header] || "-";

                    const alignment =
                        index === 0 && cellAlignment === "center"
                            ? "left"
                            : cellAlignment;

                    return (
                        <TableCell
                            className="truncate"
                            key={index}
                            component={index === 0 ? "th" : "td"}
                            scope={index === 0 ? "row" : undefined}
                            align={alignment}
                        >
                            <div
                                className={
                                    key === "avatar"
                                        ? "flex justify-center items-center"
                                        : ""
                                }
                            >
                                {content}
                            </div>
                        </TableCell>
                    );
                })}

                {showActionButton && (
                    <TableCell align="center" className="overflow-auto">
                        <Box
                            sx={{
                                display: "flex",
                                gap: 1,
                                justifyContent: "center",
                            }}
                        >
                            {(() => {
                                const buttons =
                                    typeof showActionButton === "function"
                                        ? showActionButton(row)
                                        : showActionButton;

                                return (
                                    <>
                                        {buttons.view && buttons.view}
                                        {buttons.edit && buttons.edit}
                                        {buttons.delete && buttons.delete}
                                    </>
                                );
                            })()}
                        </Box>
                    </TableCell>
                )}
            </TableRow>

            {hasDropdown && (
                <TableRow>
                    <TableCell
                        style={{ paddingBottom: 0, paddingTop: 0, border: 0 }}
                        colSpan={
                            headers.length + (showActionButton ? 1 : 0) + 1
                        }
                    >
                        <Collapse in={open} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 1 }}>
                                <Typography
                                    variant="h6"
                                    gutterBottom
                                    component="div"
                                >
                                    {dropdownTitle || "Details"}
                                </Typography>

                                <Box
                                    sx={{
                                        overflowX: "auto",
                                        maxWidth: "100%",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            minWidth: "600px",
                                        }}
                                    >
                                        {typeof renderDropDownTable ===
                                        "function"
                                            ? renderDropDownTable(row)
                                            : renderDropDownTable}
                                    </Box>
                                </Box>
                            </Box>
                        </Collapse>
                    </TableCell>
                </TableRow>
            )}
        </>
    );
}

export default function ReusableCollapsibleTable({
    headers,
    data,
    showActionButton,
    renderDropDownTable,
    dropdownTitle,
    hasDropdown = false,
    columnMapper,
    rowsPerPageDefault = 5,
    cellAlignment = "center",
    headerAlignment = "center",
}) {
    const [rowsPerPage, setRowsPerPage] = React.useState(rowsPerPageDefault);
    const [page, setPage] = React.useState(0);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <TableContainer component={Paper}>
            <div className="w-full overflow-x-auto">
                <Table
                    aria-label="table with sticky header"
                    className="min-w-full"
                >
                    <TableHead>
                        <TableRow>
                            {hasDropdown && <TableCell align="center" />}
                            {headers.map((header, index) => {
                                const alignment =
                                    index === 0 && headerAlignment === "center"
                                        ? "left"
                                        : headerAlignment;

                                return (
                                    <TableCell key={index} align={alignment}>
                                        {header.charAt(0).toUpperCase() +
                                            header.slice(1)}
                                    </TableCell>
                                );
                            })}
                            {showActionButton && (
                                <TableCell align="center">Action</TableCell>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data
                            .slice(
                                page * rowsPerPage,
                                page * rowsPerPage + rowsPerPage
                            )
                            .map((row, index) => (
                                <Row
                                    key={page * rowsPerPage + index}
                                    row={row}
                                    headers={headers}
                                    showActionButton={showActionButton}
                                    renderDropDownTable={renderDropDownTable}
                                    dropdownTitle={dropdownTitle}
                                    hasDropdown={hasDropdown}
                                    columnMapper={columnMapper}
                                    rowIndex={page * rowsPerPage + index}
                                    cellAlignment={cellAlignment}
                                />
                            ))}
                    </TableBody>
                </Table>
            </div>

            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={data.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </TableContainer>
    );
}
