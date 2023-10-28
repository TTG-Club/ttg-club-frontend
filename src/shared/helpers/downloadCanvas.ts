export const downloadCanvas = () => {
  const canvas = document.getElementById('canvasToken') as HTMLCanvasElement;

  if (canvas) {
    const canvasDataUrl = canvas.toDataURL('image/webp', 1);

    const a = document.createElement('a');

    a.href = canvasDataUrl;
    a.download = 'token.webp';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};
