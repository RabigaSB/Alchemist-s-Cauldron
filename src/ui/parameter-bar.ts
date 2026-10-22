import type { IRecipeRange } from '../data/recipes';

export interface IParameterBar {
  element: HTMLElement;
  update: (value: number, target: IRecipeRange) => void;
}

export function createParameterBar(
  label: string,
  target: IRecipeRange,
  minimum: number,
  maximum: number,
): IParameterBar {
  const bar = document.createElement('section');
  bar.className = 'parameter-bar';

  const heading = document.createElement('div');
  heading.className = 'parameter-bar__heading';
  bar.appendChild(heading);

  const name = document.createElement('h3');
  name.className = `parameter-bar__name parameter-bar__name-${label.toLowerCase().replace(/\s+/g, '-')}`;
  name.textContent = label;
  heading.appendChild(name);

  const valueLabel = document.createElement('output');
  valueLabel.className = 'parameter-bar__value';
  valueLabel.value = '0';
  heading.appendChild(valueLabel);

  const track = document.createElement('div');
  track.className = 'parameter-bar__track';
  track.setAttribute('role', 'meter');
  track.setAttribute('aria-label', `${label}; target ${target.min} to ${target.max}`);
  track.setAttribute('aria-valuemin', `${minimum}`);
  track.setAttribute('aria-valuemax', `${maximum}`);
  track.setAttribute('aria-valuenow', '0');
  bar.appendChild(track);

  const targetZone = document.createElement('span');
  targetZone.className = 'parameter-bar__target';
  targetZone.setAttribute('aria-hidden', 'true');
  track.appendChild(targetZone);

  if (minimum < 0 && maximum > 0) {
    const zeroMarker = document.createElement('span');
    zeroMarker.className = 'parameter-bar__zero';
    zeroMarker.style.left = `${toPercent(0, minimum, maximum)}%`;
    zeroMarker.setAttribute('aria-hidden', 'true');
    track.appendChild(zeroMarker);
  }

  const valueMarker = document.createElement('span');
  valueMarker.className = 'parameter-bar__marker';
  valueMarker.setAttribute('aria-hidden', 'true');
  track.appendChild(valueMarker);

  const rangeLabel = document.createElement('p');
  rangeLabel.className = 'parameter-bar__range';
  bar.appendChild(rangeLabel);

  function update(value: number, currentTarget: IRecipeRange): void {
    const clampedValue = Math.min(maximum, Math.max(minimum, value));
    const isInTarget = value >= currentTarget.min && value <= currentTarget.max;

    valueLabel.value = `${value}`;
    targetZone.style.left = `${toPercent(currentTarget.min, minimum, maximum)}%`;
    targetZone.style.width = `${toPercent(currentTarget.max - currentTarget.min, 0, maximum - minimum)}%`;
    track.setAttribute('aria-valuenow', `${value}`);
    track.setAttribute(
      'aria-label',
      `${label}; target ${currentTarget.min} to ${currentTarget.max}`,
    );
    valueMarker.style.left = `${toPercent(clampedValue, minimum, maximum)}%`;
    bar.classList.toggle('parameter-bar--in-range', isInTarget);
    rangeLabel.textContent = `Target: ${currentTarget.min} to ${currentTarget.max}`;
  }

  update(0, target);

  return { element: bar, update };
}

function toPercent(value: number, minimum: number, maximum: number): number {
  return ((value - minimum) / (maximum - minimum)) * 100;
}
