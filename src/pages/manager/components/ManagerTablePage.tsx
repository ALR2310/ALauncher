import { Content } from '@shared/schemas/content.schema';
import { useEffect, useRef, useState } from 'react';

interface ManagerTablePageProps {
  data: Content[];
}

export default function ManagerTablePage({ data }: ManagerTablePageProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const masterCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (masterCheckboxRef.current) {
      masterCheckboxRef.current.indeterminate = selectedIds.length > 0 && selectedIds.length < data.length;
    }
  }, [selectedIds, data.length]);

  return (
    <div className="overflow-auto flex flex-col h-full justify-between m-2 bg-base-100">
      <table className="table table-sm table-pin-rows">
        <thead>
          <tr>
            <th>
              <input
                ref={masterCheckboxRef}
                type="checkbox"
                className="checkbox"
                checked={selectedIds.length === data.length && data.length > 0}
                onChange={() => {
                  if (selectedIds.length === data.length) setSelectedIds([]);
                  else setSelectedIds(data.map((item) => item.id));
                }}
              />
            </th>
            <th>Additional utilities</th>
            <th className="text-center">Author</th>
            <th className="text-center">Activity</th>
            <th className="text-center">Status</th>
            <th className="text-right">
              <button className="btn btn-soft btn-sm">
                <i className="fa-light fa-rotate"></i>
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center italic text-base-content/70">
                No contents found
              </td>
            </tr>
          )}
          {data.map((item) => (
            <tr key={item.id} className={`hover:bg-base-300 ${selectedIds.includes(item.id) ? 'bg-base-200' : ''}`}>
              <th>
                <label>
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => {
                      setSelectedIds((prev) =>
                        prev.includes(item.id) ? prev.filter((x) => x !== item.id) : [...prev, item.id],
                      );
                    }}
                  />
                </label>
              </th>
              <td>
                <div className="flex items-center gap-3">
                  <div className="w-8">
                    <img src={item.logoUrl} alt={item.name} loading="lazy" className="w-full h-full" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold">{item.name}</span>
                  </div>
                </div>
              </td>
              <td className="text-center">
                <span className="italic">{item.author}</span>
              </td>
              <td className="text-center">
                <button className="btn btn-soft btn-outline btn-sm">Update</button>
              </td>
              <td className="text-center">
                <input type="checkbox" className="toggle toggle-sm toggle-primary" />
              </td>
              <td className="text-right">
                <button className="btn btn-soft btn-sm btn-error">
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
