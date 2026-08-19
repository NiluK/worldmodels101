export const LOCALES = ["en", "zh"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_META: Record<Locale, { label: string; htmlLang: string; href: string }> = {
  en: { label: "English", htmlLang: "en", href: "/" },
  zh: { label: "简体中文", htmlLang: "zh-Hans", href: "/zh" },
};

/** Prefix a path for a locale. English stays at the root so live URLs do not move. */
export function localePath(locale: Locale, path = "/") {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === "en") return clean;
  return clean === "/" ? "/zh" : `/zh${clean}`;
}

export function localeFromPath(pathname: string): Locale {
  return pathname === "/zh" || pathname.startsWith("/zh/") ? "zh" : "en";
}

/**
 * UI strings. Chapter prose lives in MDX per locale; this covers the chrome and
 * everything baked into the interactive figures.
 *
 * Terminology decisions worth recording, because they are judgement calls a
 * reviewer should check rather than silent defaults:
 *   world model      世界模型   (established)
 *   Renderer         渲染器
 *   Simulator        仿真器     (not 模拟器, which commonly reads as "emulator")
 *   Dynamics Model   动力学模型
 *   Representation   表征模型   (表征 is standard for "representation" in ML)
 *   Implicit Model   内隐模型
 *   state            状态       observation 观测
 *   partial observability 部分可观测性
 *   latent           潜在／隐   embedding 嵌入
 *   horizon          预测步长
 */
type Dict = Record<string, string>;

const en: Dict = {
  "nav.chapters": "Chapters",
  "nav.about": "About",
  "nav.dark": "Dark",
  "nav.light": "Light",
  "nav.contents": "Contents",
  "nav.language": "Language",

  "site.tagline": "A free interactive primer",
  "site.deck":
    "The phrase means at least five different things, and the people using it rarely say which. Start with the map, then the machinery.",
  "site.begin": "Begin Chapter 01",
  "site.meta": "{n} chapters · {time} · no signup",
  "home.contents": "Contents",
  "home.mapTitle": "Five things people mean",
  "home.mapNote": "Start here if you arrived confused. It is the most common reason to.",
  "home.premise": "The premise",
  "home.audience": "Who this is for",
  "chapter.read": "{n} min read · interactive",
  "chapter.pdf": "PDF",
  "chapter.prev": "← Previous",
  "chapter.next": "Next →",
  "chapter.start": "Start",
  "chapter.atBeginning": "You’re at the beginning",
  "chapter.soon": "Soon",
  "chapter.drafting": "Drafting",
  "chapter.min": "{n} min",
  "chapter.readArrow": "Read →",

  "map.ordered": "Ordered by what they predict",
  "map.predicts": "Predicts {x}",
  "map.offAxis": "Off the axis",
  "map.notASystem": "Not a system you run",
  "map.moreConcrete": "More concrete",
  "map.whatGetsPredicted": "what gets predicted",
  "map.moreAbstract": "more abstract",
  "map.howToTell": "How to tell",
  "map.whoTalks": "Who talks this way",
  "map.coveredIn": "Covered in",
  "map.chapterN": "Chapter {n}",
  "map.idle":
    "Five things the phrase is used to mean. Four of them are systems you can run; the fifth is a claim about what is inside one. Pick any of them.",

  "spill.query": "“world model”",
  "spill.count": "5 incompatible answers",
  "spill.turnsOut": "Turns out to be",

  "land.hint": "Click the picture, then use the arrow keys or WASD.",
  "land.turn": "Turn right around, then come back. Is the marker where you left it?",
  "land.hold": "Hold the world",
  "land.left": "Turn left",
  "land.right": "Turn right",
  "land.fwd": "Walk forward",
  "land.back": "Walk back",

  "loop.idle": "Every definition is a specialist on one arc of this loop. Hover any of them.",
  "loop.intervene": "intervene · the world is now different",
  "loop.observe": "observe",
  "loop.infer": "infer",
  "loop.predict": "predict",
  "loop.choose": "choose",

  "eq.hoverHint": "Hover any part of the equation, or any phrase beneath it.",
  "eq.reading": "the chance of",
  "eq.given": ", given ",
  "eq.and": " and ",
  "roll.hint": "Only two things changed. Hover either side to see which.",

  "hz.horizon": "Horizon H",
  "hz.gapEvery": "gap, every step",
  "hz.steps": "Steps predicted",
  "hz.gapNow": "Gap right now",
  "hz.worst": "Worst gap so far",
  "hz.units": "{n} step-widths",
  "hz.v0": "Indistinguishable so far.",
  "hz.v1": "Drifting apart.",
  "hz.v2": "Visibly different futures.",
  "hz.v3": "One bounced a step late, and they never recovered.",

  "quiz.of": "{i} / {n}",
  "quiz.score": "Score {n}",
  "quiz.which": "Which definition is it?",
  "quiz.pick": "Pick one",
  "quiz.right": "Right",
  "quiz.wrong": "Not quite",
  "quiz.correct": "✓ correct",
  "quiz.yours": "✗ your answer",
  "quiz.yoursShort": "✗ yours",
  "quiz.next": "Next",
  "quiz.seeScore": "See score",
  "quiz.scored": "You scored",
  "quiz.again": "Again",
  "quiz.answer": "Answer",

  "video.nothing": "Nothing to watch",
  "video.talk": "Talk",
  "sub.title": "A note when the next chapter lands",
  "sub.body":
    "One email per chapter, which works out to roughly one a month. No newsletter, no digest. Unsubscribe link in every send, and the list is never shared.",
  "sub.email": "Email address",
  "sub.subscribe": "Subscribe",
  "sub.sending": "Sending",
  "foot.body":
    "A free primer on world models. Free to read, free to share, free to steal for your own course. Attribution appreciated.",
  "foot.about": "About",
  "foot.source": "Source",
};

