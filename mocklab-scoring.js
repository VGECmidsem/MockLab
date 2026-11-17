/* Self-contained scoring utility. Scores only fully keyed sets. */
'use strict';
window.MockLabScoring = Object.freeze({
 score(questions,answers,marking={correct:4,wrong:-1}){
  if(!Array.isArray(questions)||!questions.length||!Array.isArray(answers)||questions.length!==answers.length) return null;
  if(!questions.every(q=>/^[A-F]$/.test(q.correctAnswer||''))) return null;
  const correct=Number(marking.correct),wrong=Number(marking.wrong);
  if(!Number.isFinite(correct)||!Number.isFinite(wrong))return null;
  let right=0,incorrect=0,skipped=0;
  const breakdown=questions.map((q,i)=>{
   const given=answers[i]||null,expected=q.correctAnswer;
   const outcome=!given?'skipped':given===expected?'correct':'incorrect';
   if(outcome==='correct')right++;else if(outcome==='incorrect')incorrect++;else skipped++;
   return {question:i+1,selected:given,correctAnswer:expected,outcome,marks:outcome==='correct'?correct:outcome==='incorrect'?wrong:0};
  });
  const total=breakdown.reduce((sum,b)=>sum+b.marks,0);
  return {right,incorrect,skipped,total,maxMarks:questions.length*correct,accuracy:(right+incorrect)?100*right/(right+incorrect):0,breakdown,marking:{correct,wrong,unanswered:0}};
 }
});
