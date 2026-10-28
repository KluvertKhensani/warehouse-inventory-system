import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import {
    Camera,
    CameraOff,
    CheckCircle2,
    Keyboard,
    LoaderCircle,
    RefreshCw,
    X,
} from "lucide-react";
import {
    BrowserMultiFormatReader,
} from "@zxing/browser";
import {
    parseScanValue,
    validateScanType,
} from "../utils/scanParser";

const scanCooldownMilliseconds = 1600;

function getCameraErrorMessage(error) {
    const errorName = error?.name || "";

    if (
        errorName === "NotAllowedError" ||
        errorName === "PermissionDeniedError"
    ) {
        return (
            "Camera permission was denied. " +
            "Allow camera access in the browser settings and try again."
        );
    }

    if (
        errorName === "NotFoundError" ||
        errorName === "DevicesNotFoundError"
    ) {
        return (
            "No camera was found on this device. " +
            "Use manual barcode entry instead."
        );
    }

    if (
        errorName === "NotReadableError" ||
        errorName === "TrackStartError"
    ) {
        return (
            "The camera is already in use or unavailable. " +
            "Close other camera applications and try again."
        );
    }

    if (errorName === "OverconstrainedError") {
        return (
            "The preferred rear camera is unavailable. " +
            "Try another camera or use manual entry."
        );
    }

    if (errorName === "SecurityError") {
        return (
            "Camera access requires a secure HTTPS connection."
        );
    }

    return (
        error?.message ||
        "The camera could not be started."
    );
}

function selectPreferredCamera(devices) {
    if (!Array.isArray(devices) || devices.length === 0) {
        return "";
    }

    const rearCamera = devices.find((device) => {
        const label = String(
            device.label || ""
        ).toLowerCase();

        return (
            label.includes("back") ||
            label.includes("rear") ||
            label.includes("environment")
        );
    });

    return rearCamera?.deviceId ||
        devices[devices.length - 1]?.deviceId ||
        devices[0]?.deviceId ||
        "";
}

