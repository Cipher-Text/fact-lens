import { Telescope } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ArticleContext } from "@/content/reader";

import type { ReaderStrings } from "./strings";

/**
 * The optional news context, inside the article body before the first section. Every part
 * shows at once: no accordion and no tabs. A shadcn Card, restyled to the design system.
 */
export function ContextCard({
  context,
  t,
}: {
  context: ArticleContext;
  t: ReaderStrings;
}) {
  return (
    <section
      id="context"
      className="rd-context"
      aria-labelledby="rd-context-title"
    >
      <Card className="rd-context__card">
        <CardHeader className="rd-context__head">
          <span className="rd-context__icon" aria-hidden="true">
            <Telescope />
          </span>
          <CardTitle>
            <h2 id="rd-context-title" className="rd-context__title">
              {t.context}
            </h2>
          </CardTitle>
          <CardDescription className="rd-context__teaser">
            {context.teaser}
          </CardDescription>
        </CardHeader>
        <CardContent className="rd-context__grid">
          <div className="rd-context__col">
            <div className="rd-context__part">
              <h3 className="rd-context__label">{t.tabWhy}</h3>
              {context.why.map((text) => (
                <p key={text}>{text}</p>
              ))}
            </div>
            {context.background ? (
              <div className="rd-context__part">
                <h3 className="rd-context__label">{t.tabBackground}</h3>
                {context.background.map((text) => (
                  <p key={text}>{text}</p>
                ))}
              </div>
            ) : null}
          </div>
          <div className="rd-context__col">
            {context.timeline ? (
              <div className="rd-context__part">
                <h3 className="rd-context__label">{t.tabTimeline}</h3>
                <ol className="rd-timeline">
                  {context.timeline.map((item) => (
                    <li key={item.date}>
                      <span className="rd-timeline__date">{item.date}</span>
                      <p>{item.text}</p>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
            {context.numbers ? (
              <div className="rd-context__part">
                <h3 className="rd-context__label">{t.tabNumbers}</h3>
                <div className="rd-numbers">
                  {context.numbers.map((item) => (
                    <div className="rd-number" key={item.label}>
                      <strong>{item.value}</strong>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
