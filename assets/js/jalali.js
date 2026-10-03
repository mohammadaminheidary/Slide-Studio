import {digits} from './api.js';
const leapResidues=new Set([1,5,9,13,17,22,26,30]);
export function normalizeJalaliDate(value){
  const raw=digits(value).trim();
  const match=raw.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/)||raw.match(/^(\d{4})(\d{2})(\d{2})$/);
  if(!match)return '';
  const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);
  if(year<1300||year>1500||month<1||month>12||day<1)return '';
  const max=month<=6?31:month<=11?30:leapResidues.has(year%33)?30:29;
  if(day>max)return '';
  return `${year}/${String(month).padStart(2,'0')}/${String(day).padStart(2,'0')}`;
}
export function todayJalali(){
  try{
    const parts=new Intl.DateTimeFormat('en-US-u-ca-persian',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const get=t=>parts.find(p=>p.type===t)?.value||'';
    const canonical=normalizeJalaliDate(`${get('year')}/${get('month')}/${get('day')}`);
    return canonical.replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
  }catch{return ''}
}
