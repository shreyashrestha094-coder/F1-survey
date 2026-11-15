// langs: en, kr (source), zh, vi, mn
export const LANGS = [
  { code: 'kr', name: '한국어' },
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'mn', name: 'Монгол' },
]

const LIKERT_SCALE = {
  en: ['Strongly agree.', 'Agree.', 'Neither agree nor disagree.', 'Disagree.', 'Strongly disagree.'],
  kr: ['매우 그렇다.', '그렇다.', '보통이다.', '그렇지 않다.', '전혀 그렇지 않다.'],
  zh: ['非常同意。', '同意。', '一般。', '不同意。', '完全不同意。'],
  vi: ['Hoàn toàn đồng ý.', 'Đồng ý.', 'Bình thường.', 'Không đồng ý.', 'Hoàn toàn không đồng ý.'],
  mn: ['Маш зөвшөөрч байна.', 'Зөвшөөрч байна.', 'Дунд зэрэг.', 'Зөвшөөрөхгүй байна.', 'Огт зөвшөөрөхгүй.'],
}

const likert = () => LIKERT_SCALE

// Options are either a per-language object (Likert) or an array of
// per-language label objects. Returns a plain array of label objects.
export function getOptions(q, lang) {
  if (Array.isArray(q.options)) return q.options
  const list = q.options[lang] || q.options.en
  return list.map((label) => ({ label }))
}

