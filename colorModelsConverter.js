const TRANSFORMATION_MATRIX = [
  [0.4124564, 0.3575761, 0.1804375],
  [0.2126729, 0.7151522, 0.0721750],
  [0.0193339, 0.1191920, 0.9503041],
]

/**
 *
 * @param { number[] } rgbPixel - array of [r, g, b] (0-255, 0-255, 0-255)
 * @return { number[] }  - array of linerized[r, g, b]
 */
const linearizeRGB = (rgbPixel) => rgbPixel
  .map(color => color / 255) // first scale devide by 255
  .map(v => v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92);

/**
 *
 * @param { number[] } lrgbPixel - linerized rgb pixel [lR, lG, lB];
 * @param { string[] } neededChannels - array of neededChannels channels names (x, y, z)
 * @return { number[] } - array of XYZ [x, y, z]
 */
const transformLRGBtoXYZ = (lrgbPixel, neededChannels = []) => {
  const matrices = [];
  if (neededChannels.length > 0) {
    neededChannels.forEach((channelName) => {
      if (channelName === 'x') matrices.push(TRANSFORMATION_MATRIX[0]);
      if (channelName === 'y') matrices.push(TRANSFORMATION_MATRIX[1]);
      if (channelName === 'z') matrices.push(TRANSFORMATION_MATRIX[2]);
    });
  } else {
    matrices.push(...TRANSFORMATION_MATRIX);
  }
  return matrices
    .map((transformationRow) =>
      transformationRow
        .reduce((acc, val, idx) => (acc + (val * lrgbPixel[idx])), 0)
    );
}

/**
 *
 * @param { Uint8ClampedArray } rgbaArr
 * @param { String[] } neededChannels - names of needed channels ('red', 'green', 'blue')
 * @return { number[] } rgb
 */
const rgbaToRgb = (rgbaArr, neededChannels = []) => {
  const res = [];
  const len = rgbaArr.length;
  let isRedNeeded;
  let isGreenNeeded;
  let isBlueNeeded;

  if (neededChannels.length > 0) {
    isRedNeeded = neededChannels.includes('red');
    isGreenNeeded = neededChannels.includes('green');
    isBlueNeeded = neededChannels.includes('blue');
  } else {
    isRedNeeded = true;
    isGreenNeeded = true;
    isBlueNeeded = true;
  }

  for (let i = 0; i < len; i += 4) {
    if (isRedNeeded) res.push(rgbaArr[i]); // red
    if (isGreenNeeded) res.push(rgbaArr[i + 1]); // green
    if (isBlueNeeded) res.push(rgbaArr[i + 2]); // blue
  }
  return res;
}
/**
 * https://www.image-engineering.de/library/technotes/958-how-to-convert-between-srgb-and-ciexyz
 * @param { ImageData } - ImageData to transform
 * @constructor
 */
const RGBToXYZ = ({ data }) => {
  const res = [];
  const rgb = rgbaToRgb(data);
  const len = rgb.length;
  for (let i = 0; i < len; i += 3) {
    const lrgbPixel = linearizeRGB([rgb[i], rgb[i + 1], rgb[i + 2]]);
    const xyz = transformLRGBtoXYZ(lrgbPixel);
    res.push(...xyz);
  }
  return res;
}

const labEstimate = (val) => val > 0.008856 ? Math.pow(val, 1/3) : 7.787 * val + 16 / 116;

const XYZtoLABpixel = (xyzPixel) => {
  const [x, y, z] =  xyzPixel;

  const gX = labEstimate(x / 0.954056);
  const gY = labEstimate(y / 1);
  const gZ = labEstimate(z / 1.088754);

  const l = 116 * gY - 16;
  const a = 500 * (gX - gY);
  const b = 200 * (gY - gZ);

  return [l, a, b];
}

/**
 *
 * @param {number[]} xyzArr - flat array of xyz pixels
 * @return {number[]} flat array of lab pixels
 */
const XYZtoLAB = (xyzArr) => {
  const len = xyzArr.length;
  const res = [];
  for (let i = 0; i < len; i += 3) {
    const x = xyzArr[i];
    const y = xyzArr[i + 1];
    const z = xyzArr[i + 2];

    const labArr = XYZtoLABpixel([x, y, z]);

    res.push(...labArr);
  }
  return res;
}

/**
 *
 * @param { ImageData } iData
 * @constructor
 */
const RGBToLAB = (iData) =>  XYZtoLAB(RGBToXYZ(iData));

export default {
  RGBToLAB,
  RGBToXYZ,
  XYZtoLAB,
}
