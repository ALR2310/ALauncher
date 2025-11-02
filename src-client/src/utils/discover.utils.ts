export interface CategoryNode {
  id: number;
  name: string;
  iconUrl?: string;
  children: CategoryNode[];
}

export function buildCategoryTree(categories: any[], rootParentId: number): CategoryNode[] {
  const map = new Map<number, CategoryNode>();

  for (const cat of categories) {
    map.set(cat.id, { id: cat.id, name: cat.name, iconUrl: cat.iconUrl, children: [] });
  }

  const roots: CategoryNode[] = [];
  for (const cat of categories) {
    const node = map.get(cat.id)!;
    if (cat.parentCategoryId === rootParentId) {
      roots.push(node);
    } else {
      const parent = map.get(cat.parentCategoryId);
      if (parent) parent.children.push(node);
    }
  }

  return roots;
}
