import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

export interface PdfExportOptions {
  filename?: string;
  title?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter';
  marginMm?: number;
  quality?: number;
}

/**
 * Exports an HTML element directly to a downloadable PDF file using html2canvas & jsPDF.
 * Automatically slices long documents into multiple A4 pages with crisp high-DPI rendering.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  options: PdfExportOptions = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      filename = `dokumen_${new Date().toISOString().split('T')[0]}.pdf`,
      title = 'Dokumen Logistik Gudang',
      orientation = 'portrait',
      format = 'a4',
      marginMm = 10,
    } = options;

    // Render element into high-resolution canvas
    const canvas = await html2canvas(element, {
      scale: 2, // 2x retina clarity for crisp barcode, text, lines
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      onclone: (clonedDoc) => {
        // Ensure no-print items are hidden in cloned DOM
        const noPrintItems = clonedDoc.querySelectorAll('.no-print');
        noPrintItems.forEach((el) => {
          (el as HTMLElement).style.display = 'none';
        });
      },
    });

    const isLandscape = orientation === 'landscape';
    const pdf = new jsPDF({
      orientation: isLandscape ? 'l' : 'p',
      unit: 'mm',
      format: format,
    });

    // Set PDF document metadata
    pdf.setProperties({
      title: title,
      subject: 'Laporan Inventaris Pergudangan',
      author: 'PT. Abadi Agrosindo Persada',
      creator: 'Sistem Manajemen Gudang Digital AAP',
    });

    const pageWidth = isLandscape ? 297 : 210;
    const pageHeight = isLandscape ? 210 : 297;

    const printableWidth = pageWidth - marginMm * 2;
    const printableHeight = pageHeight - marginMm * 2;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Dimensions of canvas rendered at printable width scale in mm
    const renderedHeightMm = (canvasHeight * printableWidth) / canvasWidth;

    if (renderedHeightMm <= printableHeight) {
      // Single page document
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', marginMm, marginMm, printableWidth, renderedHeightMm, undefined, 'FAST');
    } else {
      // Multi-page document: slice canvas page-by-page to avoid cutting lines awkwardly
      const pxPerMm = canvasWidth / printableWidth;
      const pageHeightPx = Math.floor(printableHeight * pxPerMm);
      let renderedPx = 0;
      let pageIndex = 0;

      while (renderedPx < canvasHeight) {
        if (pageIndex > 0) {
          pdf.addPage(format, isLandscape ? 'l' : 'p');
        }

        const sliceHeightPx = Math.min(pageHeightPx, canvasHeight - renderedPx);

        // Create a temporary canvas for this page slice
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvasWidth;
        pageCanvas.height = sliceHeightPx;
        const pageCtx = pageCanvas.getContext('2d');

        if (pageCtx) {
          pageCtx.fillStyle = '#ffffff';
          pageCtx.fillRect(0, 0, canvasWidth, sliceHeightPx);
          pageCtx.drawImage(
            canvas,
            0,
            renderedPx,
            canvasWidth,
            sliceHeightPx,
            0,
            0,
            canvasWidth,
            sliceHeightPx
          );

          const sliceHeightMm = (sliceHeightPx * printableWidth) / canvasWidth;
          const sliceImgData = pageCanvas.toDataURL('image/png');
          pdf.addImage(sliceImgData, 'PNG', marginMm, marginMm, printableWidth, sliceHeightMm, undefined, 'FAST');
        }

        renderedPx += sliceHeightPx;
        pageIndex++;
      }
    }

    // Save and download PDF file
    pdf.save(filename);
    return { success: true };
  } catch (err: unknown) {
    console.error('Failed to export PDF:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Gagal mengekspor dokumen ke format PDF',
    };
  }
}

/**
 * Creates an isolated, clean printable iframe to trigger native browser Print / Save to PDF.
 * Eliminates background UI bleeding, modal backdrops, scrollbars, and iframe sandbox issues.
 */
export function printElementDirectly(element: HTMLElement, title: string = 'Cetak Dokumen') {
  try {
    // Clone printable element content
    const content = element.innerHTML;

    // Check if an existing print iframe exists, remove if so
    const existingIframe = document.getElementById('inventory-print-iframe');
    if (existingIframe) {
      existingIframe.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'inventory-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      // Fallback to window.print if iframe document is not accessible
      window.print();
      return;
    }

    // Build standalone HTML document with complete print typography
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
          <style>
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              margin: 0;
              padding: 1.5cm;
              font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              color: #0f172a;
              background-color: #ffffff;
              font-size: 11pt;
              line-height: 1.4;
            }
            .font-mono, code {
              font-family: 'JetBrains Mono', monospace;
            }
            .no-print {
              display: none !important;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 1.5rem;
              page-break-inside: auto;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 6px 10px;
            }
            th {
              background-color: #f1f5f9 !important;
              font-weight: 600;
            }
            .border-b-2 {
              border-bottom: 2px solid #0f172a;
            }
            .grid {
              display: grid;
            }
            .grid-cols-2 {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            .grid-cols-3 {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }
            .gap-4 { gap: 1rem; }
            .gap-6 { gap: 1.5rem; }
            .flex { display: flex; }
            .items-center { align-items: center; }
            .justify-between { justify-content: space-between; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .font-bold { font-weight: 700; }
            .font-semibold { font-weight: 600; }
            .font-medium { font-weight: 500; }
            .uppercase { text-transform: uppercase; }
            .text-xs { font-size: 0.75rem; }
            .text-sm { font-size: 0.875rem; }
            .text-base { font-size: 1rem; }
            .text-lg { font-size: 1.125rem; }
            .text-xl { font-size: 1.25rem; }
            .text-emerald-700 { color: #047857; }
            .text-emerald-800 { color: #065f46; }
            .bg-emerald-50 { background-color: #ecfdf5 !important; }
            .border-emerald-600 { border-color: #059669; }
            .bg-slate-50 { background-color: #f8fafc !important; }
            .bg-slate-100 { background-color: #f1f5f9 !important; }
            .border-slate-200 { border-color: #e2e8f0; }
            .border-slate-300 { border-color: #cbd5e1; }
            .border-slate-400 { border-color: #94a3b8; }
            .border-slate-900 { border-color: #0f172a; }
            .text-slate-500 { color: #64748b; }
            .text-slate-600 { color: #475569; }
            .text-slate-700 { color: #334155; }
            .text-slate-800 { color: #1e293b; }
            .text-slate-900 { color: #0f172a; }
            .rounded { border-radius: 0.25rem; }
            .rounded-lg { border-radius: 0.5rem; }
            .p-4 { padding: 1rem; }
            .p-3 { padding: 0.75rem; }
            .mb-6 { margin-bottom: 1.5rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mb-16 { margin-bottom: 4rem; }
            .pt-6 { padding-top: 1.5rem; }
            .border-b { border-bottom-width: 1px; border-bottom-style: solid; }
            @page {
              size: A4 portrait;
              margin: 1.2cm;
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);
    doc.close();

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => iframe.remove(), 2000);
      }, 300);
    };
  } catch (err) {
    console.warn('Iframe print failed, falling back to window.print():', err);
    window.print();
  }
}
