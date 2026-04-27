import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Loader from "../Layout/Loader";
import { getAllOrdersOfShop } from "../../redux/actions/order";
import {
  ActionButton,
  ModernDataGrid,
  StatusBadge,
  TablePanel,
} from "../Common/ModernDataGrid";

const defaultFilters = {
  query: "",
  status: "all",
  dateFrom: "",
  dateTo: "",
  minTotal: "",
  maxTotal: "",
};

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatPrice = (value) =>
  `${Number(value || 0).toLocaleString("ru-RU")} ₸`;

const normalize = (value) => String(value || "").toLowerCase();

const ClientCell = ({ row }) => (
  <div className="flex h-full min-w-0 flex-col justify-center gap-1 overflow-hidden py-2 leading-none">
    <span className="block truncate text-[14px] font-[800] leading-[18px] text-[#173d21]">
      {row.client}
    </span>
    <span className="block truncate text-[12px] leading-[16px] text-[#71806d]">
      {row.clientEmail !== "-" ? row.clientEmail : row.clientPhone}
    </span>
  </div>
);

const FilterField = ({ label, children }) => (
  <label className="flex min-w-0 flex-col gap-1 text-[11px] font-[800] uppercase tracking-[0.14em] text-[#7a8d72]">
    {label}
    {children}
  </label>
);

const filterInputClass =
  "h-[42px] w-full rounded-xl border border-[#dce9d4] bg-white px-3 text-[13px] font-[600] text-[#173d21] outline-none transition focus:border-[#148b36] focus:shadow-[0_0_0_3px_rgba(20,139,54,0.10)]";

