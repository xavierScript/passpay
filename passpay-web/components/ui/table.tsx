import React from "react";
export function Table({ children }: { children: React.ReactNode }) {
  return <table className="w-full text-sm text-left">{children}</table>;
}
export function THead({ children }: { children: React.ReactNode }) {
  return <thead className="text-[#8f8f8f]">{children}</thead>;
}
export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-[#1a1a1a]">{children}</tbody>;
}
export function TR({ children }: { children: React.ReactNode }) {
  return <tr className="hover:bg-[#1a1a1a]/50">{children}</tr>;
}
export function TH({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2 font-medium">{children}</th>;
}
export function TD({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-2">{children}</td>;
}
