export const topics = ['카페 방문', '맛집 탐방', '전시 관람', '여행지 방문'];
export const questions = [
  ['나의 방문 이야기', '어디에 다녀오셨나요? 장소와 어떤 경험이었는지 편하게 들려주세요.'],
  ['나만의 발견', '다른 곳과 비교해 특별하거나 새롭게 느낀 점이 있었나요?'],
  ['방문 전 알아둘 점', '방문을 고민하는 사람이 가장 궁금해할 정보는 무엇일까요? 가격이나 분위기도 좋아요.'],
  ['직접 경험한 팁', '직접 다녀와서 알게 된 팁이나 추천 방법이 있나요?'],
  ['가장 기억에 남는 순간', '가장 기억에 남는 장면을 구체적으로 들려주세요. 무엇을 보고, 느끼셨나요?'],
  ['이런 분께 추천해요', '이곳을 누구에게 추천하고 싶나요? 함께 이야기하고 싶은 이유도 알려주세요.'],
];
export function createState() { return { stage: 'start', topic: '', answers: [] }; }
export function choosePath(state, hasExperience) { if(state.stage !== 'start') return; state.stage = hasExperience ? 'chat' : 'topics'; }
export function chooseTopic(state, topic) { if(state.stage !== 'topics' || !topics.includes(topic)) return; state.topic = topic; state.stage = 'chat'; }
export function submitAnswer(state, text) {
  const answer = text.trim();
  if(state.stage !== 'chat' || !answer) return false;
  state.answers.push(answer);
  if(state.answers.length === questions.length) state.stage = 'done';
  return true;
}
export function makeArticle(state) {
  if(!state.answers.length) return null;
  return { title: state.topic ? `${state.topic}, 나의 방문 이야기` : `${state.answers[0].split('\n')[0].slice(0, 45)} — 나의 기록`, sections: state.answers.map((answer, i) => ({heading: questions[i][0], text: answer})) };
}