const AllOrders = () => {
  const { orders, isLoading } = useSelector((state) => state.order);
  const { seller } = useSelector((state) => state.seller);
  const [filters, setFilters] = useState(defaultFilters);

  const dispatch = useDispatch();

  useEffect(() => {
    if (seller?._id) {
      dispatch(getAllOrdersOfShop(seller._id));
    }
  }, [dispatch, seller?._id]);

  const rows = useMemo(
    () =>
      orders?.map((item) => {
        const user = item?.user || {};
        const totalNumber = Number(item?.totalPrice || 0);
        const createdAtRaw = item?.createdAt || item?.paidAt || "";

        return {
          id: item?._id,
          client: user?.name || "Неизвестный клиент",
          clientEmail: user?.email || "-",
          clientPhone: user?.phoneNumber || "-",
          createdAt: formatDate(createdAtRaw),
          createdAtRaw,
          itemsQty:
            item?.cart?.reduce((acc, product) => acc + Number(product?.qty || 1), 0) ||
            0,
          total: formatPrice(totalNumber),
          totalNumber,
          status: item?.status || "Не указан",
        };
      }) || [],
    [orders]
  );

  const statusOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((row) => row.status).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b, "ru")
      ),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const query = normalize(filters.query.trim());
    const minTotal = filters.minTotal === "" ? null : Number(filters.minTotal);
    const maxTotal = filters.maxTotal === "" ? null : Number(filters.maxTotal);
    const dateFrom = filters.dateFrom
      ? new Date(filters.dateFrom).setHours(0, 0, 0, 0)
      : null;
    const dateTo = filters.dateTo
      ? new Date(filters.dateTo).setHours(23, 59, 59, 999)
      : null;

    return rows.filter((row) => {
      const orderDate = row.createdAtRaw
        ? new Date(row.createdAtRaw).getTime()
        : null;
      const matchesQuery =
        !query ||
        [row.id, row.client, row.clientEmail, row.clientPhone].some((value) =>
          normalize(value).includes(query)
        );
      const matchesStatus =
        filters.status === "all" || row.status === filters.status;
      const matchesDateFrom = !dateFrom || (orderDate && orderDate >= dateFrom);
      const matchesDateTo = !dateTo || (orderDate && orderDate <= dateTo);
      const matchesMinTotal =
        minTotal === null || Number.isNaN(minTotal) || row.totalNumber >= minTotal;
      const matchesMaxTotal =
        maxTotal === null || Number.isNaN(maxTotal) || row.totalNumber <= maxTotal;

      return (
        matchesQuery &&
        matchesStatus &&
        matchesDateFrom &&
        matchesDateTo &&
        matchesMinTotal &&
        matchesMaxTotal
      );
    });
  }, [filters, rows]);

  const columns = [
    { field: "id", headerName: "ID заказа", minWidth: 190, flex: 0.9 },
    {
      field: "client",
      headerName: "Клиент",
      minWidth: 230,
      flex: 1.15,
      renderCell: (params) => <ClientCell row={params.row} />,
    },
    {
      field: "createdAt",
      headerName: "Дата",
      minWidth: 150,
      flex: 0.7,
    },
    {
      field: "status",
      headerName: "Статус",
      minWidth: 150,
      flex: 0.75,
      renderCell: (params) => <StatusBadge status={params.value} />,
    },
    {
      field: "itemsQty",
      headerName: "Товаров",
      type: "number",
      minWidth: 115,
      flex: 0.55,
    },
    {
      field: "total",
      headerName: "Сумма",
      minWidth: 140,
      flex: 0.7,
    },
    {
      field: "action",
      flex: 0.7,
      minWidth: 140,
      headerName: "",
      sortable: false,
      renderCell: (params) => (
        <ActionButton to={`/order/${params.id}`} label="Детали" />
      ),
    },
  ];

  const handleFilterChange = (field) => (event) => {
    setFilters((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  return isLoading ? (
    <Loader />
  ) : (
    <TablePanel
      title="Заказы магазина"
      subtitle="Следите за клиентами, датой покупки, суммой и текущим статусом обработки."
      metric={`${filteredRows.length} из ${rows.length} заказов`}
    >
      <div className="mb-5 grid gap-3 rounded-[22px] bg-[#f8fbf5] p-4 1100px:grid-cols-[1.3fr_0.9fr_0.8fr_0.8fr_0.75fr_0.75fr_auto]">
        <FilterField label="Клиент или заказ">
          <input
            className={filterInputClass}
            type="search"
            value={filters.query}
            onChange={handleFilterChange("query")}
            placeholder="Имя, телефон, email или ID"
          />
        </FilterField>

        <FilterField label="Статус">
          <select
            className={filterInputClass}
            value={filters.status}
            onChange={handleFilterChange("status")}
          >
            <option value="all">Все статусы</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Дата от">
          <input
            className={filterInputClass}
            type="date"
            value={filters.dateFrom}
            onChange={handleFilterChange("dateFrom")}
          />
        </FilterField>

        <FilterField label="Дата до">
          <input
            className={filterInputClass}
            type="date"
            value={filters.dateTo}
            onChange={handleFilterChange("dateTo")}
          />
        </FilterField>

        <FilterField label="Сумма от">
          <input
            className={filterInputClass}
            type="number"
            min="0"
            value={filters.minTotal}
            onChange={handleFilterChange("minTotal")}
            placeholder="0"
          />
        </FilterField>

        <FilterField label="Сумма до">
          <input
            className={filterInputClass}
            type="number"
            min="0"
            value={filters.maxTotal}
            onChange={handleFilterChange("maxTotal")}
            placeholder="Любая"
          />
        </FilterField>

        <button
          type="button"
          onClick={() => setFilters(defaultFilters)}
          className="h-[42px] self-end rounded-xl bg-white px-4 text-[13px] font-[800] text-[#173d21] transition hover:bg-[#edf8e7] hover:text-[#148b36]"
        >
          Сбросить
        </button>
      </div>

      <ModernDataGrid rows={filteredRows} columns={columns} pageSize={10} />
    </TablePanel>
  );
};

export default AllOrders;
