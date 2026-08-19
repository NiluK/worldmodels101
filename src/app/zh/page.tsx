import Link from "next/link";
import { PredictionHero } from "@/components/prediction-hero";
import { CHAPTERS, TOTAL_MINUTES, chapterText } from "@/lib/chapters";
import { Subscribe } from "@/components/subscribe";
import { DefinitionMap } from "@/components/definition-map";
import { translate, localePath } from "@/lib/i18n";
import type { Metadata } from "next";

const t = (k: string, v?: Record<string, string | number>) => translate("zh", k, v);

export const metadata: Metadata = {
  title: "世界模型 101",
  description:
    "一份关于世界模型的免费交互式入门读物。这个词至少指五种不同的东西，本站先把它们分开，再讲底下的机制。",
  alternates: { canonical: "/zh", languages: { en: "/", "zh-Hans": "/zh" } },
};

function runtime(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h} 小时 ${m} 分钟` : `${m} 分钟`;
}

export default function HomeZh() {
  return (
    <>
      <section className="mx-auto max-w-[84rem] px-6 pb-10 pt-16 md:px-10 md:pt-24">
        <p className="label rise">{t("site.tagline")}</p>

        <h1 className="display rise mt-5 text-[clamp(2.6rem,9vw,6.5rem)]" style={{ animationDelay: "70ms" }}>
          世界模型
          <span className="ml-4 align-super font-mono text-[0.2em] tracking-[0.2em] text-imagine">101</span>
        </h1>

        <p
          className="rise mt-8 max-w-[34ch] text-[clamp(1.15rem,2.2vw,1.55rem)] leading-[1.6] text-ink md:max-w-[38ch]"
          style={{ animationDelay: "150ms" }}
        >
          {t("site.deck")}
        </p>

        <div className="rise mt-10 flex flex-wrap items-center gap-x-8 gap-y-4" style={{ animationDelay: "230ms" }}>
          <Link
            href={localePath("zh", `/chapters/${CHAPTERS[0].slug}`)}
            className="group inline-flex items-center gap-3 border border-ink bg-ink px-6 py-3 text-paper transition-colors hover:border-imagine hover:bg-imagine"
          >
            <span className="label !text-paper">{t("site.begin")}</span>
            <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
          </Link>
          <p className="label">{t("site.meta", { n: CHAPTERS.length, time: runtime(TOTAL_MINUTES) })}</p>
        </div>
      </section>

      <div className="rise mt-6" style={{ animationDelay: "300ms" }}>
        <PredictionHero />
      </div>

      <section id="map" className="mx-auto mt-28 max-w-[84rem] px-6 md:px-10">
        <div className="flex flex-col gap-4 border-b border-ink pb-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="display text-[clamp(1.7rem,4vw,2.8rem)] leading-tight">{t("home.mapTitle")}</h2>
          <p className="label max-w-[34ch] sm:text-right">{t("home.mapNote")}</p>
        </div>
        <div className="mt-8">
          <DefinitionMap />
        </div>
      </section>

      <section className="mx-auto mt-28 max-w-[84rem] px-6 md:px-10">
        <div className="grid gap-x-16 gap-y-10 md:grid-cols-[13rem_minmax(0,40rem)]">
          <p className="label md:pt-3">{t("home.premise")}</p>
          <div className="prose">
            <p className="text-[1.2rem] leading-[1.7]">
              四家实验室都会告诉你他们在做世界模型，而他们指的是四件互不相容的事。一家生成你可以操控的视频。一家产出机器人可以在里面训练的三维几何。一家学出一个紧凑的模拟器，并在上面做规划。还有一家预测嵌入向量，然后把预测扔掉。
            </p>
            <p>
              第五拨人根本不是在描述一个系统。当人们争论一个语言模型「有没有世界模型」时，他们讲的是在为别的任务训练出来的网络内部发现的结构，用的是可解释性证据，而不是任何你能运行的东西。两个人可以在每一个事实上都一致，却依然争执不下，因为一个问的是系统能不能模拟，另一个问的是网络内部有没有某种东西。
            </p>
            <p>
              命名的混乱底下是一个真实而古老的题目。它从卡尔曼滤波器一路延伸到 Schmidhuber 1990 年的论文，再到 Dreamer、JEPA、Genie 和 Marble。相关文献极其庞大，而且几乎全都是写给已经读过它们的人看的。
            </p>
            <p>
              所以：九章，每一章都围绕你可以亲手拨弄的东西。除了熟悉梯度和一点线性代数以外没有别的前置要求。第 1 章是这份指南；之后全部是机制，并且在重要的地方都会说明用的是哪一种定义。
            </p>
          </div>
        </div>
      </section>

      <section id="chapters" className="mx-auto mt-32 max-w-[84rem] px-6 md:px-10">
        <div className="flex items-baseline justify-between border-b border-ink pb-3">
          <h2 className="display text-[clamp(1.7rem,4vw,2.8rem)]">{t("home.contents")}</h2>
          <p className="label">共 {CHAPTERS.length} 章</p>
        </div>

        <ol>
          {CHAPTERS.map((c) => {
            const live = c.status === "ready" && c.slug === "what-people-mean";
            const text = chapterText("zh", c.slug);
            const Row = (
              <div
                className={`grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-5 py-8 md:grid-cols-[5rem_minmax(0,1fr)_11rem] md:gap-x-10 ${live ? "" : "opacity-55"}`}
              >
                <span className="display tnum text-[2.4rem] leading-none text-ink-faint transition-colors group-hover:text-imagine md:text-[3.2rem]">
                  {String(c.n).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="display text-[clamp(1.3rem,2.4vw,1.9rem)] leading-snug">{text.title}</h3>
                  <p className="mt-3 max-w-[52ch] text-ink-muted">{text.blurb}</p>
                  {text.demo && (
                    <p className="mt-4 flex max-w-[52ch] gap-2.5 font-mono text-[0.78rem] leading-relaxed text-imagine">
                      <span aria-hidden className="select-none">&#9656;</span>
                      <span>{text.demo}</span>
                    </p>
                  )}
                </div>
                <div className="col-start-2 mt-5 flex items-center gap-4 md:col-start-3 md:mt-1 md:justify-end">
                  <span className="label">{t("chapter.min", { n: c.minutes })}</span>
                  <span className="label">
                    {live ? t("chapter.readArrow") : c.status === "drafting" ? t("chapter.drafting") : t("chapter.soon")}
                  </span>
                </div>
              </div>
            );
            return (
              <li key={c.slug} className="border-b border-rule">
                {live ? (
                  <Link href={localePath("zh", `/chapters/${c.slug}`)} className="group block transition-colors hover:bg-paper-raised">
                    {Row}
                  </Link>
                ) : (
                  <div className="group cursor-default">{Row}</div>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <Subscribe />
    </>
  );
}