function BarcodeScanner({
    title = "Scan barcode",
    instructions =
    "Position the barcode inside the scanning area.",
    expectedEntityType,
    onScan,
    onClose,
}) {
    const videoReference = useRef(null);
    const controlsReference = useRef(null);
    const readerReference = useRef(null);
    const lastScanReference = useRef({
        value: "",
        scannedAt: 0,
    });
    const scanHandledReference = useRef(false);

    const [cameraDevices, setCameraDevices] =
        useState([]);
    const [selectedDeviceId, setSelectedDeviceId] =
        useState("");
    const [cameraStatus, setCameraStatus] =
        useState("starting");
    const [errorMessage, setErrorMessage] =
        useState("");
    const [manualValue, setManualValue] =
        useState("");
    const [manualMode, setManualMode] =
        useState(false);

    const stopScanner = useCallback(() => {
        if (controlsReference.current) {
            controlsReference.current.stop();
            controlsReference.current = null;
        }

        if (videoReference.current?.srcObject) {
            const tracks =
                videoReference.current.srcObject
                    .getTracks();

            tracks.forEach((track) => {
                track.stop();
            });

            videoReference.current.srcObject = null;
        }

        readerReference.current = null;
    }, []);

    const processScan = useCallback(
        (value) => {
            const parsedScan =
                parseScanValue(value);

            if (!parsedScan.success) {
                setErrorMessage(
                    parsedScan.message
                );
                return false;
            }

            if (expectedEntityType) {
                const typeValidation =
                    validateScanType(
                        parsedScan,
                        expectedEntityType
                    );

                if (!typeValidation.success) {
                    setErrorMessage(
                        typeValidation.message
                    );
                    return false;
                }
            }

            const currentTime = Date.now();

            if (
                lastScanReference.current.value ===
                parsedScan.normalizedValue &&
                currentTime -
                lastScanReference.current.scannedAt <
                scanCooldownMilliseconds
            ) {
                return false;
            }

            lastScanReference.current = {
                value: parsedScan.normalizedValue,
                scannedAt: currentTime,
            };

            if (scanHandledReference.current) {
                return false;
            }

            scanHandledReference.current = true;
            setCameraStatus("success");
            setErrorMessage("");
            stopScanner();

            if (typeof onScan === "function") {
                onScan(parsedScan);
            }

            return true;
        },
        [
            expectedEntityType,
            onScan,
            stopScanner,
        ]
    );

    const startScanner = useCallback(
        async (requestedDeviceId = "") => {
            stopScanner();
            scanHandledReference.current = false;
            setCameraStatus("starting");
            setErrorMessage("");

            try {
                if (
                    !navigator.mediaDevices ||
                    !navigator.mediaDevices
                        .getUserMedia
                ) {
                    throw new Error(
                        "Camera scanning is not supported by this browser."
                    );
                }

                const reader =
                    new BrowserMultiFormatReader();

                readerReference.current = reader;

                const devices =
                    await BrowserMultiFormatReader
                        .listVideoInputDevices();

                if (!devices.length) {
                    const noCameraError =
                        new Error(
                            "No camera was found on this device."
                        );

                    noCameraError.name =
                        "NotFoundError";

                    throw noCameraError;
                }

                setCameraDevices(devices);

                const deviceId =
                    requestedDeviceId ||
                    selectPreferredCamera(devices);

                setSelectedDeviceId(deviceId);

                const controls =
                    await reader.decodeFromVideoDevice(
                        deviceId || undefined,
                        videoReference.current,
                        (result) => {
                            if (!result) {
                                return;
                            }

                            processScan(
                                result.getText()
                            );
                        }
                    );

                controlsReference.current = controls;
                setCameraStatus("scanning");
            } catch (error) {
                stopScanner();
                setCameraStatus("error");
                setErrorMessage(
                    getCameraErrorMessage(error)
                );
            }
        },
        [
            processScan,
            stopScanner,
        ]
    );

    useEffect(() => {
        let effectCancelled = false;

        const frameId =
            window.requestAnimationFrame(() => {
                if (!effectCancelled) {
                    void startScanner();
                }
            });

        return () => {
            effectCancelled = true;
            window.cancelAnimationFrame(
                frameId
            );
            stopScanner();
        };
    }, [
        startScanner,
        stopScanner,
    ]);

    function handleCameraChange(event) {
        const deviceId =
            event.target.value;

        setSelectedDeviceId(deviceId);
        void startScanner(deviceId);
    }

    function handleManualSubmit(event) {
        event.preventDefault();

        if (!manualValue.trim()) {
            setErrorMessage(
                "Enter a barcode value."
            );
            return;
        }

        processScan(manualValue);
    }

    function handleClose() {
        stopScanner();

        if (typeof onClose === "function") {
            onClose();
        }
    }

    function handleRetry() {
        setManualMode(false);
        scanHandledReference.current = false;
        void startScanner(
            selectedDeviceId
        );
    }

    return (
        <div
            className="scanner-backdrop"
            role="presentation"
        >
            <section
                className="scanner-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="scannerTitle"
            >
                <header className="scanner-header">
                    <div>
                        <h2 id="scannerTitle">
                            {title}
                        </h2>

                        <p>{instructions}</p>
                    </div>

                    <button
                        type="button"
                        className="scanner-close-button"
                        aria-label="Close barcode scanner"
                        onClick={handleClose}
                    >
                        <X
                            size={22}
                            aria-hidden="true"
                        />
                    </button>
                </header>

                {!manualMode && (
                    <>
                        <div className="scanner-video-container">
                            {cameraStatus ===
                                "starting" && (
                                    <div className="scanner-state-overlay">
                                        <LoaderCircle
                                            className="scanner-spinner"
                                            size={30}
                                            aria-hidden="true"
                                        />

                                        <span>
                                            Starting camera
                                        </span>
                                    </div>
                                )}

                            {cameraStatus ===
                                "error" && (
                                    <div className="scanner-state-overlay scanner-error-state">
                                        <CameraOff
                                            size={34}
                                            aria-hidden="true"
                                        />

                                        <span>
                                            Camera unavailable
                                        </span>
                                    </div>
                                )}

                            {cameraStatus ===
                                "success" && (
                                    <div className="scanner-state-overlay scanner-success-state">
                                        <CheckCircle2
                                            size={38}
                                            aria-hidden="true"
                                        />

                                        <span>
                                            Barcode captured
                                        </span>
                                    </div>
                                )}

                            <video
                                ref={videoReference}
                                className="scanner-video"
                                autoPlay
                                muted
                                playsInline
                            />

                            {cameraStatus ===
                                "scanning" && (
                                    <div
                                        className="scanner-target"
                                        aria-hidden="true"
                                    >
                                        <span />
                                        <span />
                                        <span />
                                        <span />
                                    </div>
                                )}
                        </div>

                        {cameraDevices.length > 1 && (
                            <div className="scanner-camera-field">
                                <label htmlFor="scannerCamera">
                                    Camera
                                </label>

                                <select
                                    id="scannerCamera"
                                    value={selectedDeviceId}
                                    onChange={
                                        handleCameraChange
                                    }
                                >
                                    {cameraDevices.map(
                                        (
                                            device,
                                            index
                                        ) => (
                                            <option
                                                key={
                                                    device.deviceId
                                                }
                                                value={
                                                    device.deviceId
                                                }
                                            >
                                                {device.label ||
                                                    `Camera ${index + 1
                                                    }`}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>
                        )}
                    </>
                )}

                {manualMode && (
                    <form
                        className="scanner-manual-form"
                        onSubmit={
                            handleManualSubmit
                        }
                    >
                        <label htmlFor="manualBarcode">
                            Barcode value
                        </label>

                        <input
                            id="manualBarcode"
                            type="text"
                            value={manualValue}
                            placeholder="For example PRD:BEV-1001"
                            autoComplete="off"
                            autoCapitalize="characters"
                            onChange={(event) => {
                                setManualValue(
                                    event.target.value
                                );
                                setErrorMessage("");
                            }}
                        />

                        <button
                            type="submit"
                            className="primary-button"
                        >
                            Use barcode
                        </button>
                    </form>
                )}

                {errorMessage && (
                    <div
                        className="scanner-error"
                        role="alert"
                    >
                        {errorMessage}
                    </div>
                )}

                <footer className="scanner-actions">
                    {!manualMode &&
                        cameraStatus ===
                        "error" && (
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={handleRetry}
                            >
                                <RefreshCw
                                    size={18}
                                    aria-hidden="true"
                                />
                                Retry camera
                            </button>
                        )}

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() => {
                            stopScanner();
                            setManualMode(
                                (current) => !current
                            );
                            setErrorMessage("");
                        }}
                    >
                        {manualMode ? (
                            <>
                                <Camera
                                    size={18}
                                    aria-hidden="true"
                                />
                                Use camera
                            </>
                        ) : (
                            <>
                                <Keyboard
                                    size={18}
                                    aria-hidden="true"
                                />
                                Enter manually
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={handleClose}
                    >
                        Close
                    </button>
                </footer>
            </section>
        </div>
    );
}

export default BarcodeScanner;