const zh: Dict = {
  "nav.chapters": "章节",
  "nav.about": "关于",
  "nav.dark": "深色",
  "nav.light": "浅色",
  "nav.contents": "目录",
  "nav.language": "语言",

  "site.tagline": "免费的交互式入门读物",
  "site.deck":
    "这个词至少指五种不同的东西，而使用它的人很少说清是哪一种。先看这张地图，再看底下的机制。",
  "site.begin": "从第 01 章开始",
  "site.meta": "共 {n} 章 · {time} · 无需注册",
  "home.contents": "目录",
  "home.mapTitle": "人们说的五种意思",
  "home.mapNote": "如果你是带着困惑来的，从这里开始。多数人都是这样来的。",
  "home.premise": "前提",
  "home.audience": "写给谁看",
  "chapter.read": "阅读约 {n} 分钟 · 可交互",
  "chapter.pdf": "PDF",
  "chapter.prev": "← 上一章",
  "chapter.next": "下一章 →",
  "chapter.start": "起点",
  "chapter.atBeginning": "这里就是开头",
  "chapter.soon": "即将推出",
  "chapter.drafting": "撰写中",
  "chapter.min": "{n} 分钟",
  "chapter.readArrow": "阅读 →",

  "map.ordered": "按预测对象排序",
  "map.predicts": "预测{x}",
  "map.offAxis": "不在这条轴上",
  "map.notASystem": "它不是一个可运行的系统",
  "map.moreConcrete": "更具体",
  "map.whatGetsPredicted": "被预测的是什么",
  "map.moreAbstract": "更抽象",
  "map.howToTell": "如何分辨",
  "map.whoTalks": "谁这样用这个词",
  "map.coveredIn": "对应章节",
  "map.chapterN": "第 {n} 章",
  "map.idle":
    "这个词被用来指五种东西。其中四种是你可以运行的系统；第五种是关于系统内部有什么的断言。任选其一。",

  "spill.query": "“世界模型”",
  "spill.count": "5 个互不相容的答案",
  "spill.turnsOut": "其实属于",

  "land.hint": "先点击画面，然后用方向键或 WASD。",
  "land.turn": "转一整圈再回来。标记还在原处吗？",
  "land.hold": "保持世界不变",
  "land.left": "向左转",
  "land.right": "向右转",
  "land.fwd": "向前走",
  "land.back": "向后退",

  "loop.idle": "每一种定义都专精于这个回路上的某一段。把鼠标移到任意一个上面。",
  "loop.intervene": "干预 · 世界已经不同了",
  "loop.observe": "观测",
  "loop.infer": "推断",
  "loop.predict": "预测",
  "loop.choose": "选择",

  "eq.hoverHint": "把鼠标移到公式的任意部分，或下面的任意短语上。",
  "eq.reading": "在给定",
  "eq.given": "和",
  "eq.and": "的条件下，",
  "roll.hint": "只有两处发生了变化。把鼠标移到任意一边看看是哪两处。",

  "hz.horizon": "预测步长 H",
  "hz.gapEvery": "每一步的偏差",
  "hz.steps": "已预测步数",
  "hz.gapNow": "当前偏差",
  "hz.worst": "至今最大偏差",
  "hz.units": "{n} 个步宽",
  "hz.v0": "目前还看不出差别。",
  "hz.v1": "开始分道扬镳。",
  "hz.v2": "已经是明显不同的未来。",
  "hz.v3": "其中一个晚了一步弹起，从此再也没能回来。",

  "quiz.of": "{i} / {n}",
  "quiz.score": "得分 {n}",
  "quiz.which": "这属于哪一种定义？",
  "quiz.pick": "选择一项",
  "quiz.right": "答对了",
  "quiz.wrong": "还差一点",
  "quiz.correct": "✓ 正确答案",
  "quiz.yours": "✗ 你的选择",
  "quiz.yoursShort": "✗ 你选的",
  "quiz.next": "下一题",
  "quiz.seeScore": "查看得分",
  "quiz.scored": "你的得分",
  "quiz.again": "再来一次",
  "quiz.answer": "答案",

  "video.nothing": "没有可看的画面",
  "video.talk": "讲座",
  "sub.title": "新章节上线时通知我",
  "sub.body":
    "每章一封邮件，大约一个月一封。没有周报，没有摘要。每封都带退订链接，名单绝不外传。",
  "sub.email": "邮箱地址",
  "sub.subscribe": "订阅",
  "sub.sending": "发送中",
  "foot.body":
    "一份关于世界模型的免费入门读物。免费阅读，欢迎转发，也欢迎直接拿去用在你自己的课程里。注明出处即可。",
  "foot.about": "关于",
  "foot.source": "源码",
};

const DICTS: Record<Locale, Dict> = { en, zh };

export function translate(locale: Locale, key: string, vars?: Record<string, string | number>) {
  const raw = DICTS[locale][key] ?? DICTS.en[key] ?? key;
  if (!vars) return raw;
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
    raw,
  );
}
