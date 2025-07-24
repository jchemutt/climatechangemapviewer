import { defined } from "@/utils/core";

import { parseISO, endOfMonth, format as dateFormat } from "date-fns";

/**
 * Formats a date according to the locale if provided, otherwise in a dd/mm/yyyy format.
 *
 * @param {Date} d the date to format
 * @param {Locale} [locale] the locale to use for formatting
 * @returns {string} A formatted date.
 */
export function formatDate(d, locale) {
  if (defined(locale)) {
    return d.toLocaleDateString(locale);
  }
  return [pad(d.getDate()), pad(d.getMonth() + 1), d.getFullYear()].join("/");
}

/**
 * Formats the time according to the locale if provided, otherwise in a hh:mm:ss format.
 *
 * @param {Date} d the date to format
 * @param {Locale} [locale] the locale to use for formatting
 * @returns {string} A formatted time.
 */
export function formatTime(d, locale) {
  if (defined(locale)) {
    return d.toLocaleTimeString(locale);
  }
  return [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(
    ":"
  );
}

/**
 * Combines {@link #formatDate} and {@link #formatTime}.
 *
 * @param {Date} d the date to format
 * @param {Locale} [locale] the locale to use for formatting
 * @returns {string} A formatted date and time with a comma separating them.
 */
export function formatDateTime(d, locale) {
  return formatDate(d, locale) + ", " + formatTime(d, locale);
}

/**
 * Puts a leading 0 in front of a number of it's less than 10.
 *
 * @param {number} s A number to pad
 * @returns {string} A string representing a two-digit number.
 */
function pad(s) {
  return s < 10 ? "0" + s : `${s}`;
}

const getOrdinalNum = (number) => {
  let selector;

  if (number <= 0) {
    selector = 4;
  } else if ((number > 3 && number < 21) || number % 10 > 3) {
    selector = 0;
  } else {
    selector = number % 10;
  }

  return number + ["th", "st", "nd", "rd", ""][selector];
};

export function getPentadFromDateString(date) {
  let dateObj;

  if (typeof date === "string") {
    dateObj = parseISO(date);
  } else {
    dateObj = date;
  }

  const lastDayOfMonth = endOfMonth(dateObj).getDate();

  const day = dateObj.getDate();

  if (day <= 5) {
    return [1, "1-5th", 1];
  }

  if (day <= 10) {
    return [2, "6-10th", 6];
  }

  if (day <= 15) {
    return [3, "11-15th", 11];
  }

  if (day <= 20) {
    return [4, "16-20th", 16];
  }

  if (day <= 25) {
    return [4, "21-25th", 21];
  }
  return [6, `26-${getOrdinalNum(lastDayOfMonth)}`, 26];
}

export function getDekadFromString(date) {
  let dateObj;

  if (typeof date === "string") {
    dateObj = parseISO(date);
  } else {
    dateObj = date;
  }

  const lastDayOfMonth = endOfMonth(dateObj).getDate();

  const day = dateObj.getDate();

  if (day <= 10) {
    return [1, "1-10th", 1];
  }

  if (day <= 20) {
    return [2, "11-20th", 11];
  }

  return [3, `21-${getOrdinalNum(lastDayOfMonth)}`, 21];
}

// if day <= 5:
// next_pentad_start = datetime(date.year, date.month, 6)
// next_pentad_num = 2
// elif day <= 10:
// next_pentad_start = datetime(date.year, date.month, 11)
// next_pentad_num = 3
// elif day <= 15:
// next_pentad_start = datetime(date.year, date.month, 16)
// next_pentad_num = 4
// elif day <= 20:
// next_pentad_start = datetime(date.year, date.month, 21)
// next_pentad_num = 5
// elif day <= 25:
// next_pentad_start = datetime(date.year, date.month, 26)
// next_pentad_num = 6
// else:
// next_pentad_start = date + relativedelta.relativedelta(months=1, day=1)
// next_pentad_num = 1

export function dFormatter(date, format, asPeriod) {
  let dateObj;

  if (typeof date === "string") {
    dateObj = parseISO(date);
  } else {
    dateObj = date;
  }

  let formated = dateFormat(dateObj, format);

  if (asPeriod) {
    if (asPeriod === "pentadal") {
      const [pentad, duration] = getPentadFromDateString(date);

      formated = `${formated} - P${pentad} ${duration}`;
    } else if (asPeriod === "dekadal") {
      const [dekad, duration] = getDekadFromString(date);

      formated = `${formated} - D${dekad} ${duration}`;
    }
  }

  return formated;
}



function formatDynamicSeasonLabel(timeStr) {
  if (!timeStr?.startsWith("dynamic-iso-")) return timeStr;

  try {
    const timestamps = timeStr.replace("dynamic-iso-", "").split(",");
    const monthAbbrs = timestamps
      .map(t => {
        const date = new Date(t.trim());
        return isNaN(date) ? "" : date.toLocaleString("en-US", { month: "short" }).charAt(0); // First letter
      })
      .join("");

    return monthAbbrs || "Custom Season";
  } catch (e) {
    return "Custom Season";
  }
}


export function formatSeasonalTimeLabel(isoDateStr) {
  const date = new Date(isoDateStr);
  if (isNaN(date)) return isoDateStr;

  const month = date.getUTCMonth() + 1; // Months are 0-based
  const year = date.getUTCFullYear();

  let season;
  if (month === 2) season = "MAM";
  else if (month === 5) season = "JJAS";
  else if (month === 9) season = "OND";
  else return isoDateStr; // fallback to raw date if unknown

  let range;
  if (year === 2099) range = "2071–2100";
  else if (year === 2049) range = "2021–2050";
  else if (year === 2013) range = "1985–2014";
  else return `${season} ${year}`; // fallback to just season + year

  return `${season} ${range}`;
}


const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export function formatTimeLabelByTimeStep(isoDateStr, timeStep = "seasonal") {
   if (isoDateStr.startsWith("dynamic-iso-")) {
    return formatDynamicSeasonLabel(isoDateStr);
  }
  const date = new Date(isoDateStr);
  if (isNaN(date)) return isoDateStr;

  const month = date.getUTCMonth(); // 0-based
  const year = date.getUTCFullYear();

  if (timeStep === "monthly") {
    return `${MONTH_NAMES[month]}`; // e.g., Feb 2021
  }

  // Seasonal logic
  let season;
  if (month === 1) season = "MAM";      // Feb
  else if (month === 4) season = "JJAS"; // May
  else if (month === 8) season = "OND";  // Sep
  else return isoDateStr;

  let range;
  if (year === 2099) range = "2071–2100";
  else if (year === 2049) range = "2021–2050";
  else if (year === 2013) range = "1985–2014";
  else return `${season} ${year}`;

  return `${season}`;
}
