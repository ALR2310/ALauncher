import { Additional } from '@shared/schema/additional.schema';

interface ManagerTablePageProps {
  data: Additional[];
}

export default function ManagerTablePage({ data }: ManagerTablePageProps) {
  return (
    <div className="overflow-auto flex flex-col h-full justify-between m-2 bg-base-100">
      <table className="table table-sm table-pin-rows">
        <thead>
          <tr>
            <th>
              <label>
                <input type="checkbox" className="checkbox" />
              </label>
            </th>
            <th>Additional utilities</th>
            <th>Author</th>
            <th>Activity</th>
            <th>Status</th>
            <th className="flex justify-end">
              <button className="btn btn-soft">
                <i className="fa-light fa-rotate"></i>
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center italic text-base-content/70">
                No items found
              </td>
            </tr>
          )}
          {data.map((item) => (
            <tr key={item.id} className="hover">
              <th>
                <label>
                  <input type="checkbox" className="checkbox" />
                </label>
              </th>
              <td>
                <div className="flex items-center gap-3">
                  <div className="avatar">
                    <img src={item.iconUrl} alt={item.name} loading="lazy" className="w-10 h-10 rounded-full" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold">{item.name}</span>
                  </div>
                </div>
              </td>
              <td>
                <span className="italic">{item.author}</span>
              </td>
              <td>
                <button className="btn btn-soft btn-outline">Update</button>
              </td>
              <td>
                <input type="checkbox" checked={true} className="toggle toggle-primary" />
              </td>
              <td>
                <button className="btn btn-soft btn-error">
                  <i className="fa-light fa-trash"></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
