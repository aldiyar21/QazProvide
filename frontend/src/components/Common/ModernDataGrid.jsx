import React from "react";
import { Link } from "react-router-dom";
import { DataGrid } from "@material-ui/data-grid";
import { AiOutlineArrowRight } from "react-icons/ai";
import { MdTrackChanges } from "react-icons/md";

export const TablePanel = ({ title, subtitle, metric, children }) => (
  <section className="w-full px-3 py-5 800px:px-8">
    <div className="overflow-hidden rounded-[26px] border border-[#dce9d4] bg-white shadow-[0_22px_60px_rgba(29,78,30,0.10)]">
      <div className="relative overflow-hidden border-b border-[#dce9d4] bg-gradient-to-r from-[#f8fbf5] via-white to-[#edf8e7] px-5 py-5 800px:px-7">
        <div className="absolute right-[-70px] top-[-90px] h-[190px] w-[190px] rounded-full bg-[#148b36]/10" />
        <div className="relative flex flex-col justify-between gap-4 800px:flex-row 800px:items-end">
          <div>
            <p className="text-xs font-[800] uppercase tracking-[0.22em] text-[#75a15f]">
              QazProvide
            </p>
            <h1 className="mt-1 text-[24px] font-[800] text-[#173d21] 800px:text-[30px]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 max-w-[720px] text-[14px] leading-6 text-[#6d7d69]">
                {subtitle}
              </p>
            )}
          </div>
          {metric && (
            <div className="rounded-2xl border border-[#dce9d4] bg-white px-4 py-3 text-sm text-[#55704f] shadow-sm">
              {metric}
            </div>
          )}
        </div>
      </div>
      <div className="modern-table-wrap p-3 800px:p-5">{children}</div>
    </div>
  </section>
);

export const ModernDataGrid = (props) => (
  <div className="modern-data-grid">
    <DataGrid
      disableColumnMenu
      disableSelectionOnClick
      autoHeight
      rowHeight={64}
      {...props}
    />
  </div>
);

export const StatusBadge = ({ status }) => {
  const statusText = status || "Не указан";
  const normalized = String(statusText).toLowerCase();
  const isSuccess =
    normalized.includes("достав") ||
    normalized.includes("delivered") ||
    normalized.includes("success") ||
    normalized.includes("succeeded");
  const isRefund = normalized.includes("refund") || normalized.includes("возврат");

  const colorClass = isSuccess
    ? "text-[#14782f]"
    : isRefund
    ? "text-[#a16207]"
    : "text-[#1d4ed8]";

  return (
    <span className={`inline-flex text-[13px] font-[800] ${colorClass}`}>
      {statusText}
    </span>
  );
};

export const ActionButton = ({ to, type = "details", label = "Открыть" }) => {
  const Icon = type === "track" ? MdTrackChanges : AiOutlineArrowRight;

  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 text-[13px] font-[800] text-[#173d21] transition hover:text-[#148b36]"
    >
      <span>{label}</span>
      <Icon size={17} />
    </Link>
  );
};
