import test from 'node:test';
import assert from 'node:assert/strict';
import {createState, choosePath, chooseTopic, submitAnswer, makeArticle, questions} from './model.js';
test('경험 입력 경로: 공백 거부, 중간 완성, 서로 다른 답변 반영',()=>{
  const s=createState(); assert.equal(makeArticle(s),null); choosePath(s,true);
  assert.equal(submitAnswer(s,'   '),false); assert.equal(makeArticle(s),null);
  submitAnswer(s,'성수동 카페'); const a=makeArticle(s); assert.equal(a.sections.length,1); assert.equal(a.sections[0].text,'성수동 카페');
  const other=createState(); choosePath(other,true); submitAnswer(other,'제주 미술관'); assert.notDeepEqual(makeArticle(other),a);
});
test('주제 추천 경로: 선택만으로 글 생성 불가, 전체 대화 후 완료',()=>{
  const s=createState(); choosePath(s,false); assert.equal(s.stage,'topics');chooseTopic(s,'전시 관람');assert.equal(makeArticle(s),null);
  for(let i=0;i<questions.length;i++) assert.equal(submitAnswer(s,`나의 답변 ${i}`),true);
  assert.equal(s.stage,'done');assert.equal(submitAnswer(s,'추가 답변'),false);
  const a=makeArticle(s); assert.match(a.title,/전시 관람/);assert.equal(a.sections.length,questions.length); assert.equal(a.sections.at(-1).text,'나의 답변 5');
});
