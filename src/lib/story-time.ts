// Story time (typography-system.md TYP-17, DR-274): a relative time for 24 hours, then the
// date and the 24-hour time. The server renders the Dhaka date and time; a small inline
// script writes the reader's text in the browser time zone on load, every few minutes and
// when the tab gets focus.

/**
 * The text of one story time. `relative` off gives the date and time only (the server render).
 * Under 1 hour: `justNow`. 1 hour: `hourAgo`. 2 to 23 hours, rounded down: `hoursAgo`. Both have {hours}. Later: date
 * and time, with the year only for an earlier year than the current one. `timeZone` is
 * undefined in the browser, so it uses the reader's zone.
 *
 * It must not use anything outside its body: storyTimeScript inlines its source. That is why
 * the locale and the options are written here and not taken from lib/format.ts.
 */
export function storyTimeText(
  iso: string,
  lang: string,
  relative: boolean,
  timeZone: string | undefined,
  justNow: string,
  hourAgo: string,
  hoursAgo: string,
): string {
  const locale = lang === "bn" ? "bn-BD-u-nu-beng" : "en-GB";
  const date = new Date(iso);
  const hours = Math.floor((Date.now() - date.getTime()) / 3600000);
  if (relative && hours < 1) return justNow;
  if (relative && hours < 24) {
    return (hours === 1 ? hourAgo : hoursAgo).replace(
      "{hours}",
      new Intl.NumberFormat(locale).format(hours),
    );
  }
  const year = (d: Date) =>
    new Intl.DateTimeFormat("en", { year: "numeric", timeZone }).format(d);
  const day = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: lang === "bn" ? "long" : "short",
    year: year(date) === year(new Date()) ? undefined : "numeric",
    timeZone,
  }).format(date);
  const time = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(date);
  return day + ", " + time;
}

/** The server text: Dhaka date and time, no relative form. */
export function formatStoryTime(iso: string, lang: string): string {
  return storyTimeText(iso, lang, false, "Asia/Dhaka", "", "", "");
}

/**
 * Inline script for the end of <body>. It sets the reader text of every <time data-story-time>.
 * No library. The page language and its three strings are the only data.
 */
export function storyTimeScript(
  lang: string,
  justNow: string,
  hourAgo: string,
  hoursAgo: string,
): string {
  return `(function () {
  var text = ${storyTimeText.toString()};
  function run() {
    var list = document.querySelectorAll("time[data-story-time]");
    for (var i = 0; i < list.length; i++) {
      list[i].textContent = text(list[i].getAttribute("datetime"), ${JSON.stringify(lang)}, true, undefined, ${JSON.stringify(justNow)}, ${JSON.stringify(hourAgo)}, ${JSON.stringify(hoursAgo)});
    }
  }
  run();
  setInterval(run, 300000);
  addEventListener("focus", run);
})();`;
}
