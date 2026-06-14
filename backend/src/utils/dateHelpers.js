function daysFromNow(days){
  const d = new Date(); d.setDate(d.getDate()+days); return d;
}
module.exports = { daysFromNow };
