export const downloadSVG = (svgNode: HTMLElement) => {
  const svgText = new XMLSerializer().serializeToString(svgNode);

  const svgBlob = new Blob([svgText], {
    type: 'image/svg+xml;charset=utf-8'
  });

  const svgUrl = URL.createObjectURL(svgBlob);

  const a = document.createElement('a');

  a.href = svgUrl;
  a.download = 'token.svg';

  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(svgUrl);
};
