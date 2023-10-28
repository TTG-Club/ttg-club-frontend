/* eslint-disable no-param-reassign */
export const redrawToken = (
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  borderImage: HTMLImageElement,
  bgLayout: HTMLImageElement,
  image: HTMLImageElement | null,
  scale: number,
  imageOptions = { width: 0, height: 0, x: 0, y: 0 }
) => {
  const borderScaleFactor = Math.min(
    canvas.width / borderImage.width,
    canvas.height / borderImage.height
  );

  context.save();
  context.beginPath();

  context.arc(
    canvas.width / 2,
    canvas.height / 2,
    canvas.width / 2.4,
    0,
    Math.PI * 2
  );
  context.clip();

  if (image) {
    imageOptions.width = image.width * scale;
    imageOptions.height = image.height * scale;
    imageOptions.x = (canvas.width - imageOptions.width) / 2;
    imageOptions.y = (canvas.height - imageOptions.height) / 2;
  }

  const borderWidth = borderImage.width * borderScaleFactor;
  const borderHeight = borderImage.height * borderScaleFactor;

  const x = (canvas.width - borderWidth) / 2;
  const y = (canvas.height - borderHeight) / 2;

  // context.clearRect(0, 0, canvas?.width, canvas.height);

  context.drawImage(bgLayout, 0, 0, canvas?.width, canvas?.height);

  if (image) {
    context.drawImage(
      image,
      imageOptions.x,
      imageOptions.y,
      image.width * scale,
      image.height * scale
    );
  }

  context.restore();

  context.drawImage(borderImage, x, y, borderWidth, borderHeight);
};
