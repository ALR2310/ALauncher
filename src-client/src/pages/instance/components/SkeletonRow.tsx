export default function SkeletonRow() {
  return (
    <tr>
      <td>
        <div className="h-6 w-6 skeleton"></div>
      </td>
      <td className="flex items-center gap-4">
        <div className="h-8 w-8 skeleton"></div>
        <div className="h-5 w-[80%] skeleton"></div>
      </td>
      <td>
        <div className="h-5 w-[80%] skeleton mx-auto"></div>
      </td>
      <td>
        <div className="h-5 w-[80%] skeleton mx-auto"></div>
      </td>
      <td>
        <div className="h-5 w-[50%] skeleton mx-auto"></div>
      </td>
      <td>
        <div className="h-5 w-[50%] skeleton mx-auto"></div>
      </td>
      <td>
        <div className="h-8 w-9 skeleton ml-auto"></div>
      </td>
    </tr>
  );
}