export const questions = [
  {
    id: 'q1',
    en: 'How much do you know about F1 (Formula 1)?',
    kr: 'F1(포뮬러 1)에 대해 얼마나 알고 있나요?',
    zh: '您对F1（一级方程式）了解多少？',
    vi: 'Bạn biết nhiều về F1 (Công thức 1) đến đâu?',
    mn: 'F1 (Формула 1)-ийг та хэр сайн мэддэг вэ?',
    options: [
      {
        en: 'I watch F1 often and know it well.',
        kr: 'F1 경기를 자주 보고 잘 알고 있다.',
        zh: '经常观看F1比赛，非常了解。',
        vi: 'Tôi thường xuyên xem F1 và hiểu rõ về nó.',
        mn: 'Би F1-ийг тогтмол үзэж, сайн мэддэг.',
      },
      {
        en: 'I know F1 and watch it sometimes.',
        kr: 'F1을 알고 있고 가끔 본다.',
        zh: '知道F1，偶尔观看。',
        vi: 'Tôi biết F1 và thi thoảng xem.',
        mn: 'Би F1-ийг мэддэг, заримдаа үздэг.',
      },
      {
        en: 'I only know the name.',
        kr: '이름만 알고 있다.',
        zh: '只听说过名字。',
        vi: 'Tôi chỉ biết tên thôi.',
        mn: 'Зөвхөн нэрийг нь сонсчихсэн.',
      },
      {
        en: 'I know almost nothing about F1.',
        kr: 'F1에 대해 거의 모른다.',
        zh: '对F1几乎不了解。',
        vi: 'Tôi hầu như không biết gì về F1.',
        mn: 'F1-ийн тухай бараг юу ч мэддэггүй.',
      },
    ],
  },
  {
    id: 'q2',
    en: 'What are you most interested in F1?',
    kr: 'F1에서 가장 관심 있는 것은 무엇인가요?',
    zh: '您对F1最感兴趣的是什么？',
    vi: 'Điều bạn quan tâm nhất ở F1 là gì?',
    mn: 'F1-д хамгийн их сонирхдог зүйл нь юу вэ?',
    options: [
      { en: 'Driver skill', kr: '드라이버의 운전 실력', zh: '车手的驾驶技术', vi: 'Kỹ năng lái xe của tay đua', mn: 'Жолоочийн жолоодох ур чадвар' },
      { en: 'Car speed and technology', kr: '자동차의 속도와 기술', zh: '赛车的速度与技术', vi: 'Tốc độ và công nghệ của xe', mn: 'Машины хурд, технологи' },
      { en: 'Team strategy and race management', kr: '팀의 전략과 경기 운영', zh: '车队的策略与比赛运营', vi: 'Chiến thuật của đội và điều hành cuộc đua', mn: 'Багийн стратеги, уралдааны удирдлага' },
      { en: 'Team brand and history', kr: '팀 브랜드와 역사', zh: '车队品牌与历史', vi: 'Thương hiệu và lịch sử đội đua', mn: 'Багийн брэнд, түүх' },
      { en: 'Race results and winning', kr: '경기 결과와 우승', zh: '比赛结果与冠军', vi: 'Kết quả cuộc đua và chiến thắng', mn: 'Уралдааны үр дүн, түрүүлэлт' },
    ],
  },
  {
    id: 'q3',
    en: 'What do you think is most important to become the F1 World Champion?',
    kr: 'F1 월드 챔피언이 되는 데 가장 중요한 것은 무엇이라고 생각하나요?',
    zh: '您认为成为F1世界冠军最重要的是什么？',
    vi: 'Theo bạn, điều gì quan trọng nhất để trở thành nhà vô địch thế giới F1?',
    mn: 'F1-ийн дэлхийн аварга болоход хамгийн чухал зүйл юу гэж боддог вэ?',
    options: [
      { en: 'Driver skill', kr: '드라이버의 운전 실력', zh: '车手的驾驶技术', vi: 'Kỹ năng lái xe của tay đua', mn: 'Жолоочийн ур чадвар' },
      { en: 'Car performance', kr: '자동차의 성능', zh: '赛车的性能', vi: 'Hiệu suất của chiếc xe', mn: 'Машины чадвар' },
      { en: 'Team strategy', kr: '팀의 전략', zh: '车队的策略', vi: 'Chiến thuật của đội', mn: 'Багийн стратеги' },
      { en: 'Cooperation between the driver and the team', kr: '드라이버와 팀의 협력', zh: '车手与车队的合作', vi: 'Sự hợp tác giữa tay đua và đội', mn: 'Жолооч, багийн хамтын ажиллагаа' },
      { en: 'Luck and race conditions', kr: '운과 경기 상황', zh: '运气与比赛状况', vi: 'May mắn và tình huống cuộc đua', mn: 'Хийморь, уралдааны нөхцөл байдал' },
    ],
  },
  {
    id: 'q4',
    en: 'Which is more important: driver skill or car performance?',
    kr: '드라이버의 실력과 자동차의 성능 중 무엇이 더 중요하다고 생각하나요?',
    zh: '车手的驾驶技术和赛车性能，哪个更重要？',
    vi: 'Kỹ năng của tay đua và hiệu suất của xe, yếu tố nào quan trọng hơn?',
    mn: 'Жолоочийн ур чадвар, машины чадварын аль нь илүү чухал гэж боддог вэ?',
    options: [
      { en: 'Driver skill is much more important.', kr: '드라이버의 실력이 훨씬 더 중요하다.', zh: '车手技术重要得多。', vi: 'Kỹ năng tay đua quan trọng hơn nhiều.', mn: 'Жолоочийн ур чадвар хамаагүй илүү чухал.' },
      { en: 'Driver skill is a little more important.', kr: '드라이버의 실력이 조금 더 중요하다.', zh: '车手技术稍微重要。', vi: 'Kỹ năng tay đua quan trọng hơn một chút.', mn: 'Жолоочийн ур чадвар бага зэрэг илүү чухал.' },
      { en: 'Both are equally important.', kr: '두 가지가 비슷하게 중요하다.', zh: '两者同样重要。', vi: 'Cả hai đều quan trọng như nhau.', mn: 'Хоёулаа адилхан чухал.' },
      { en: 'Car performance is a little more important.', kr: '자동차의 성능이 조금 더 중요하다.', zh: '赛车性能稍微重要。', vi: 'Hiệu suất xe quan trọng hơn một chút.', mn: 'Машины чадвар бага зэрэг илүү чухал.' },
      { en: 'Car performance is much more important.', kr: '자동차의 성능이 훨씬 더 중요하다.', zh: '赛车性能重要得多。', vi: 'Hiệu suất xe quan trọng hơn nhiều.', mn: 'Машины чадвар хамаагүй илүү чухал.' },
    ],
  },
  {
    id: 'q5',
    en: 'Do you think a good driver can win with a low-performance car?',
    kr: '좋은 드라이버는 성능이 낮은 자동차로도 우승할 수 있다고 생각하나요?',
    zh: '您认为优秀的车手能用性能较差的赛车获胜吗？',
    vi: 'Bạn có nghĩ tay đua giỏi có thể chiến thắng với chiếc xe hiệu suất thấp không?',
    mn: 'Сайн жолооч чадвар багатай машинаар түрүүлж чадна гэж боддог уу?',
    options: likert(),
  },
  {
    id: 'q6',
    en: 'Do you think a good car can help an average driver get good results?',
    kr: '좋은 자동차는 운전 실력이 보통인 드라이버도 좋은 결과를 내게 할 수 있다고 생각하나요?',
    zh: '您认为好的赛车能帮助技术一般的车手取得好成绩吗？',
    vi: 'Bạn có nghĩ chiếc xe tốt có thể giúp tay đua trình độ trung bình đạt kết quả tốt không?',
    mn: 'Сайн машин дунд зэргийн жолоочид сайн үр дүн авчуулж чадна гэж боддог уу?',
    options: likert(),
  },
  {
    id: 'q7',
    en: "Do you think a driver's results can change after moving to another team?",
    kr: '드라이버가 다른 팀으로 옮기면 경기 결과가 달라질 수 있다고 생각하나요?',
    zh: '您认为车手换到其他车队后，比赛成绩会改变吗？',
    vi: 'Bạn có nghĩ kết quả của tay đua có thể thay đổi sau khi chuyển sang đội khác không?',
    mn: 'Жолооч өөр баг руу шилжвэл уралдааны үр дүн өөрчлөгдөж чадна гэж боддог уу?',
    options: likert(),
  },
  {
    id: 'q8',
    en: 'What is most important when you choose or support an F1 team?',
    kr: 'F1 팀을 선택하거나 응원할 때 가장 중요한 것은 무엇인가요?',
    zh: '选择或支持F1车队时，您最看重什么？',
    vi: 'Điều gì quan trọng nhất khi bạn chọn hoặc ủng hộ một đội F1?',
    mn: 'F1 багийг сонгох эсвэл дэмжихдээ хамгийн чухал зүйл нь юу вэ?',
    options: [
      { en: 'A driver I like', kr: '좋아하는 드라이버', zh: '喜欢的车手', vi: 'Tay đua mà tôi thích', mn: 'Дуртай жолооч' },
      { en: 'Car performance', kr: '자동차의 성능', zh: '赛车的性能', vi: 'Hiệu suất của xe', mn: 'Машины чадвар' },
      { en: "The team's winning record", kr: '팀의 우승 기록', zh: '车队的冠军纪录', vi: 'Thành tích chiến thắng của đội', mn: 'Багийн түрүүний амжилт' },
      { en: "The team's brand and history", kr: '팀 브랜드와 역사', zh: '车队品牌与历史', vi: 'Thương hiệu và lịch sử của đội', mn: 'Багийн брэнд, түүх' },
      { en: "The team's strategy", kr: '팀의 전략', zh: '车队的策略', vi: 'Chiến thuật của đội', mn: 'Багийн стратеги' },
      { en: 'Nothing in particular', kr: '특별히 중요하게 생각하는 것이 없다.', zh: '没有特别看重的。', vi: 'Không có điều gì đặc biệt.', mn: 'Онцгой чухал зүйл байхгүй.' },
    ],
  },
]
