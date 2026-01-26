import { Plus, Save, Trash2, Edit, RefreshCw, FileText, Download, Upload, Search } from "lucide-react";
import { Button } from "./ui/button";

interface ERPToolbarProps {
  onAdd?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onRefresh?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  onSearch?: () => void;
  showAdd?: boolean;
  showSave?: boolean;
  showDelete?: boolean;
  showEdit?: boolean;
  showRefresh?: boolean;
  showExport?: boolean;
  showImport?: boolean;
  showSearch?: boolean;
}

export default function ERPToolbar({
  onAdd,
  onSave,
  onDelete,
  onEdit,
  onRefresh,
  onExport,
  onImport,
  onSearch,
  showAdd = true,
  showSave = false,
  showDelete = false,
  showEdit = false,
  showRefresh = true,
  showExport = false,
  showImport = false,
  showSearch = false,
}: ERPToolbarProps) {
  return (
    <div className="erp-toolbar">
      {showAdd && (
        <button className="erp-toolbar-button" onClick={onAdd}>
          <Plus className="erp-toolbar-button-icon text-green-600" />
          <span className="erp-toolbar-button-label">添加</span>
        </button>
      )}
      
      {showSave && (
        <button className="erp-toolbar-button" onClick={onSave}>
          <Save className="erp-toolbar-button-icon text-blue-600" />
          <span className="erp-toolbar-button-label">保存</span>
        </button>
      )}
      
      {showEdit && (
        <button className="erp-toolbar-button" onClick={onEdit}>
          <Edit className="erp-toolbar-button-icon text-blue-600" />
          <span className="erp-toolbar-button-label">编辑</span>
        </button>
      )}
      
      {showDelete && (
        <button className="erp-toolbar-button" onClick={onDelete}>
          <Trash2 className="erp-toolbar-button-icon text-red-600" />
          <span className="erp-toolbar-button-label">删除</span>
        </button>
      )}
      
      <div className="erp-toolbar-separator" />
      
      {showRefresh && (
        <button className="erp-toolbar-button" onClick={onRefresh}>
          <RefreshCw className="erp-toolbar-button-icon text-gray-600" />
          <span className="erp-toolbar-button-label">刷新</span>
        </button>
      )}
      
      {showSearch && (
        <button className="erp-toolbar-button" onClick={onSearch}>
          <Search className="erp-toolbar-button-icon text-gray-600" />
          <span className="erp-toolbar-button-label">搜索</span>
        </button>
      )}
      
      {showExport && (
        <>
          <div className="erp-toolbar-separator" />
          <button className="erp-toolbar-button" onClick={onExport}>
            <Download className="erp-toolbar-button-icon text-gray-600" />
            <span className="erp-toolbar-button-label">导出</span>
          </button>
        </>
      )}
      
      {showImport && (
        <button className="erp-toolbar-button" onClick={onImport}>
          <Upload className="erp-toolbar-button-icon text-gray-600" />
          <span className="erp-toolbar-button-label">导入</span>
        </button>
      )}
    </div>
  );
}
