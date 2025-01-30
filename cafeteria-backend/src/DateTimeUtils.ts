export enum DateTimeFormat {
  ISO_DATE = 0,
  US_DATE = 1,
  SHORT_DESC = 2,
  SHORT_DAY_OF_WEEK_DESC = 4,
  OTHER = 8,
  DAY_AND_MONTH = 16,
}

export enum DaysOfWeek {
  SUNDAY = 1,
  MONDAY = 2,
  TUESDAY = 4,
  WEDNESDAY = 8,
  THURSDAY = 16,
  FRIDAY = 32,
  SATURDAY = 64,
  WEEKENDS = 1 | 64,
  WEEKDAYS = 2 | 4 | 8 | 16 | 32,
  EVERYDAY = 1 | 2 | 4 | 8 | 16 | 32 | 64,
}

export const DAYS_OF_WEEK = [
  DaysOfWeek.SUNDAY,
  DaysOfWeek.MONDAY,
  DaysOfWeek.TUESDAY,
  DaysOfWeek.WEDNESDAY,
  DaysOfWeek.THURSDAY,
  DaysOfWeek.FRIDAY,
  DaysOfWeek.SATURDAY,
];
export const SHORT_DAY_NAMES = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];
export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export const SHORT_MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export class DateTimeUtils {
  static END_OF_DAY = "24:00";
  static END_OF_DAY_SECONDS = "24:00:00";

  static getFirstDayOfWeek(date: Date | string): Date {
    const firstDayOfWeek = DateTimeUtils.toDate(date);
    firstDayOfWeek.setDate(firstDayOfWeek.getDate() - firstDayOfWeek.getDay());
    return firstDayOfWeek;
  }

  static getDateParts(date: Date | string) {
    const parts = { year: 0, month: 0, date: 0 };
    if (typeof date === "string") {
      if (date.indexOf("-") > 1) {
        const dateParts = date.split("-");
        parts.year = parseInt(dateParts[0], 10);
        parts.month = parseInt(dateParts[1], 10);
        parts.date = parseInt(dateParts[2], 10);
      } else if (date.indexOf("/") > 1) {
        const dateParts = date.split("/");
        parts.year = parseInt(dateParts[2], 10);
        parts.month = parseInt(dateParts[0], 10);
        parts.date = parseInt(dateParts[1], 10);
      }
    } else if (date) {
      parts.year = date.getFullYear();
      parts.month = date.getMonth() + 1;
      parts.date = date.getDate();
    }
    return parts;
  }

  static getDayName(dow: DaysOfWeek): string {
    return DAY_NAMES[DAYS_OF_WEEK.indexOf(dow)];
  }

  static addDays(startDate: Date | string, numDays: number): Date {
    const date = DateTimeUtils.toDate(startDate);
    date.setDate(date.getDate() + numDays);
    return date;
  }

  static truncateSeconds(time: string): string {
    const timeParts = time.split(":");
    return timeParts[0] + ":" + timeParts[1];
  }

  static toString(date: Date | string, format?: DateTimeFormat) {
    const dateParts = DateTimeUtils.getDateParts(date);
    switch (format) {
      case DateTimeFormat.SHORT_DAY_OF_WEEK_DESC:
        return (
          SHORT_DAY_NAMES[DateTimeUtils.toDate(date).getDay()] +
          ", " +
          SHORT_MONTH_NAMES[dateParts.month - 1] +
          " " +
          this.pad2(dateParts.date)
        );
      case DateTimeFormat.SHORT_DESC:
        return (
          SHORT_MONTH_NAMES[dateParts.month - 1] +
          " " +
          this.pad2(dateParts.date) +
          " " +
          dateParts.year
        );
      case DateTimeFormat.DAY_AND_MONTH:
        return (
          MONTH_NAMES[dateParts.month - 1] + " " + this.pad2(dateParts.date)
        );
      case DateTimeFormat.US_DATE:
        return (
          DateTimeUtils.pad2(dateParts.month) +
          "/" +
          DateTimeUtils.pad2(dateParts.date) +
          +"/" +
          dateParts.year
        );
      default:
        return (
          DateTimeUtils.pad2(dateParts.year) +
          "-" +
          DateTimeUtils.pad2(dateParts.month) +
          "-" +
          DateTimeUtils.pad2(dateParts.date)
        );
    }
  }

  static toDate(date: Date | string) {
    if (typeof date === "string") {
      const dateParts = DateTimeUtils.getDateParts(date);
      return new Date(dateParts.year, dateParts.month - 1, dateParts.date);
    }
    date = date as Date;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  static getDateStringFromLocalDateTime(dateTime: string) {
    //yyyy-MM-dd-HH-mm-ss
    const dateTimeParts: string[] = dateTime.split("-");
    return (
      dateTimeParts[0].slice(-2) +
      "-" +
      dateTimeParts[1] +
      "-" +
      dateTimeParts[2]
    );
  }

  static getTimeStringFromLocalDateTime(dateTime: string) {
    //yyyy-MM-dd-HH-mm-ss
    const dateTimeParts: string[] = dateTime.split("-");
    return dateTimeParts[3] + ":" + dateTimeParts[4];
  }

  static isTwelveHourTime(time: string) {
    return (
      time.toUpperCase().indexOf("A") >= 0 ||
      time.toUpperCase().indexOf("P") >= 0
    );
  }

  static toTwentyFourHourTime(twelveHourTime: string) {
    if (!DateTimeUtils.isTwelveHourTime(twelveHourTime)) {
      return twelveHourTime;
    }

    let isPm = false;
    let index = twelveHourTime.toUpperCase().indexOf("A");
    let timeParts: string[] = [];
    if (index >= 0) {
      timeParts = twelveHourTime.substring(0, index).trim().split(":");
    }

    index = twelveHourTime.toUpperCase().indexOf("P");
    if (index >= 0) {
      timeParts = twelveHourTime.substring(0, index).trim().split(":");
      isPm = true;
    }

    const parts = { hours: 0, minutes: 0, seconds: -1 };
    parts.hours = parseInt(timeParts[0], 10);
    parts.minutes = parseInt(timeParts[1], 10);
    if (timeParts.length > 2) {
      parts.seconds = parseInt(timeParts[2], 10);
    }

    if (isPm) {
      parts.hours = (parts.hours % 12) + 12;
    } else {
      parts.hours = parts.hours % 12;
    }

    let twentyFourHourTime =
      DateTimeUtils.pad2(parts.hours) + ":" + DateTimeUtils.pad2(parts.minutes);
    if (parts.seconds !== -1) {
      twentyFourHourTime +=
        twentyFourHourTime + ":" + DateTimeUtils.pad2(parts.seconds);
    }
    return twentyFourHourTime;
  }

  static toTwelveHourTime(
    twentyFourHourTime: string,
    trimHours?: boolean,
    truncateMinutesIfTopOfHour?: boolean
  ) {
    if (DateTimeUtils.isTwelveHourTime(twentyFourHourTime)) {
      return twentyFourHourTime;
    }

    const parts = { hours: 0, minutes: 0, seconds: -1, ampm: "AM" };
    const timeParts = twentyFourHourTime.split(":");
    parts.hours = parseInt(timeParts[0], 10);
    parts.ampm = parts.hours < 12 ? "AM" : "PM";
    parts.hours = parts.hours % 12;
    if (!parts.hours) {
      parts.hours = 12;
    }
    parts.minutes = parseInt(timeParts[1], 10);
    if (timeParts.length > 2) {
      parts.seconds = parseInt(timeParts[2], 10);
    }

    let twelveHourTime = trimHours
      ? parts.hours.toString()
      : DateTimeUtils.pad2(parts.hours);
    twelveHourTime =
      truncateMinutesIfTopOfHour && parts.minutes === 0
        ? twelveHourTime
        : twelveHourTime + ":" + DateTimeUtils.pad2(parts.minutes);
    twelveHourTime += " " + parts.ampm;

    return twelveHourTime;
  }

  static addTime(twentyFourHourTime: string, timeToAdd: string | number) {
    const parts = { hours: 0, minutes: 0, seconds: -1 };

    let timeParts = twentyFourHourTime.split(":");
    parts.hours = parseInt(timeParts[0], 10);
    parts.minutes = parseInt(timeParts[1], 10);
    if (timeParts.length > 2) {
      parts.seconds = parseInt(timeParts[2], 10);
    }

    const addParts = { hours: 0, minutes: 0 };

    if (typeof timeToAdd === "number") {
      addParts.hours = Math.floor(timeToAdd / 60);
      addParts.minutes = Math.floor(timeToAdd % 60);
    } else {
      timeParts = timeToAdd.split(":");
      addParts.hours = parseInt(timeParts[0], 10);
      addParts.minutes = timeParts.length > 1 ? parseInt(timeParts[1], 10) : 0;
    }

    if (timeParts.length > 2) {
      if (parts.seconds === -1) {
        parts.seconds = 0;
      }
      parts.seconds += parseInt(timeParts[2]);
      parts.minutes += Math.floor(parts.seconds / 60);
      parts.seconds = parts.seconds % 60;
    }

    parts.minutes += addParts.minutes;
    parts.hours += Math.floor(parts.minutes / 60);
    parts.minutes = parts.minutes % 60;

    parts.hours += addParts.hours;

    let newTime =
      DateTimeUtils.pad2(parts.hours) + ":" + DateTimeUtils.pad2(parts.minutes);
    if (parts.seconds !== -1) {
      newTime += ":" + DateTimeUtils.pad2(parts.seconds);
    }

    if (newTime > DateTimeUtils.END_OF_DAY) {
      return parts.seconds === -1
        ? DateTimeUtils.END_OF_DAY
        : DateTimeUtils.END_OF_DAY_SECONDS;
    }
    return newTime;
  }

  static getMinutes(militaryTime: string) {
    const timeParts = militaryTime.split(":");
    return parseInt(timeParts[0], 10) * 60 + parseInt(timeParts[1], 10);
  }

  static calculateDuration(startTime: string, endTime: string | null) {
    if (!endTime) {
      endTime = DateTimeUtils.END_OF_DAY;
    }
    return (
      DateTimeUtils.getMinutes(endTime) - DateTimeUtils.getMinutes(startTime)
    );
  }

  static pad2(number: number) {
    return (number < 10 ? "0" : "") + number;
  }

  static dateFallsOnDayOfWeek = function (
    date: Date | string,
    daysOfWeek: number | DaysOfWeek
  ) {
    return (
      (DAYS_OF_WEEK[DateTimeUtils.toDate(date).getDay()] & daysOfWeek) !== 0
    );
  };

  static elapsedDays = function (
    startDate: Date | string,
    endDate: Date | string
  ) {
    return Math.floor(
      (DateTimeUtils.toDate(endDate).getTime() -
        DateTimeUtils.toDate(startDate).getTime()) /
        (1000 * 3600 * 24)
    );
  };
}
