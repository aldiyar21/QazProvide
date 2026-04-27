import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Loader from "../Layout/Loader";
import { getAllOrdersOfShop } from "../../redux/actions/order";
import {
  ActionButton,
  ModernDataGrid,
  StatusBadge,
  TablePanel,
} from "../Common/ModernDataGrid";

const AllRefundOrders = () => {
  const { orders, isLoading } = useSelector((state) => state.order);
  const { seller } = useSelector((state) => state.seller);

  const dispatch = useDispatch();

  useEffect(() => {
    if (seller?._id) {
      dispatch(getAllOrdersOfShop(seller._id));
    }
  }, [dispatch, seller?._id]);

  const refundOrders =
    orders?.filter(
      (item) => item.status === "Processing refund" || item.status === "Refund Success"
    ) || [];

  const columns = [
    { field: "id", headerName: "ID заказа", minWidth: 190, flex: 1 },
    {
      field: "status",
      headerName: "Статус",
      minWidth: 160,
      flex: 0.8,
      renderCell: (params) => <StatusBadge status={params.value} />,
    },
    {
      field: "itemsQty",
      headerName: "Товаров",
      type: "number",
      minWidth: 120,
      flex: 0.6,
    },
    {
      field: "total",
      headerName: "Итого",
      minWidth: 140,
      flex: 0.7,
    },
    {
      field: "action",
      flex: 0.8,
      minWidth: 150,
      headerName: "",
      sortable: false,
      renderCell: (params) => (
        <ActionButton to={`/order/${params.id}`} label="Детали" />
      ),
    },
  ];

  const rows = refundOrders.map((item) => ({
    id: item._id,
    itemsQty: item.cart.length,
    total: `${item.totalPrice} ₸`,
    status: item.status,
  }));

  return isLoading ? (
    <Loader />
  ) : (
    <TablePanel
      title="Возвраты"
      subtitle="Отдельный список заказов, по которым клиент запросил возврат или возврат уже завершен."
      metric={`${rows.length} возвратов`}
    >
      <ModernDataGrid rows={rows} columns={columns} pageSize={10} />
    </TablePanel>
  );
};

export default AllRefundOrders;
