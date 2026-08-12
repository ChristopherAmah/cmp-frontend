// Import worker configuration FIRST - this ensures worker is set before react-pdf initializes
import '@/config/pdfWorker';

import { useState, useEffect, useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader2, AlertCircle, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

/**
 * Professional PDF Viewer Component
 * Uses react-pdf (PDF.js wrapper) for in-app PDF viewing
 */
const PdfViewer = ({ 
  pdfUrl, 
  fileName = "document.pdf",
  onClose,
  showCloseButton = true,
  className = "",
  height = "100%",
}) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfData, setPdfData] = useState(null);

  useEffect(() => {
    if (pdfUrl) {
      setLoading(true);
      setError(null);
      setPageNumber(1);
      setScale(1.0);
      
      // If it's already a blob URL, use it directly
      if (pdfUrl.startsWith("blob:")) {
        setPdfData(pdfUrl);
        setLoading(false);
        return;
      }
      
      // For HTTP/HTTPS URLs, fetch as blob
      const isHttp = pdfUrl.startsWith("http://") || pdfUrl.startsWith("https://");
      
      if (isHttp) {
        fetch(pdfUrl, {
          method: "GET",
          mode: "cors",
          credentials: "include",
          headers: {
            "Accept": "application/pdf",
          },
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.blob();
          })
          .then((blob) => {
            // Verify it's a PDF
            if (blob.type && !blob.type.includes("pdf") && !blob.type.includes("octet-stream") && blob.type !== "") {
              console.warn("Blob type is not PDF:", blob.type);
            }
            const blobUrl = URL.createObjectURL(blob);
            setPdfData(blobUrl);
            setLoading(false);
          })
          .catch((err) => {
            console.error("Error fetching PDF as blob:", err);
            setError(`Failed to load PDF: ${err.message}`);
            setLoading(false);
          });
      } else {
        // For data URIs, use directly
        setPdfData(pdfUrl);
        setLoading(false);
      }
    }

    // Cleanup blob URL on unmount
    return () => {
      if (pdfData && pdfData.startsWith("blob:")) {
        URL.revokeObjectURL(pdfData);
      }
    };
  }, [pdfUrl]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = async (error) => {
    console.error("PDF load error:", error);
    console.error("Error details:", {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
      pdfUrl: pdfUrl,
      pdfData: pdfData,
    });
    
    // Provide more specific error messages
    let errorMessage = "Failed to load PDF document.";
    if (error?.message) {
      if (error.message.includes("Invalid PDF") || error.message.includes("InvalidPDFException")) {
        errorMessage = "The file is not a valid PDF document.";
      } else if (error.message.includes("NetworkError") || error.message.includes("Failed to fetch") || error.message.includes("Network request failed")) {
        errorMessage = "Network error: Could not fetch the PDF. Please check your connection and try again.";
      } else if (error.message.includes("CORS")) {
        errorMessage = "CORS error: The PDF server does not allow cross-origin requests.";
      } else if (error.message.includes("Missing PDF")) {
        errorMessage = "The PDF file appears to be corrupted or incomplete.";
      } else {
        errorMessage = `Error: ${error.message}`;
      }
    } else {
      errorMessage = "Failed to load PDF document. Please check the URL and try again.";
    }
    
    setError(errorMessage);
    setLoading(false);
  };

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(numPages || 1, prev + 1));
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(3.0, prev + 0.25));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(0.5, prev - 0.25));
  };

  const handleDownload = async () => {
    if (pdfUrl) {
      try {
        // Fetch the file as a blob to ensure proper download
        const response = await fetch(pdfUrl, {
          method: "GET",
          mode: "cors",
          credentials: "omit",
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up blob URL after download starts
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 100);
      } catch (error) {
        console.error("Error downloading PDF:", error);
        // Fallback to direct link if blob fetch fails
        const link = document.createElement("a");
        link.href = pdfUrl;
        link.download = fileName;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  const handlePrint = () => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
      // Trigger print dialog after a short delay
      setTimeout(() => {
        window.print();
      }, 500);
    }
  };

  // Memoize PDF.js options to prevent unnecessary reloads
  const pdfOptions = useMemo(
    () => ({
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
      httpHeaders: {},
      withCredentials: false,
    }),
    []
  );

  if (!pdfUrl) {
    return (
      <Card className={`p-8 ${className}`}>
        <div className="flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No PDF URL provided</p>
        </div>
      </Card>
    );
  }

  return (
    <div className={`relative w-full bg-background ${className}`} style={{ height }}>
      {/* Toolbar */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* Page Navigation */}
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1 || loading}
            title="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-foreground px-2">
            {loading ? "..." : `${pageNumber} / ${numPages || "?"}`}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={pageNumber >= (numPages || 1) || loading}
            title="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Zoom Controls */}
          <div className="h-6 w-px bg-border mx-2" />
          <Button
            variant="outline"
            size="sm"
            onClick={zoomOut}
            disabled={scale <= 0.5 || loading}
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-foreground px-2 min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={zoomIn}
            disabled={scale >= 3.0 || loading}
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          {/* Actions */}
          <div className="h-6 w-px bg-border mx-2" />
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={loading}
            title="Download PDF"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            disabled={loading}
            title="Print PDF"
          >
            <Printer className="h-4 w-4" />
          </Button>
        </div>

        {showCloseButton && onClose && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10 pt-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#00B4D8]" />
            <p className="text-sm text-muted-foreground">Loading PDF...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background pt-12">
          <Card className="p-8 max-w-md">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed to Load PDF</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              {showCloseButton && onClose && (
                <Button onClick={onClose} variant="outline">
                  Close
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* PDF Viewer */}
      {!error && pdfData && (
        <div className="relative w-full h-full overflow-auto pt-12 bg-secondary">
          <div className="flex flex-col items-center p-4">
            <Document
              file={pdfData}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              options={pdfOptions}
              loading={
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-[#00B4D8]" />
                </div>
              }
              error={
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                  <p className="text-sm text-muted-foreground">Failed to load PDF</p>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-lg border border-border rounded"
              />
            </Document>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfViewer;
