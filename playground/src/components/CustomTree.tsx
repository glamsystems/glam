import React, { useState, useEffect, useCallback } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FileIcon,
  FileTextIcon,
} from "@radix-ui/react-icons";
import { Checkbox } from "@/components/ui/checkbox";

// Define the TreeNodeData interface
export interface TreeNodeData {
  id: string;
  label: string;
  checked?: boolean;
  indeterminate?: boolean;
  collapsed?: boolean; // Used only for initial state
  icon?: React.ReactNode;
  children?: TreeNodeData[];
}

// Props for the TreeNode component
interface TreeNodeProps {
  node: TreeNodeData;
  level: number;
  onToggle: (nodeId: string) => void;
  onCheck: (nodeId: string, checked: boolean) => void;
  expandedNodes: Set<string>;
  setTreeData: React.Dispatch<React.SetStateAction<TreeNodeData>>;
  updateTree: (node: TreeNodeData, nodeId: string, checked: boolean) => TreeNodeData;
}

// Utility function to update the tree recursively
const updateTree = (node: TreeNodeData, nodeId: string, checked: boolean): TreeNodeData => {
  if (node.id === nodeId) {
    const updateChildren = (children: TreeNodeData[] | undefined): TreeNodeData[] | undefined => {
      return children?.map((child) => ({
        ...child,
        checked,
        indeterminate: false,
        children: updateChildren(child.children),
      }));
    };

    return {
      ...node,
      checked,
      indeterminate: false,
      children: updateChildren(node.children),
    };
  }

  if (node.children) {
    const updatedChildren = node.children.map((child) => updateTree(child, nodeId, checked));
    const allChecked = updatedChildren.every((child) => child.checked);
    const someChecked = updatedChildren.some((child) => child.checked || child.indeterminate);

    return {
      ...node,
      checked: allChecked,
      indeterminate: !allChecked && someChecked,
      children: updatedChildren,
    };
  }

  return node;
};

// Initialize the expanded nodes based on the initial collapsed state
const initializeExpandedNodes = (node: TreeNodeData, expandedNodes: Set<string>) => {
  if (node.children && node.children.length > 0) {
    if (!node.collapsed) {
      expandedNodes.add(node.id);
    }
    node.children.forEach(child => initializeExpandedNodes(child, expandedNodes));
  }
};

// TreeNode component
const TreeNode: React.FC<TreeNodeProps> = React.memo(
  ({ node, level, onToggle, onCheck, expandedNodes, setTreeData, updateTree }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);

    const handleToggle = useCallback(() => {
      onToggle(node.id);
    }, [onToggle, node.id]);

    const handleCheck = useCallback((nodeId: string, checked: boolean) => {
      setTreeData((prevData) => updateTree(prevData, nodeId, checked));
    }, [setTreeData, updateTree]);

    const getIcon = () => {
      if (node.icon) {
        return node.icon;
      }
      if (hasChildren) {
        return isExpanded ? (
          <ChevronDownIcon className="w-4 h-4" />
        ) : (
          <ChevronRightIcon className="w-4 h-4" />
        );
      }
      return node.children ? (
        <FileTextIcon className="w-4 h-4" />
      ) : (
        <FileIcon className="w-4 h-4" />
      );
    };

    const checkedState: boolean | 'indeterminate' = node.indeterminate
      ? 'indeterminate'
      : !!node.checked;

    return (
      <div className="select-none">
        <div
          className="flex items-center py-1 px-2"
          style={{ paddingLeft: `${level * 20 + 4}px` }}
        >
          <span
            onClick={handleToggle}
            className={`mr-1 ${hasChildren ? "cursor-pointer" : ""}`}
          >
            {getIcon()}
          </span>
          <Checkbox
            checked={checkedState}
            onCheckedChange={(checked: boolean | 'indeterminate') => handleCheck(node.id, checked === true)}
            className="mr-2"
          />
          <span className="text-sm">{node.label}</span>
        </div>
        {isExpanded && hasChildren && (
          <div>
            {node.children!.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                level={level + 1}
                onToggle={onToggle}
                onCheck={onCheck}
                expandedNodes={expandedNodes}
                setTreeData={setTreeData}
                updateTree={updateTree}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);

// Props for the CustomTree component
interface CustomTreeProps {
  data: TreeNodeData;
  onCheckedItemsChange?: (checkedItems: Record<string, boolean>) => void;
}

// CustomTree component
const CustomTree: React.FC<CustomTreeProps> = ({
                                                 data,
                                                 onCheckedItemsChange,
                                               }) => {
  const [treeData, setTreeData] = useState<TreeNodeData>(data);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Initialize the expanded nodes only once on mount
  useEffect(() => {
    const newExpandedNodes = new Set<string>();
    const initializeExpandedNodes = (node: TreeNodeData) => {
      if (node.children && node.children.length > 0) {
        if (!node.collapsed) {
          newExpandedNodes.add(node.id);
        }
        node.children.forEach(initializeExpandedNodes);
      }
    };
    initializeExpandedNodes(data);
    setExpandedNodes(newExpandedNodes);
  }, [data]);

  const handleCheck = useCallback((nodeId: string, checked: boolean) => {
    setTreeData((prevData) => updateTree(prevData, nodeId, checked));
  }, []);

  const handleToggle = useCallback((nodeId: string) => {
    setExpandedNodes((prevExpanded) => {
      const newExpanded = new Set(prevExpanded);
      if (newExpanded.has(nodeId)) {
        newExpanded.delete(nodeId);
      } else {
        newExpanded.add(nodeId);
      }
      return newExpanded;
    });
  }, []);

  useEffect(() => {
    const getCheckedItems = (node: TreeNodeData): Record<string, boolean> => {
      let checkedItems: Record<string, boolean> = {};
      if (node.checked) {
        checkedItems[node.id] = true;
      }
      if (node.children) {
        node.children.forEach((child) => {
          checkedItems = { ...checkedItems, ...getCheckedItems(child) };
        });
      }
      return checkedItems;
    };

    const checkedItems = getCheckedItems(treeData);
    onCheckedItemsChange?.(checkedItems);
  }, [treeData, onCheckedItemsChange]);

  return (
    <div className="p-4">
      <TreeNode
        node={treeData}
        level={0}
        onToggle={handleToggle}
        onCheck={handleCheck}
        expandedNodes={expandedNodes}
        setTreeData={setTreeData}
        updateTree={updateTree}
      />
    </div>
  );
};

export default CustomTree;
