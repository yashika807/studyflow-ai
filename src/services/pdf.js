// Reads every page of a PDF file and returns its plain text.
// pdf.js is loaded on demand so it does not slow down the first page load.
export async function extractTextFromPdf(file) {
  const pdfjsLib = await import('pdfjs-dist');
  const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // pdf.js marks line ends with hasEOL; joining without extra spaces keeps words intact
    pages.push(content.items.map((item) => item.str + (item.hasEOL ? '\n' : '')).join(''));
  }

  const text = pages.join('\n\n').replace(/[ \t]+/g, ' ').trim();
  return { text, pages: pdf.numPages };
}
