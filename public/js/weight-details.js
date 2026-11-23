export const weightBasisLabels={total:'Загальна вага',perHand:'На одну руку / гантель',perSide:'На одну сторону тренажера'};
export function weightDetails(value={}) {
  const weightBasis=value.weightBasis || 'total';
  if (!Object.hasOwn(weightBasisLabels,weightBasis)) throw Error('Обери, як записана вага.');
  const weightSides=weightBasis === 'total'?1:Number(value.weightSides ?? 2);
  if (![1,2].includes(weightSides)) throw Error('Обери одну або дві руки / сторони.');
  return {weightBasis,weightSides};
}
export function validWeightDetails(value) {
  if (value.weightBasis === undefined && value.weightSides === undefined) return true;
  if (!Object.hasOwn(weightBasisLabels,value.weightBasis)) return false;
  return value.weightBasis === 'total'?value.weightSides === 1:[1,2].includes(value.weightSides);
}
export function totalWeight(value) {
  if (value.weightUnknown) return 0;
  return Number(value.weight || 0)*weightDetails(value).weightSides;
}
export function sameWeightDetails(a,b) {
  const left=weightDetails(a),right=weightDetails(b);
  return left.weightBasis === right.weightBasis && left.weightSides === right.weightSides;
}
export function weightDetailsLabel(value) {
  const {weightBasis,weightSides}=weightDetails(value);
  if (weightBasis === 'total') return '';
  const unit=weightBasis === 'perHand'?'на руку':'на сторону';
  const count=weightBasis === 'perHand'?(weightSides === 2?'2 руки':'1 рука'):(weightSides === 2?'2 сторони':'1 сторона');
  return `${unit} · ${count}${weightSides === 2 && !value.weightUnknown?`, разом ${Number(totalWeight(value).toFixed(2))} кг`:''}`;
}
