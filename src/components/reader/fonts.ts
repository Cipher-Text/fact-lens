// A modern Bangla display face for the reader page headlines and interface.
import { Anek_Bangla } from "next/font/google";

export const anekBangla = Anek_Bangla({
  subsets: ["bengali", "latin"],
  variable: "--font-anek-bangla",
  display: "swap",
  axes: ["wdth"],
});
