export enum GradeLevel {
  PRE_K2 = "pk2",
  PRE_K3 = "pk3",
  PRE_K4 = "pk4",
  PRE_K = "pk",
  KINDERGARTEN = "k",
  FIRST = "1",
  SECOND = "2",
  THIRD = "3",
  FOURTH = "4",
  FIFTH = "5",
  SIXTH = "6",
  SEVENTH = "7",
  EIGHTH = "8",
  NINTH = "9",
  TENTH = "10",
  ELEVENTH = "11",
  TWELFTH = "12",
  UNKNOWN = "",
}

export const getGradeName = (grade: GradeLevel): string => {
  switch (grade) {
    case GradeLevel.PRE_K2:
      return "Pre-K2";
    case GradeLevel.PRE_K3:
      return "Pre-K3";
    case GradeLevel.PRE_K4:
      return "Pre-K4";
    case GradeLevel.PRE_K:
      return "Pre-K";
    case GradeLevel.KINDERGARTEN:
      return "Kind.";
    case GradeLevel.FIRST:
      return "1st";
    case GradeLevel.SECOND:
      return "2nd";
    case GradeLevel.THIRD:
      return "3rd";
    case GradeLevel.FOURTH:
      return "4th";
    case GradeLevel.FIFTH:
      return "5th";
    case GradeLevel.SIXTH:
      return "6th";
    case GradeLevel.SEVENTH:
      return "7th";
    case GradeLevel.EIGHTH:
      return "8th";
    case GradeLevel.NINTH:
      return "9th";
    case GradeLevel.TENTH:
      return "10th";
    case GradeLevel.ELEVENTH:
      return "11th";
    case GradeLevel.TWELFTH:
      return "12th";
    default:
      return "Unknown";
  }
};
