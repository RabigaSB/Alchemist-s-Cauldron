const svgContainer = document.createElement('div');
svgContainer.classList.add('svg__container');

const bubble = document.createElement('div');
bubble.classList.add('svg__bubble');
const elem1 = document.createElement('div');
elem1.classList.add('svg__bubble-elem1');
const elem2 = document.createElement('div');
elem2.classList.add('svg__bubble-elem2');
const elem3 = document.createElement('div');
elem3.classList.add('svg__bubble-elem3');
const elem4 = document.createElement('div');
elem4.classList.add('svg__bubble-elem4');
bubble.appendChild(elem1);
bubble.appendChild(elem2);
bubble.appendChild(elem3);
bubble.appendChild(elem4);

const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svg.setAttribute('viewBox', '0 0 200 200');
svg.classList.add('svg');

svgContainer.appendChild(svg);
svgContainer.appendChild(bubble);

const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
clipPath.setAttribute('id', 'cauldronLiquidClip');
const clipEllipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
clipEllipse.setAttribute('cx', '100');
clipEllipse.setAttribute('cy', '80');
clipEllipse.setAttribute('rx', '65');
clipEllipse.setAttribute('ry', '25');
clipPath.appendChild(clipEllipse);
defs.appendChild(clipPath);

const backRim = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
backRim.setAttribute('cx', '100');
backRim.setAttribute('cy', '78');
backRim.setAttribute('rx', '68');
backRim.setAttribute('ry', '22');
backRim.setAttribute('fill', '#120c08');
backRim.setAttribute('stroke', '#3d2a19');
backRim.setAttribute('stroke-width', '4');

const liquidSurface = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
liquidSurface.setAttribute('cx', '100');
liquidSurface.setAttribute('cy', '80');
liquidSurface.setAttribute('rx', '65');
liquidSurface.setAttribute('ry', '20');
liquidSurface.setAttribute('fill', '#1b4d13');
const liquidSurfacePulse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
liquidSurfacePulse.setAttribute('cx', '100');
liquidSurfacePulse.setAttribute('cy', '80');
liquidSurfacePulse.setAttribute('rx', '60');
liquidSurfacePulse.setAttribute('ry', '16');
liquidSurfacePulse.setAttribute('fill', '#39ff14');
liquidSurfacePulse.setAttribute('opacity', '0.6');
liquidSurfacePulse.classList.add('svg__animate-pulse');

const cauldronBody = document.createElementNS('http://www.w3.org/2000/svg', 'path');
cauldronBody.setAttribute('d', 'M 30,80 Q 20,150 100,175 Q 180,150 170,80 Z');
cauldronBody.setAttribute('fill', 'url(#cauldronGrad)');
cauldronBody.setAttribute('stroke', '#2b1c10');
cauldronBody.setAttribute('stroke-width', '5');

const cauldronBodyDetail = document.createElementNS('http://www.w3.org/2000/svg', 'path');
cauldronBodyDetail.setAttribute('d', 'M 25,80 Q 15,145 95,170');
cauldronBodyDetail.setAttribute('fill', 'none');
cauldronBodyDetail.setAttribute('stroke', '#4a3421');
cauldronBodyDetail.setAttribute('stroke-width', '3');
cauldronBodyDetail.setAttribute('opacity', '0.5');

const frontRim = document.createElementNS('http://www.w3.org/2000/svg', 'path');
frontRim.setAttribute('d', 'M 28,78 Q 100,98 172,78 Q 100,68 28,78 Z');
frontRim.setAttribute('fill', '#24170e');
frontRim.setAttribute('stroke', '#4a3421');
frontRim.setAttribute('stroke-width', '3');

const emblemCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
emblemCircle.setAttribute('cx', '100');
emblemCircle.setAttribute('cy', '125');
emblemCircle.setAttribute('r', '18');
emblemCircle.setAttribute('fill', '#120b07');
emblemCircle.setAttribute('stroke', '#39ff14');
emblemCircle.setAttribute('stroke-width', '2');
emblemCircle.setAttribute('opacity', '0.8');

const emblemPolygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
emblemPolygon.setAttribute('points', '100,110 115,133 85,133');
emblemPolygon.setAttribute('fill', 'none');
emblemPolygon.setAttribute('stroke', '#39ff14');
emblemPolygon.setAttribute('stroke-width', '1.5');
emblemPolygon.setAttribute('opacity', '0.9');

const emblemInnerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
emblemInnerCircle.setAttribute('cx', '100');
emblemInnerCircle.setAttribute('cy', '125');
emblemInnerCircle.setAttribute('r', '6');
emblemInnerCircle.setAttribute('fill', 'none');
emblemInnerCircle.setAttribute('stroke', '#39ff14');
emblemInnerCircle.setAttribute('stroke-width', '1.5');

const gradDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

const cauldronGrad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
cauldronGrad.setAttribute('id', 'cauldronGrad');
cauldronGrad.setAttribute('x1', '0%');
cauldronGrad.setAttribute('y1', '0%');
cauldronGrad.setAttribute('x2', '100%');
cauldronGrad.setAttribute('y2', '100%');

const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
stop1.setAttribute('offset', '0%');
stop1.setAttribute('stop-color', '#2a1a0e');

const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
stop2.setAttribute('offset', '50%');
stop2.setAttribute('stop-color', '#140c06');

const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
stop3.setAttribute('offset', '100%');
stop3.setAttribute('stop-color', '#080402');

cauldronGrad.appendChild(stop1);
cauldronGrad.appendChild(stop2);
cauldronGrad.appendChild(stop3);
gradDefs.appendChild(cauldronGrad);

svg.appendChild(defs);
svg.appendChild(backRim);
svg.appendChild(liquidSurface);
svg.appendChild(liquidSurfacePulse);
svg.appendChild(cauldronBody);
svg.appendChild(cauldronBodyDetail);
svg.appendChild(frontRim);
svg.appendChild(emblemCircle);
svg.appendChild(emblemPolygon);
svg.appendChild(emblemInnerCircle);
svg.appendChild(gradDefs);

export function createSvgBubble(): HTMLDivElement {
  return svgContainer;
}
