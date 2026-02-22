export interface FortuneRecord {
  id: string;
  date: string;
  fortune: string;
  luckyColor: string;
  luckyColorHex: string;
  advice: string;
  photo?: string; // base64
}

export interface User {
  username: string;
  isLoggedIn: boolean;
}
