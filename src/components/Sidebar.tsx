import type { Category, LibraryFilter } from "../types/domain";
import { categoryIcons, utilityIcons } from "./icons";

type SidebarProps = {
  activeFilter: LibraryFilter;
  categories: Category[];
  promptCount: number;
  onFilterChange: (filter: LibraryFilter) => void;
};

export function Sidebar({ activeFilter, categories, promptCount, onFilterChange }: SidebarProps) {
  const items = [
    { id: "all" as const, label: "All Prompts", Icon: utilityIcons.all },
    { id: "favorites" as const, label: "Favorites", Icon: utilityIcons.favorites },
    ...categories.map((category) => ({
      id: category.id,
      label: category.name,
      Icon: categoryIcons[category.icon || category.id] || categoryIcons.tag
    }))
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">P</div>
        <div>
          <strong>Prompt Magnus</strong>
          <span>Desktop</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Prompt filters">
        {items.map(({ id, label, Icon }) => (
          <button
            className={activeFilter === id ? "sidebar-item active" : "sidebar-item"}
            key={id}
            onClick={() => onFilterChange(id)}
            type="button"
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <button
        className={activeFilter === "settings" ? "sidebar-item active settings-link" : "sidebar-item settings-link"}
        onClick={() => onFilterChange("settings")}
        type="button"
      >
        <utilityIcons.settings size={18} />
        <span>Settings</span>
      </button>

      <span className="prompt-count">{promptCount} prompts</span>
    </aside>
  );
}
