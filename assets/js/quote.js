// Prices in toman. The listed package covers up to 12 slides; every extra slide adds 10%.
export function quoteForSlides(basePrice,slidesCount){
  const base=Number(basePrice),slides=Number(slidesCount);
  if(!Number.isSafeInteger(base)||base<0||!Number.isInteger(slides)||slides<1||slides>500)throw new Error('تعرفه یا تعداد اسلاید معتبر نیست.');
  const extraSlides=Math.max(0,slides-12);
  const total=Math.round(base*(1+extraSlides/10));
  if(!Number.isSafeInteger(total))throw new Error('مبلغ سفارش معتبر نیست.');
  const deposit=Math.round(total*.2);
  return {base,slides,extraSlides,total,deposit,remaining:total-deposit};
}
