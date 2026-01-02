
export interface Member {
  id: number;
  name: string;
}

export interface PointData {
  [key: string]: {
    a: number; // Attendance
    t: number; // Training
  };
}

export interface MatchSchedule {
  date: string;    // MM월 DD일
  venue: string;   // 장소
  time: string;    // 시간
  opponents: string; // 상대팀
}

export enum Quarter {
  Q1 = 1,
  Q2 = 2,
  Q3 = 3,
  Q4 = 4
}
