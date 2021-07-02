

const getColumn = (d, w) => d % w;

const getRow = (d, w) => Math.floor(d / w);

{


  let iData;
  if (!imageData) {
    iData = util.getResizedData();
    drawSquares = true;
  } else {
    iData = imageData;
  }
  const { width, height } = iData;
// http://www.sciedu.ca/journal/index.php/air/article/view/17820/11327
const start = performance.now();
const lab = CMC.RGBToLAB(iData);
const labLen = lab.length;

const bsun = Number.parseInt(document.getElementById('sun').value);

//const bsun = 10; // 0.26 + (71.74 / (1 + ((solarElevationAngle / 7.47) ** 2.44)))
const brightnessMap = [];
const saturationMap = [];
const contrastMap = [];
const distanceMap = [];
for (let i = 0; i < labLen; i += 3) {
  const l = lab[i];
  const a = lab[i + 1];
  const b = lab[i + 2];
  brightnessMap.push(l / 100);
  saturationMap.push(
    // 1 - (Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2)) / 110 * Math.sqrt(2))
    (Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2)) / 110 * Math.sqrt(2))
  );
  distanceMap.push(1 - (Math.abs(b - bsun) / 100));
}

function rootMeanSquareContrast() {
  let rowRemained = false;
  let colRemained = false;
  const blockWidth = 4;

  const blocksOffset = 0;
  const leftEdge = blockWidth * blocksOffset;
  const rightEdge = width - blockWidth * blocksOffset;
  const topEdge = blockWidth * blocksOffset;
  const bottomEdge = height - blockWidth * blocksOffset;

  for (let row = topEdge; row < bottomEdge; row += blockWidth) {
    rowRemained = height - row < blockWidth ? height - row : false;
    for (let col = leftEdge; col < rightEdge; col += blockWidth) {
      colRemained = width - col < blockWidth ? width - col: false;
      const blockLuminanceArr = [];
      const flatArrayIndexes = [];
      const rowBlockWidth = rowRemained || blockWidth;
      const colBlockWidth = colRemained || blockWidth;

      for (let blockRow = 0; blockRow < rowBlockWidth; blockRow += 1) {
        for (let blockCol = 0; blockCol < colBlockWidth; blockCol += 1) {
          const rowDelta = (row + blockRow) * width;
          const colDelta = col + blockCol;
          const cell = rowDelta + colDelta;
          flatArrayIndexes.push(cell);
          const estimatedLuminance = (0.02874 * 255 * brightnessMap[cell]);
          blockLuminanceArr.push(estimatedLuminance);
        }
      }

      const blockLuminanceSum = blockLuminanceArr.reduce((sum, val) => sum + val);
      const blockLuminanceMean = blockLuminanceSum / blockLuminanceArr.length;
      const blockLuminanceMeanSum = blockLuminanceArr.reduce((sum, val) => (sum + ((val - blockLuminanceMean) ** 2)), 0);
      let rmsc = Math.sqrt(((1 / (16*16)) * blockLuminanceMeanSum) / Math.max(10, blockLuminanceMean));
      rmsc = rmsc <= 1 ? rmsc : 1;

      flatArrayIndexes.forEach((idx) => contrastMap[idx] = 1 - rmsc);
    }
  }
}

rootMeanSquareContrast();

addFrame(brightnessMap, 'brightnessMap');
addFrame(saturationMap, 'saturationMap');
// addFrame(contrastMap, 'contrastMap');
// addFrame(distanceMap, 'distanceMap');

const res = [];
let min = Number.MAX_VALUE;
let max = Number.MIN_VALUE;

for (let i = 0; i < labLen / 3; i += 1) {
  const s = saturationMap[i];
  const c = contrastMap[i];
  const d = distanceMap[i];
  const v = brightnessMap[i];
  const predict = v ** 2  * s /* * c * (d ** 2)*/ || 0;

  min = min < predict ? min : predict;
  max = max > predict ? max : predict;

  // if ((predict > 40 && predict < 50) || predict > 59)
  res.push(predict);
}
// console.log(performance.now() - start);
addFrame(res);

function addFrame(data) {
  // console.log(data);
  const rgbaArr = Uint8ClampedArray.from(data.map(r => hexToRgbA(perc2color(r, min, max))).flat());
  const {canvas, ctx} = util.addFrame(new ImageData(rgbaArr, width, height));
  console.log({
    min,
    max,
    data,
    len:data.length,
  })

  // const h4 = document.getElementById('right-log');
  // h4.textContent = data.length ? 'glared' : 'clear';
  // h4.textContent = JSON.stringify({data, len:data.length});
}
};

function perc2color(percIn, min = 0, max = 1) {
let perc = percIn; // 2
var base = (max - min); // 208 - -45 = 253

if (base === 0) { perc = 100; }
else {
  perc = (perc - min) / base * 100; //  = 18.57
}

var r, g, b = 0;
if(perc < 50) {
  r = 0;
  g = Math.round(5.1 * perc);
}
else {
  g = 0;
  r = Math.round(510 - 5.10 * perc);
}
var h = r * 0x10000 + g * 0x100 + b * 0x1;
const res = '#' + ('000000' + h.toString(16)).slice(-6)
if(res === '#-90100' || res === '#000NaN') console.log({percIn, perc, h, r, g, b, min, max});
return res;
}

function hexToRgbA(hex){
var c;
if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
  c= hex.substring(1).split('');
  if(c.length== 3){
    c= [c[0], c[0], c[1], c[1], c[2], c[2]];
  }
  c= '0x'+c.join('');
  return [(c>>16)&255, (c>>8)&255, c&255, 255];
}
console.log(hex)
throw new Error('Bad Hex');
}