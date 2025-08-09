interface DataTableProps {
  className?: string;
}

export default function DataTable({ className }: DataTableProps) {
  return (
    <div className={`overflow-auto flex flex-col h-full justify-between ${className}`}>
      <table className="table">
        <thead>
          <tr>
            <th>
              <label>
                <input type="checkbox" className="checkbox" />
              </label>
            </th>
            <th>Tiện ích bổ sung</th>
            <th>Tác giả</th>
            <th>Hoạt động</th>
            <th>Trạng thái</th>
            <th></th>
          </tr>
        </thead>
      </table>
    </div>
  );
}
