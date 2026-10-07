export const PORTAL_URL = 'https://epay.unionbankofindia.bank.in/kvfee/default.aspx';
export const PORTAL_HOST = 'epay.unionbankofindia.bank.in';

/**
 * Build JS injected after the portal loads. It fills the child's details only; the captcha
 * (#txtCaptcha) and the Login button (#imgLogin) are always left to the parent.
 *
 * Field IDs were read from the live portal (Oct 2026): #txtStudent = Student Unique ID,
 * #txtDateofBirth = DOB as DD/MM/YYYY. Heuristics stay as fallbacks if the page changes.
 */
const SELECTORS = {
  uniqueId: ['#txtStudent', 'input[id*="unique" i]', 'input[id*="student" i]'],
  dob: ['#txtDateofBirth', 'input[id*="dob" i]', 'input[id*="birth" i]'],
};

export function buildFillScript(uniqueId: string, dobIso: string): string {
  const [y, m, d] = dobIso.split('-');
  const payload = JSON.stringify({ uniqueId, dob: { iso: dobIso, dmy: `${d}/${m}/${y}` }, SELECTORS });
  return `(function(){
    var p = ${payload};
    function find(list){ for (var i=0;i<list.length;i++){ var el=document.querySelector(list[i]); if(el) return el; } return null; }
    function setVal(el, v){
      var setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
      setter.call(el, v);
      el.dispatchEvent(new Event('input',{bubbles:true}));
      el.dispatchEvent(new Event('change',{bubbles:true}));
    }
    var u = find(p.SELECTORS.uniqueId), b = find(p.SELECTORS.dob);
    if (u) setVal(u, p.uniqueId);
    if (b) setVal(b, b.type === 'date' ? p.dob.iso : p.dob.dmy);
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'autofill', uniqueId: !!u, dob: !!b}));
  })(); true;`;
}

/** Heuristic: detect a receipt/success page and pull amount + txn id out of the visible text. */
export const RECEIPT_SCRIPT = `(function(){
  var t = document.body ? document.body.innerText : '';
  if (/success|receipt|transaction id/i.test(t)) {
    var txn = (t.match(/(?:transaction|txn|reference)\\s*(?:id|no\\.?)?\\s*[:\\-]?\\s*([A-Za-z0-9]{6,})/i)||[])[1];
    var amt = (t.match(/(?:amount|rs\\.?|₹)\\s*[:\\-]?\\s*([0-9,]+(?:\\.[0-9]{1,2})?)/i)||[])[1];
    if (txn) window.ReactNativeWebView.postMessage(JSON.stringify({type:'receipt', txn: txn, amount: amt ? parseFloat(amt.replace(/,/g,'')) : 0}));
  }
})(); true;`;
