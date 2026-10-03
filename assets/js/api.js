import {API_URL,API_READY} from './config.js';
// Apps Script's JSON response allows cross-origin reads. A text/plain POST avoids a CORS preflight.
const READ_ACTIONS=new Set(['getCapabilities','getPricing','getPortfolio','getSettings','getOrder','getInvoice','getDeliveries','getOrders','getPayments','getCustomers','getInvoices','dashboard']);
function timeoutFor(action){
  if(action==='uploadDelivery'||action==='downloadDelivery')return 120000;
  if(action==='login'||READ_ACTIONS.has(action))return 60000;
  return 90000;
}
export async function request(action,data={},token=''){
  if(!API_READY)throw new Error('اتصال سایت هنوز تنظیم نشده است. نشانی Google Apps Script را در فایل تنظیمات وارد کنید.');
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutFor(action));
  try{
    const response=await fetch(API_URL,{
      method:'POST',mode:'cors',credentials:'omit',redirect:'follow',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({action,data,token}),signal:controller.signal
    });
    if(!response.ok)throw new Error('پاسخ سرور دریافت نشد ('+response.status+').');
    let result;
    try{result=await response.json()}catch{throw new Error('پاسخ سرور قابل خواندن نیست. استقرار Google Apps Script را بررسی کنید.')}
    if(!result.success)throw new Error(result.message||'درخواست انجام نشد.');
    return result.data;
  }catch(error){
    if(error.name==='AbortError')throw new Error('پاسخ Google Apps Script در مهلت مقرر نرسید. دسترسی مرورگر به script.google.com و script.googleusercontent.com را بررسی کنید.'+(READ_ACTIONS.has(action)||action==='login'?'':' اگر درخواست ثبت ارسال کرده‌اید، پیش از ارسال دوباره نتیجه را بررسی کنید.'));
    if(error instanceof TypeError)throw new Error('اتصال مرورگر به Google Apps Script برقرار نشد. دسترسی به script.google.com و script.googleusercontent.com را بررسی کنید.');
    throw error;
  }finally{clearTimeout(timer)}
}
export const money=n=>new Intl.NumberFormat('fa-IR').format(Number(n)||0)+' تومان';
export const digits=s=>String(s??'').replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)));
export const cleanPhone=s=>digits(s).replace(/[^0-9]/g,'');
export const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const safeImage=s=>{try{const u=new URL(s);return ['https:','http:'].includes(u.protocol)?u.href:''}catch{return ''}};
export function busy(button,active,label='در حال انجام...'){if(active){button.dataset.label=button.textContent;button.disabled=true;button.textContent=label}else{button.disabled=false;button.textContent=button.dataset.label||button.textContent}}
