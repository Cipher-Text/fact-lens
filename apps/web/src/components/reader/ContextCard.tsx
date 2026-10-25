import { Telescope } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ArticleContext } from "@/content";

import type { ReaderStrings } from "@/i18n";

/**
 * The optional news context, inside the article body before the first section: short
 * one-liners in one column, every part shown at once (no accordion, no tabs). A shadcn Card, restyled to the design system.
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
        {/* One column of short parts: why and background. */}
        <CardContent className="rd-context__list">
          <div className="rd-context__part">
            <h3 className="rd-context__label">{t.tabWhy}</h3>
            <p>{context.why}</p>
          </div>
          {context.background ? (
            <div className="rd-context__part">
              <h3 className="rd-context__label">{t.tabBackground}</h3>
              <p>{context.background}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
