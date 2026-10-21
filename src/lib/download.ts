/** Dispara o download de um arquivo de texto gerado no navegador. */
export function downloadTextFile(fileName: string, content: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  // Revogar no mesmo tick pode cancelar o download em alguns navegadores.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
