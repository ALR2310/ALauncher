interface EmptyStateProps {
  colSpan: number;
}

export default function EmptyState({ colSpan }: EmptyStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-center italic text-base-content/70">
        No contents found
      </td>
    </tr>
  );
}
