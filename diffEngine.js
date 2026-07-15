const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

/**
 * Compares two PNG images and generates a diff image + drift score.
 * If dimensions don't match, resizes the comparison canvas to the smaller common size.
 */
function compareImages(oldImagePath, newImagePath, outputDiffPath) {
  const oldImg = PNG.sync.read(fs.readFileSync(oldImagePath));
  const newImg = PNG.sync.read(fs.readFileSync(newImagePath));

  const width = Math.min(oldImg.width, newImg.width);
  const height = Math.min(oldImg.height, newImg.height);

  // Crop both images to the same common size so pixelmatch can compare them
  const oldCropped = cropImage(oldImg, width, height);
  const newCropped = cropImage(newImg, width, height);

  const diff = new PNG({ width, height });

  const numDiffPixels = pixelmatch(
    oldCropped.data,
    newCropped.data,
    diff.data,
    width,
    height,
    { threshold: 0.1 } // sensitivity: lower = more sensitive to small changes
  );

  fs.writeFileSync(outputDiffPath, PNG.sync.write(diff));

  const totalPixels = width * height;
  const driftPercentage = ((numDiffPixels / totalPixels) * 100).toFixed(2);

  return {
    numDiffPixels,
    totalPixels,
    driftPercentage: parseFloat(driftPercentage),
    width,
    height
  };
}

function cropImage(img, width, height) {
  const cropped = new PNG({ width, height });
  PNG.bitblt(img, cropped, 0, 0, width, height, 0, 0);
  return cropped;
}

module.exports = { compareImages };