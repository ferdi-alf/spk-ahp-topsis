import { Close } from "@mui/icons-material";

export default function ModalLayout({
    textButton,
    children,
    modalTitle,
    onClose,
    isOpen,
    onOpen,
    button = true,
}) {
    return (
        <>
            {button && (
                <div className="flex justify-end">
                    <button
                        onClick={onOpen}
                        type="button"
                        className="text-white bg-gradient-to-br from-blue-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
                    >
                        {textButton}
                    </button>
                </div>
            )}

            <div
                onClick={onClose}
                className={`${
                    isOpen ? "flex" : "hidden"
                } overflow-y-auto overflow-x-hidden h-screen fixed top-0 right-0 left-0 bg-black/40 z-50 justify-center items-center w-full md:inset-0 max-h-full`}
            >
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="relative p-4 w-full max-w-md max-h-full"
                >
                    <div className="relative bg-white rounded-lg shadow-lg">
                        <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {modalTitle}
                            </h3>
                            <button
                                onClick={onClose}
                                type="button"
                                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
                            >
                                <Close className="w-4 h-4" />
                                <span className="sr-only">Close modal</span>
                            </button>
                        </div>
                        <div className="p-4 md:p-5">{children}</div>
                    </div>
                </div>
            </div>
        </>
    );
}
