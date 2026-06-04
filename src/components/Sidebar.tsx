import type { Category, LibraryFilter, PromptPack, Workspace } from "../types/domain";
import { categoryIcons, utilityIcons } from "./icons";
import { createPackFilterId } from "../utils/promptPacks";

type SidebarProps = {
  activeFilter: LibraryFilter;
  activeWorkspaceId: string;
  categories: Category[];
  packs: PromptPack[];
  promptCount: number;
  workspaces: Workspace[];
  onFilterChange: (filter: LibraryFilter) => void;
  onWorkspaceChange: (workspaceId: string) => void;
};

export function Sidebar({
  activeFilter,
  activeWorkspaceId,
  categories,
  packs,
  promptCount,
  workspaces,
  onFilterChange,
  onWorkspaceChange
}: SidebarProps) {
  const primaryItems = [
    { id: "all" as const, label: "All Prompts", Icon: utilityIcons.all },
    { id: "favorites" as const, label: "Favorites", Icon: utilityIcons.favorites }
  ];
  const enabledPacks = packs.filter((pack) => pack.isEnabled);

  return (
    <aside className="sidebar">
      <label className="workspace-switcher">
        <span>Workspace</span>
        <select value={activeWorkspaceId} onChange={(event) => onWorkspaceChange(event.target.value)}>
          {workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.name}
            </option>
          ))}
        </select>
      </label>

      <nav className="sidebar-nav" aria-label="Prompt filters">
        {primaryItems.map(({ id, label, Icon }) => (
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

        {enabledPacks.length ? <span className="sidebar-section-label">Packs</span> : null}
        {enabledPacks.map((pack) => {
          const id = createPackFilterId(pack.id);
          return (
            <button
              className={activeFilter === id ? "sidebar-item active" : "sidebar-item"}
              key={pack.id}
              onClick={() => onFilterChange(id)}
              type="button"
            >
              <utilityIcons.packs size={18} />
              <span>{pack.name}</span>
            </button>
          );
        })}

        <span className="sidebar-section-label">Categories</span>
        {categories.map((category) => {
          const Icon = categoryIcons[category.icon || category.id] || categoryIcons.tag;
          return (
            <button
              className={activeFilter === category.id ? "sidebar-item active" : "sidebar-item"}
              key={category.id}
              onClick={() => onFilterChange(category.id)}
              type="button"
            >
              <Icon size={18} />
              <span>{category.name}</span>
            </button>
          );
        })}
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
